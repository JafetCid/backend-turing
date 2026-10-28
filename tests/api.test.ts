import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import SwaggerParser from "@apidevtools/swagger-parser";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";

// Requiere la BD migrada y con seed (npm run db:migrate && npm run db:seed)
const api = request(app);
const unique = Date.now().toString(36);

let adminToken = "";
let userToken = "";
let categoryId = 0;
let instructorId = 0;
let courseId = 0;

const login = async (email: string, password: string) => {
  const res = await api.post("/api/v1/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.data.token as string;
};

beforeAll(async () => {
  adminToken = await login("admin@demo.com", "Admin123!");
  userToken = await login("user@demo.com", "User123!");
});

afterAll(async () => {
  await prisma.course.deleteMany({ where: { slug: { startsWith: `test-${unique}` } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: `test-${unique}` } } });
  await prisma.user.deleteMany({ where: { email: `nuevo-${unique}@demo.com` } });
  await prisma.$disconnect();
});

describe("Infraestructura", () => {
  it("GET /health responde ok", async () => {
    const res = await api.get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("sirve Swagger UI en /api/docs", async () => {
    const res = await api.get("/api/docs/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("la especificación OpenAPI es válida y cubre todas las rutas", async () => {
    const res = await api.get("/api/docs.json");
    expect(res.status).toBe(200);
    await expect(SwaggerParser.validate(JSON.parse(JSON.stringify(res.body)))).resolves.toBeTruthy();
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        "/auth/login", "/categories", "/categories/{id}", "/instructors", "/instructors/{id}",
        "/courses", "/courses/{id}", "/enrollments", "/enrollments/{courseId}",
      ]),
    );
  });

  it("devuelve 404 JSON en rutas inexistentes", async () => {
    const res = await api.get("/api/v1/nada");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada/i);
  });

  it("devuelve 400 con JSON mal formado", async () => {
    const res = await api
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{ esto no es json");
    expect(res.status).toBe(400);
  });
});

describe("Auth", () => {
  it("rechaza credenciales inválidas con 401", async () => {
    const res = await api.post("/api/v1/auth/login").send({ email: "admin@demo.com", password: "mal" });
    expect(res.status).toBe(401);
  });

  it("valida el body con 400 y detalle por campo", async () => {
    const res = await api.post("/api/v1/auth/register").send({ name: "A", email: "no-es-email", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
  });

  it("registra un usuario con rol USER (ignora un rol enviado)", async () => {
    const res = await api
      .post("/api/v1/auth/register")
      .send({ name: "Nuevo", email: `nuevo-${unique}@demo.com`, password: "Password123", role: "ADMIN" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("USER");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("GET /me exige token y devuelve el usuario", async () => {
    expect((await api.get("/api/v1/auth/me")).status).toBe(401);
    const res = await api.get("/api/v1/auth/me").set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("user@demo.com");
  });
});

describe("Lectura pública (secciones del wireframe)", () => {
  it("carrusel: cursos destacados", async () => {
    const res = await api.get("/api/v1/courses?featured=true&limit=6");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((c: { featured: boolean }) => c.featured)).toBe(true);
  });

  it("grid: paginación con 'cargar más' y precio numérico", async () => {
    const p1 = await api.get("/api/v1/courses?page=1&limit=6");
    const p2 = await api.get("/api/v1/courses?page=2&limit=6");
    expect(p1.body.data).toHaveLength(6);
    expect(p1.body.meta.hasMore).toBe(true);
    expect(typeof p1.body.data[0].price).toBe("number");
    const ids1 = p1.body.data.map((c: { id: number }) => c.id);
    expect(p2.body.data.some((c: { id: number }) => ids1.includes(c.id))).toBe(false);
  });

  it("filtra por categoría y búsqueda", async () => {
    const cats = await api.get("/api/v1/categories");
    const cat = cats.body.data[0];
    const res = await api.get(`/api/v1/courses?categoryId=${cat.id}`);
    expect(res.body.data.every((c: { category: { id: number } }) => c.category.id === cat.id)).toBe(true);
    expect(res.body.meta.total).toBe(cat.coursesCount);

    const search = await api.get("/api/v1/courses?search=docker");
    expect(search.body.data.length).toBeGreaterThan(0);
  });

  it("ordena por precio ascendente", async () => {
    const res = await api.get("/api/v1/courses?sort=price_asc&limit=10");
    const prices: number[] = res.body.data.map((c: { price: number }) => c.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("4 cuadros y 3 círculos", async () => {
    const cats = await api.get("/api/v1/categories");
    expect(cats.body.data).toHaveLength(4);
    const ins = await api.get("/api/v1/instructors?limit=3");
    expect(ins.body.data).toHaveLength(3);
  });

  it("valida parámetros inválidos con 400", async () => {
    expect((await api.get("/api/v1/courses?page=0")).status).toBe(400);
    expect((await api.get("/api/v1/courses/abc")).status).toBe(400);
  });

  it("curso inexistente devuelve 404", async () => {
    expect((await api.get("/api/v1/courses/999999")).status).toBe(404);
  });
});

describe("CRUD protegido por rol", () => {
  it("sin token: 401. Rol USER: 403", async () => {
    expect((await api.post("/api/v1/categories").send({ name: "X" })).status).toBe(401);
    const res = await api
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Categoría prohibida" });
    expect(res.status).toBe(403);
  });

  it("ADMIN crea categoría e instructor", async () => {
    const cat = await api
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test ${unique}`, slug: `test-${unique}-cat` });
    expect(cat.status).toBe(201);
    expect(cat.body.data.coursesCount).toBe(0);
    categoryId = cat.body.data.id;

    const dup = await api
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test ${unique}`, slug: `test-${unique}-otro` });
    expect(dup.status).toBe(409);

    const ins = await api.get("/api/v1/instructors?limit=1");
    instructorId = ins.body.data[0].id;
  });

  it("ADMIN crea, lee, actualiza y elimina un curso", async () => {
    const created = await api
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Curso de prueba",
        slug: `test-${unique}-curso`,
        price: 123.5,
        durationHours: 5,
        categoryId,
        instructorId,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.level).toBe("BEGINNER");
    expect(created.body.data.price).toBe(123.5);
    courseId = created.body.data.id;

    const read = await api.get(`/api/v1/courses/${courseId}`);
    expect(read.body.data.category.id).toBe(categoryId);

    const updated = await api
      .put(`/api/v1/courses/${courseId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 99, featured: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data.price).toBe(99);
    expect(updated.body.data.level).toBe("BEGINNER"); // el PUT parcial no resetea defaults
    expect(updated.body.data.title).toBe("Curso de prueba");
  });

  it("rechaza categoría o instructor inexistentes con 404", async () => {
    const res = await api
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Huérfano", price: 10, durationHours: 1, categoryId: 999999, instructorId });
    expect(res.status).toBe(404);
  });

  it("no permite borrar una categoría con cursos (409)", async () => {
    const res = await api.delete(`/api/v1/categories/${categoryId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });

  it("USER se inscribe, lista y cancela inscripción", async () => {
    const auth = { Authorization: `Bearer ${userToken}` };
    const enroll = await api.post("/api/v1/enrollments").set(auth).send({ courseId });
    expect(enroll.status).toBe(201);
    expect((await api.post("/api/v1/enrollments").set(auth).send({ courseId })).status).toBe(409);

    const mine = await api.get("/api/v1/enrollments").set(auth);
    expect(mine.body.data.some((e: { course: { id: number } }) => e.course.id === courseId)).toBe(true);

    expect((await api.delete(`/api/v1/enrollments/${courseId}`).set(auth)).status).toBe(204);
    expect((await api.delete(`/api/v1/enrollments/${courseId}`).set(auth)).status).toBe(404);
  });

  it("ADMIN elimina curso y luego la categoría", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    expect((await api.delete(`/api/v1/courses/${courseId}`).set(auth)).status).toBe(204);
    expect((await api.get(`/api/v1/courses/${courseId}`)).status).toBe(404);
    expect((await api.delete(`/api/v1/categories/${categoryId}`).set(auth)).status).toBe(204);
  });
});
