import { Level, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (seed: string, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const slugify = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const categories = [
  { name: "Desarrollo Web", description: "Frontend, backend y APIs para construir productos digitales." },
  { name: "Inteligencia Artificial", description: "Machine learning, LLMs y agentes inteligentes." },
  { name: "Ciencia de Datos", description: "Análisis, SQL, estadística y visualización." },
  { name: "Cloud y DevOps", description: "Contenedores, CI/CD y despliegue en la nube." },
];

const instructors = [
  { name: "Mariana Torres", headline: "Ingeniera de Machine Learning", bio: "10 años construyendo modelos en producción para fintech y salud." },
  { name: "Carlos Ramírez", headline: "Backend Lead", bio: "Arquitecto de APIs escalables con Node.js, PostgreSQL y mensajería." },
  { name: "Sofía Hernández", headline: "Data Scientist", bio: "Especialista en analítica avanzada y storytelling con datos." },
];

type CourseSeed = [
  title: string, category: number, instructor: number, level: Level,
  hours: number, price: number, rating: number, featured: boolean, description: string,
];

// category / instructor son índices de los arreglos de arriba
const courses: CourseSeed[] = [
  ["React desde cero", 0, 1, "BEGINNER", 24, 899, 4.8, true, "Componentes, estado y hooks construyendo una app real paso a paso."],
  ["Next.js con App Router", 0, 1, "INTERMEDIATE", 18, 1199, 4.9, true, "Server Components, rutas, caché y despliegue en Vercel."],
  ["TypeScript para equipos", 0, 1, "INTERMEDIATE", 14, 799, 4.7, false, "Tipado sólido, genéricos y patrones para bases de código grandes."],
  ["APIs REST con Node.js y Express", 0, 1, "INTERMEDIATE", 20, 999, 4.8, true, "CRUD, autenticación JWT, validación y buenas prácticas de seguridad."],
  ["HTML y CSS moderno", 0, 2, "BEGINNER", 12, 499, 4.6, false, "Flexbox, Grid, diseño responsive y metodología BEM."],
  ["Fundamentos de Machine Learning", 1, 0, "BEGINNER", 30, 1299, 4.9, true, "Regresión, clasificación y evaluación de modelos con scikit-learn."],
  ["Prompt Engineering aplicado", 1, 0, "BEGINNER", 8, 599, 4.7, false, "Técnicas para obtener resultados confiables de modelos de lenguaje."],
  ["Construye agentes con LLMs", 1, 0, "ADVANCED", 22, 1599, 4.9, true, "Herramientas, memoria y orquestación de agentes autónomos."],
  ["Visión por computadora con Python", 1, 0, "ADVANCED", 26, 1399, 4.6, false, "Detección y clasificación de imágenes con redes convolucionales."],
  ["Introducción a redes neuronales", 1, 0, "INTERMEDIATE", 20, 1099, 4.8, false, "Del perceptrón al aprendizaje profundo con PyTorch."],
  ["SQL para análisis de datos", 2, 2, "BEGINNER", 16, 699, 4.8, false, "Consultas, joins, agregaciones y funciones de ventana."],
  ["Python para ciencia de datos", 2, 2, "BEGINNER", 28, 999, 4.7, true, "Pandas, NumPy y limpieza de datos con proyectos reales."],
  ["Visualización con Power BI", 2, 2, "INTERMEDIATE", 14, 849, 4.5, false, "Dashboards interactivos y modelado de datos para negocio."],
  ["Estadística aplicada", 2, 2, "INTERMEDIATE", 18, 899, 4.6, false, "Inferencia, pruebas de hipótesis y experimentos A/B."],
  ["Docker y contenedores", 3, 1, "BEGINNER", 10, 649, 4.8, false, "Imágenes, volúmenes, redes y docker compose en proyectos reales."],
  ["CI/CD con GitHub Actions", 3, 1, "INTERMEDIATE", 12, 749, 4.7, false, "Pipelines de pruebas, build y despliegue automatizado."],
  ["AWS esencial", 3, 2, "INTERMEDIATE", 24, 1249, 4.6, false, "EC2, S3, RDS e IAM para desplegar aplicaciones."],
  ["Linux para desarrolladores", 3, 1, "BEGINNER", 10, 549, 4.5, false, "Terminal, permisos, procesos y scripting en bash."],
];

async function main() {
  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("User123!", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { name: "Administrador", email: "admin@demo.com", passwordHash: adminHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: { name: "Usuario Demo", email: "user@demo.com", passwordHash: userHash, role: "USER" },
  });

  const categoryRows = [];
  for (const c of categories) {
    const slug = slugify(c.name);
    categoryRows.push(
      await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { ...c, slug, imageUrl: img(`cat-${slug}`, 600, 600) },
      }),
    );
  }

  const instructorRows = [];
  for (const [i, ins] of instructors.entries()) {
    const existing = await prisma.instructor.findFirst({ where: { name: ins.name } });
    instructorRows.push(
      existing ??
        (await prisma.instructor.create({ data: { ...ins, avatarUrl: img(`instructor-${i + 1}`, 400, 400) } })),
    );
  }

  for (const [title, cat, ins, level, durationHours, price, rating, featured, description] of courses) {
    const slug = slugify(title);
    await prisma.course.upsert({
      where: { slug },
      update: {},
      create: {
        title, slug, description, level, durationHours, price, rating, featured,
        imageUrl: img(`course-${slug}`),
        categoryId: categoryRows[cat].id,
        instructorId: instructorRows[ins].id,
        createdById: admin.id,
      },
    });
  }

  console.log(
    `Seed listo: ${categoryRows.length} categorías, ${instructorRows.length} instructores, ${courses.length} cursos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
