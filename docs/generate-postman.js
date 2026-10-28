// Genera docs/turing-courses-api.postman_collection.json
// Uso: npm run docs:postman
const fs = require("fs");
const path = require("path");

const req = (name, method, url, { body, auth = false, test } = {}) => ({
  name,
  event: test ? [{ listen: "test", script: { type: "text/javascript", exec: test } }] : undefined,
  request: {
    method,
    header: body ? [{ key: "Content-Type", value: "application/json" }] : [],
    auth: auth ? { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] } : { type: "noauth" },
    body: body ? { mode: "raw", raw: JSON.stringify(body, null, 2) } : undefined,
    url: { raw: `{{baseUrl}}${url}`, host: ["{{baseUrl}}"], path: url.split("?")[0].split("/").filter(Boolean),
      query: url.includes("?") ? url.split("?")[1].split("&").map((p) => ({ key: p.split("=")[0], value: p.split("=")[1] })) : undefined },
  },
});

const saveToken = ["const res = pm.response.json();", "if (res.data && res.data.token) pm.collectionVariables.set('token', res.data.token);"];

const collection = {
  info: {
    name: "Turing IA - API Plataforma de Cursos",
    description: "Ejecuta primero 'Login admin' o 'Login user': el token se guarda solo en {{token}}.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:4000/api/v1" },
    { key: "token", value: "" },
  ],
  item: [
    { name: "Health", item: [req("Health check", "GET", "/health")] },
    {
      name: "Auth",
      item: [
        req("Register", "POST", "/auth/register", { body: { name: "Ana López", email: "ana@demo.com", password: "Password123" }, test: saveToken }),
        req("Login admin", "POST", "/auth/login", { body: { email: "admin@demo.com", password: "Admin123!" }, test: saveToken }),
        req("Login user", "POST", "/auth/login", { body: { email: "user@demo.com", password: "User123!" }, test: saveToken }),
        req("Me", "GET", "/auth/me", { auth: true }),
      ],
    },
    {
      name: "Categories (4 cuadros)",
      item: [
        req("Listar categorías", "GET", "/categories"),
        req("Obtener categoría", "GET", "/categories/1"),
        req("Crear categoría (ADMIN)", "POST", "/categories", { auth: true, body: { name: "Ciberseguridad", description: "Protege sistemas y datos.", imageUrl: "https://picsum.photos/seed/cyber/600/600" } }),
        req("Actualizar categoría (ADMIN)", "PUT", "/categories/1", { auth: true, body: { description: "Descripción actualizada" } }),
        req("Eliminar categoría (ADMIN)", "DELETE", "/categories/5", { auth: true }),
      ],
    },
    {
      name: "Instructors (3 círculos)",
      item: [
        req("Listar instructores", "GET", "/instructors?limit=3"),
        req("Obtener instructor", "GET", "/instructors/1"),
        req("Crear instructor (ADMIN)", "POST", "/instructors", { auth: true, body: { name: "Luis Pérez", headline: "DevOps Engineer", bio: "Automatiza todo." } }),
        req("Actualizar instructor (ADMIN)", "PUT", "/instructors/1", { auth: true, body: { headline: "Senior ML Engineer" } }),
        req("Eliminar instructor (ADMIN)", "DELETE", "/instructors/4", { auth: true }),
      ],
    },
    {
      name: "Courses (carrusel, lista lateral y grid)",
      item: [
        req("Carrusel: destacados", "GET", "/courses?featured=true&limit=6"),
        req("Lista lateral: más recientes", "GET", "/courses?limit=4&sort=latest"),
        req("Grid: página 1", "GET", "/courses?page=1&limit=6"),
        req("Grid: filtrar por categoría", "GET", "/courses?categoryId=1&page=1&limit=6"),
        req("Buscar y ordenar", "GET", "/courses?search=react&sort=rating"),
        req("Obtener curso", "GET", "/courses/1"),
        req("Crear curso (ADMIN)", "POST", "/courses", { auth: true, body: { title: "GraphQL con Node.js", description: "Schemas, resolvers y subscriptions.", price: 899, durationHours: 16, level: "INTERMEDIATE", rating: 4.5, featured: false, imageUrl: "https://picsum.photos/seed/graphql/800/500", categoryId: 1, instructorId: 2 } }),
        req("Actualizar curso (ADMIN)", "PUT", "/courses/1", { auth: true, body: { price: 799, featured: true } }),
        req("Eliminar curso (ADMIN)", "DELETE", "/courses/19", { auth: true }),
      ],
    },
    {
      name: "Enrollments (Mis cursos)",
      item: [
        req("Mis inscripciones", "GET", "/enrollments", { auth: true }),
        req("Inscribirme", "POST", "/enrollments", { auth: true, body: { courseId: 1 } }),
        req("Cancelar inscripción", "DELETE", "/enrollments/1", { auth: true }),
      ],
    },
  ],
};

const out = path.join(__dirname, "turing-courses-api.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log("Colección generada:", out);
