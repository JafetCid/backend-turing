# Turing IA · API de la Plataforma de Cursos

API REST para el reto técnico de Desarrollo de Software de **Turing Inteligencia Artificial**. Alimenta las 4 secciones dinámicas del wireframe (carrusel con lista lateral, grid de cards, 4 cuadros y 3 círculos) y cubre login con roles `ADMIN` / `USER`, CRUD completo, validación y seguridad.

## Stack

| Capa | Tecnología |
|---|---|
| Runtime / framework | Node.js 20+ · Express 5 · TypeScript |
| Base de datos | PostgreSQL 16 · Prisma ORM 6 |
| Autenticación | JWT (`jsonwebtoken`) · contraseñas con `bcryptjs` (12 rondas) |
| Validación | Zod (variables de entorno, body, query y params) |
| Seguridad | `helmet` · `cors` con lista de orígenes · `express-rate-limit` · límite de body de 100 kb |
| Documentación | OpenAPI 3 · Swagger UI (`/api/docs`) · colección de Postman |
| Pruebas | Vitest · Supertest (integración contra la BD real) |

## Requisitos

- Node.js 20 o superior
- Docker (para PostgreSQL) o una instancia de PostgreSQL 14+

## Puesta en marcha

```bash
# 1. Dependencias
npm install            # o pnpm install

# 2. Base de datos
docker compose up -d

# 3. Variables de entorno
cp .env.example .env   # cambia JWT_SECRET (mínimo 32 caracteres)

# 4. Migración, cliente de Prisma y datos de ejemplo
npx prisma migrate dev --name init
npm run db:seed

# 5. Servidor en modo desarrollo
npm run dev            # http://localhost:4000/api/v1
```

Usuarios creados por el seed:

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | `admin@demo.com` | `Admin123!` |
| USER | `user@demo.com` | `User123!` |

El seed es idempotente: puede ejecutarse varias veces sin duplicar datos. Carga 4 categorías, 3 instructores y 18 cursos (6 destacados), suficientes para probar la paginación.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con recarga (tsx watch) |
| `npm run build` / `npm start` | Compila a `dist/` y ejecuta en producción |
| `npm run typecheck` | Verifica tipos sin compilar |
| `npm test` | Pruebas de integración (requiere BD migrada y con seed) |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Datos de ejemplo |
| `npm run db:reset` | Reinicia la BD y vuelve a sembrar |
| `npm run docs:postman` | Regenera la colección de Postman |

## Endpoints

Base URL: `/api/v1`. Las respuestas exitosas usan `{ "data": ... }`; las listas paginadas agregan `meta`. Los errores usan `{ "error": "...", "details": [...] }`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servicio |
| POST | `/auth/register` | Público | Registro (siempre rol `USER`) |
| POST | `/auth/login` | Público | Login, devuelve `{ user, token }` |
| GET | `/auth/me` | Autenticado | Usuario actual |
| GET | `/categories` | Público | Categorías con `coursesCount` |
| GET | `/categories/:id` | Público | Detalle |
| POST / PUT / DELETE | `/categories[/:id]` | ADMIN | CRUD |
| GET | `/instructors?limit=` | Público | Instructores con `coursesCount` |
| GET | `/instructors/:id` | Público | Detalle |
| POST / PUT / DELETE | `/instructors[/:id]` | ADMIN | CRUD |
| GET | `/courses` | Público | Listado paginado con filtros |
| GET | `/courses/:id` | Público | Detalle con categoría e instructor |
| POST / PUT / DELETE | `/courses[/:id]` | ADMIN | CRUD |
| GET | `/enrollments` | Autenticado | Mis cursos |
| POST | `/enrollments` | Autenticado | Inscribirme `{ "courseId": 1 }` |
| DELETE | `/enrollments/:courseId` | Autenticado | Cancelar inscripción |

### Filtros de `GET /courses`

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Página |
| `limit` | 1–50 | 6 | Elementos por página |
| `categoryId` | int | – | Filtra por categoría |
| `level` | `BEGINNER` · `INTERMEDIATE` · `ADVANCED` | – | Filtra por nivel |
| `featured` | `true` / `false` | – | Solo destacados |
| `search` | string | – | Busca en título y descripción |
| `sort` | `latest` · `rating` · `price_asc` · `price_desc` | `latest` | Orden |

`meta` incluye `page`, `limit`, `total`, `totalPages` y `hasMore` (para el botón "cargar más").

## Mapeo con el wireframe

| Sección del wireframe | Petición |
|---|---|
| Carrusel (tarjetas grandes) | `GET /courses?featured=true&limit=6` |
| Lista lateral (4 elementos) | `GET /courses?limit=4&sort=latest` |
| Grid de 6 cards + filtros + cargar más | `GET /courses?page=1&limit=6&categoryId=` |
| 4 cuadros | `GET /categories` |
| 3 círculos | `GET /instructors?limit=3` |

## Arquitectura

Estructura feature-first con capas separadas dentro de cada módulo:

```
src/
├── config/env.ts          # variables de entorno validadas con Zod
├── lib/prisma.ts          # cliente único de Prisma
├── middlewares/           # authenticate, authorize, validate, errorHandler
├── modules/<feature>/     # routes → controller → service (+ schema Zod)
├── utils/                 # AppError, slugify, paginación, schemas comunes
├── routes.ts              # monta los módulos bajo /api/v1
├── app.ts                 # configuración de Express (importable en tests)
└── server.ts              # arranque y apagado limpio
```

- **routes:** declaran el endpoint y su cadena de middlewares.
- **controller:** traduce HTTP a llamadas de servicio.
- **service:** lógica de negocio y acceso a datos; no conoce `req` ni `res`.
- **schema:** contrato de entrada validado con Zod.

## Seguridad

- Contraseñas con bcrypt (12 rondas); el hash nunca se devuelve en las respuestas.
- Mensaje único `Credenciales inválidas` en login para no revelar si el email existe.
- El registro público nunca puede crear administradores: ignora cualquier `role` enviado.
- JWT firmado con secreto de al menos 32 caracteres y expiración configurable.
- Autorización por rol con el middleware `authorize("ADMIN")`.
- `helmet`, CORS restringido a `CORS_ORIGIN`, rate limit global (120/min) y en login/registro (20 por 15 min).
- Validación estricta de body, query y params; campos desconocidos se descartan.
- Errores de Prisma traducidos (`409` duplicados o relaciones, `404` inexistentes) sin exponer detalles internos; el stack solo se incluye en desarrollo.

## Base de datos

Cinco tablas normalizadas en 3NF: `users`, `categories`, `instructors`, `courses` y `enrollments` (relación N:M). El diagrama ER y las reglas de integridad están en [`docs/ER.md`](docs/ER.md); el modelo completo en [`prisma/schema.prisma`](prisma/schema.prisma).

## Documentación y prueba de endpoints

### Swagger UI (recomendado)

Con el servidor corriendo, abre **http://localhost:4000/api/docs**. La especificación OpenAPI en JSON está en `/api/docs.json` (importable también en Postman o Insomnia).

Para probar rutas protegidas:

1. Abre `POST /auth/login`, pulsa **Try it out** y **Execute** (ya trae las credenciales del admin de ejemplo).
2. Copia `data.token` de la respuesta.
3. Pulsa **Authorize**, pega el token (sin escribir `Bearer`) y confirma.
4. Ya puedes ejecutar los endpoints con candado. Con el token de `user@demo.com` verás el `403` en las rutas de ADMIN.

La especificación vive en `src/docs/openapi.ts` y una prueba automática verifica que sea un OpenAPI válido.

### Postman

Importa `docs/turing-courses-api.postman_collection.json` (o la URL `/api/docs.json`). Ejecuta **Login admin** o **Login user**: el token se guarda automáticamente en `{{token}}` y las demás peticiones lo usan.

## Pruebas

```bash
npm test
```

23 pruebas de integración: salud, documentación OpenAPI, errores, auth y roles, filtros y paginación del grid, CRUD de categorías y cursos, reglas de integridad e inscripciones. Limpian los datos que crean.

## Despliegue (opcional)

1. PostgreSQL gestionado (Neon, Supabase o Railway) y su `DATABASE_URL`.
2. API en Render o Railway: build `npm install && npm run build`, start `npm run db:deploy && npm start`.
3. Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL del frontend en Vercel), `NODE_ENV=production`.
4. Una vez: `npm run db:seed` apuntando a la BD de producción.
