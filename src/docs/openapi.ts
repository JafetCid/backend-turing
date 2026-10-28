/**
 * Especificación OpenAPI 3 de la API. Se sirve en /api/docs (Swagger UI)
 * y en /api/docs.json. Mantenerla sincronizada con los schemas Zod de cada módulo.
 */
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const resp = (name: string) => ({ $ref: `#/components/responses/${name}` });
const json = (schema: object) => ({ "application/json": { schema } });
const secured = [{ bearerAuth: [] }];

const idParam = (name = "id", description = "Identificador") => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 },
});

const dataOf = (schema: object) => ({
  type: "object",
  properties: { data: schema },
});

const created = (schemaName: string) => ({
  description: "Creado",
  content: json(dataOf(ref(schemaName))),
});
const ok = (schemaName: string, description = "OK") => ({
  description,
  content: json(dataOf(ref(schemaName))),
});
const okList = (schemaName: string, description = "OK") => ({
  description,
  content: json(dataOf({ type: "array", items: ref(schemaName) })),
});
const noContent = { description: "Eliminado correctamente (sin contenido)" };

const courseProps = {
  title: { type: "string", minLength: 3, maxLength: 120, example: "GraphQL con Node.js" },
  slug: { type: "string", example: "graphql-con-nodejs", description: "Opcional: se genera a partir del título." },
  description: { type: "string", maxLength: 2000, example: "Schemas, resolvers y subscriptions." },
  price: { type: "number", minimum: 0, example: 899 },
  imageUrl: { type: "string", format: "uri", example: "https://picsum.photos/seed/graphql/800/500" },
  level: { $ref: "#/components/schemas/Level" },
  durationHours: { type: "integer", minimum: 1, maximum: 1000, example: 16 },
  rating: { type: "number", minimum: 0, maximum: 5, example: 4.5 },
  featured: { type: "boolean", example: false },
  categoryId: { type: "integer", example: 1 },
  instructorId: { type: "integer", example: 2 },
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Turing IA · API de la Plataforma de Cursos",
    version: "1.0.0",
    description: [
      "API REST del reto técnico de Desarrollo de Software.",
      "",
      "**Cómo probar los endpoints protegidos:**",
      "1. Ejecuta `POST /auth/login` con `admin@demo.com` / `Admin123!` (o `user@demo.com` / `User123!`).",
      "2. Copia el valor de `data.token`.",
      "3. Pulsa **Authorize** (arriba a la derecha) y pega el token. No escribas `Bearer`, se agrega solo.",
      "",
      "Roles: `ADMIN` puede crear, editar y eliminar; `USER` puede consultar e inscribirse a cursos.",
    ].join("\n"),
  },
  servers: [{ url: "/api/v1", description: "Servidor actual" }],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Auth", description: "Registro y login (JWT)" },
    { name: "Categories", description: "Sección de los 4 cuadros" },
    { name: "Instructors", description: "Sección de los 3 círculos" },
    { name: "Courses", description: "Carrusel, lista lateral y grid de cards" },
    { name: "Enrollments", description: "Inscripciones del usuario autenticado" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Estado del servicio",
        responses: {
          "200": {
            description: "Servicio activo",
            content: json({
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", format: "date-time" },
              },
            }),
          },
        },
      },
    },

    // ---------------- Auth ----------------
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar usuario (rol USER)",
        description: "Siempre crea un usuario con rol `USER`; cualquier `role` enviado se ignora.",
        requestBody: { required: true, content: json(ref("RegisterInput")) },
        responses: {
          "201": created("AuthResult"),
          "400": resp("ValidationError"),
          "409": resp("Conflict"),
          "429": resp("TooManyRequests"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        requestBody: { required: true, content: json(ref("LoginInput")) },
        responses: {
          "200": ok("AuthResult", "Login correcto: devuelve el usuario y el token JWT"),
          "400": resp("ValidationError"),
          "401": resp("InvalidCredentials"),
          "429": resp("TooManyRequests"),
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Usuario autenticado",
        security: secured,
        responses: { "200": ok("User"), "401": resp("Unauthorized") },
      },
    },

    // ---------------- Categories ----------------
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "Listar categorías (4 cuadros)",
        responses: { "200": okList("Category") },
      },
      post: {
        tags: ["Categories"],
        summary: "Crear categoría",
        security: secured,
        requestBody: { required: true, content: json(ref("CategoryInput")) },
        responses: {
          "201": created("Category"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "409": resp("Conflict"),
        },
      },
    },
    "/categories/{id}": {
      parameters: [idParam()],
      get: {
        tags: ["Categories"],
        summary: "Obtener categoría",
        responses: { "200": ok("Category"), "400": resp("ValidationError"), "404": resp("NotFound") },
      },
      put: {
        tags: ["Categories"],
        summary: "Actualizar categoría (campos parciales)",
        security: secured,
        requestBody: { required: true, content: json(ref("CategoryUpdate")) },
        responses: {
          "200": ok("Category"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Eliminar categoría",
        description: "Falla con 409 si la categoría todavía tiene cursos.",
        security: secured,
        responses: {
          "204": noContent,
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
    },

    // ---------------- Instructors ----------------
    "/instructors": {
      get: {
        tags: ["Instructors"],
        summary: "Listar instructores (3 círculos)",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            description: "Máximo de instructores a devolver",
          },
        ],
        responses: { "200": okList("Instructor"), "400": resp("ValidationError") },
      },
      post: {
        tags: ["Instructors"],
        summary: "Crear instructor",
        security: secured,
        requestBody: { required: true, content: json(ref("InstructorInput")) },
        responses: {
          "201": created("Instructor"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
        },
      },
    },
    "/instructors/{id}": {
      parameters: [idParam()],
      get: {
        tags: ["Instructors"],
        summary: "Obtener instructor",
        responses: { "200": ok("Instructor"), "400": resp("ValidationError"), "404": resp("NotFound") },
      },
      put: {
        tags: ["Instructors"],
        summary: "Actualizar instructor (campos parciales)",
        security: secured,
        requestBody: { required: true, content: json(ref("InstructorUpdate")) },
        responses: {
          "200": ok("Instructor"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
        },
      },
      delete: {
        tags: ["Instructors"],
        summary: "Eliminar instructor",
        description: "Falla con 409 si el instructor todavía tiene cursos.",
        security: secured,
        responses: {
          "204": noContent,
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
    },

    // ---------------- Courses ----------------
    "/courses": {
      get: {
        tags: ["Courses"],
        summary: "Listar cursos con filtros y paginación",
        description: [
          "Alimenta tres secciones del wireframe:",
          "- **Carrusel:** `featured=true&limit=6`",
          "- **Lista lateral:** `limit=4&sort=latest`",
          "- **Grid de cards:** `page=1&limit=6` (+ `categoryId`). Usa `meta.hasMore` para el botón *cargar más*.",
        ].join("\n"),
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 6 } },
          { name: "categoryId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "level", in: "query", schema: ref("Level") },
          { name: "featured", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 100 }, description: "Busca en título y descripción" },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", enum: ["latest", "rating", "price_asc", "price_desc"], default: "latest" },
          },
        ],
        responses: {
          "200": {
            description: "Página de cursos",
            content: json({
              type: "object",
              properties: { data: { type: "array", items: ref("Course") }, meta: ref("PaginationMeta") },
            }),
          },
          "400": resp("ValidationError"),
        },
      },
      post: {
        tags: ["Courses"],
        summary: "Crear curso",
        security: secured,
        requestBody: { required: true, content: json(ref("CourseInput")) },
        responses: {
          "201": created("Course"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
    },
    "/courses/{id}": {
      parameters: [idParam()],
      get: {
        tags: ["Courses"],
        summary: "Obtener curso",
        responses: { "200": ok("Course"), "400": resp("ValidationError"), "404": resp("NotFound") },
      },
      put: {
        tags: ["Courses"],
        summary: "Actualizar curso (campos parciales)",
        security: secured,
        requestBody: { required: true, content: json(ref("CourseUpdate")) },
        responses: {
          "200": ok("Course"),
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
      delete: {
        tags: ["Courses"],
        summary: "Eliminar curso",
        security: secured,
        responses: {
          "204": noContent,
          "401": resp("Unauthorized"),
          "403": resp("Forbidden"),
          "404": resp("NotFound"),
        },
      },
    },

    // ---------------- Enrollments ----------------
    "/enrollments": {
      get: {
        tags: ["Enrollments"],
        summary: "Mis cursos",
        security: secured,
        responses: { "200": okList("Enrollment"), "401": resp("Unauthorized") },
      },
      post: {
        tags: ["Enrollments"],
        summary: "Inscribirme a un curso",
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["courseId"],
            properties: { courseId: { type: "integer", example: 1 } },
          }),
        },
        responses: {
          "201": {
            description: "Inscripción creada",
            content: json(
              dataOf({
                type: "object",
                properties: { courseId: { type: "integer" }, enrolledAt: { type: "string", format: "date-time" } },
              }),
            ),
          },
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "404": resp("NotFound"),
          "409": resp("Conflict"),
        },
      },
    },
    "/enrollments/{courseId}": {
      delete: {
        tags: ["Enrollments"],
        summary: "Cancelar inscripción",
        security: secured,
        parameters: [idParam("courseId", "Id del curso")],
        responses: {
          "204": noContent,
          "400": resp("ValidationError"),
          "401": resp("Unauthorized"),
          "404": resp("NotFound"),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      ValidationError: {
        description: "Datos inválidos",
        content: json(ref("ValidationError")),
      },
      InvalidCredentials: { description: "Credenciales inválidas", content: json(ref("Error")) },
      Unauthorized: { description: "Token ausente, inválido o expirado", content: json(ref("Error")) },
      Forbidden: { description: "El rol no tiene permisos para esta acción", content: json(ref("Error")) },
      NotFound: { description: "Recurso no encontrado", content: json(ref("Error")) },
      Conflict: { description: "Conflicto: registro duplicado o con relaciones", content: json(ref("Error")) },
      TooManyRequests: { description: "Límite de solicitudes excedido", content: json(ref("Error")) },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "Registro no encontrado" } },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Datos inválidos" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Invalid email" },
              },
            },
          },
        },
      },
      Role: { type: "string", enum: ["ADMIN", "USER"] },
      Level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 6 },
          total: { type: "integer", example: 18 },
          totalPages: { type: "integer", example: 3 },
          hasMore: { type: "boolean", example: true },
        },
      },

      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80, example: "Ana López" },
          email: { type: "string", format: "email", example: "ana@demo.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "Password123" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@demo.com" },
          password: { type: "string", example: "Admin123!" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Administrador" },
          email: { type: "string", example: "admin@demo.com" },
          role: ref("Role"),
        },
      },
      AuthResult: {
        type: "object",
        properties: { user: ref("User"), token: { type: "string", description: "JWT" } },
      },

      CategoryInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80, example: "Ciberseguridad" },
          slug: { type: "string", example: "ciberseguridad" },
          description: { type: "string", maxLength: 500, example: "Protege sistemas y datos." },
          imageUrl: { type: "string", format: "uri", example: "https://picsum.photos/seed/cyber/600/600" },
        },
      },
      CategoryUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          slug: { type: "string" },
          description: { type: "string", maxLength: 500 },
          imageUrl: { type: "string", format: "uri" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Desarrollo Web" },
          slug: { type: "string", example: "desarrollo-web" },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", nullable: true },
          coursesCount: { type: "integer", example: 5 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      InstructorInput: {
        type: "object",
        required: ["name", "headline"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80, example: "Luis Pérez" },
          headline: { type: "string", minLength: 2, maxLength: 120, example: "DevOps Engineer" },
          bio: { type: "string", maxLength: 1000, example: "Automatiza todo." },
          avatarUrl: { type: "string", format: "uri", example: "https://picsum.photos/seed/luis/400/400" },
        },
      },
      InstructorUpdate: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          headline: { type: "string", minLength: 2, maxLength: 120 },
          bio: { type: "string", maxLength: 1000 },
          avatarUrl: { type: "string", format: "uri" },
        },
      },
      Instructor: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Mariana Torres" },
          headline: { type: "string", example: "Ingeniera de Machine Learning" },
          bio: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true },
          coursesCount: { type: "integer", example: 5 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      CourseInput: {
        type: "object",
        required: ["title", "price", "durationHours", "categoryId", "instructorId"],
        properties: courseProps,
      },
      CourseUpdate: { type: "object", properties: courseProps },
      Course: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "React desde cero" },
          slug: { type: "string", example: "react-desde-cero" },
          description: { type: "string", nullable: true },
          price: { type: "number", example: 899 },
          imageUrl: { type: "string", nullable: true },
          level: ref("Level"),
          durationHours: { type: "integer", example: 24 },
          rating: { type: "number", example: 4.8 },
          featured: { type: "boolean" },
          categoryId: { type: "integer" },
          instructorId: { type: "integer" },
          createdById: { type: "integer", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          category: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              slug: { type: "string" },
            },
          },
          instructor: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              headline: { type: "string" },
              avatarUrl: { type: "string", nullable: true },
            },
          },
        },
      },
      Enrollment: {
        type: "object",
        properties: { enrolledAt: { type: "string", format: "date-time" }, course: ref("Course") },
      },
    },
  },
};
