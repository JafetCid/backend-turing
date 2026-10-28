import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildMeta } from "../../utils/pagination";
import { slugify } from "../../utils/slugify";
import type {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "./courses.schema";

type ListQuery = z.infer<typeof listCoursesQuerySchema>;
type CreateInput = z.infer<typeof createCourseSchema>;
type UpdateInput = z.infer<typeof updateCourseSchema>;

export const courseInclude = {
  category: { select: { id: true, name: true, slug: true } },
  instructor: { select: { id: true, name: true, headline: true, avatarUrl: true } },
} satisfies Prisma.CourseInclude;

type CourseWithRelations = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

// Prisma devuelve Decimal como string; el frontend espera números
export const serializeCourse = (course: CourseWithRelations) => ({
  ...course,
  price: Number(course.price),
  rating: Number(course.rating),
});

const orderByMap: Record<ListQuery["sort"], Prisma.CourseOrderByWithRelationInput[]> = {
  latest: [{ createdAt: "desc" }, { id: "desc" }],
  rating: [{ rating: "desc" }, { id: "desc" }],
  price_asc: [{ price: "asc" }, { id: "desc" }],
  price_desc: [{ price: "desc" }, { id: "desc" }],
};

async function assertRelations(categoryId?: number, instructorId?: number) {
  if (categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new AppError(404, "La categoría indicada no existe");
  }
  if (instructorId !== undefined) {
    const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
    if (!instructor) throw new AppError(404, "El instructor indicado no existe");
  }
}

export const coursesService = {
  async list({ page, limit, categoryId, level, search, featured, sort }: ListQuery) {
    const where: Prisma.CourseWhereInput = {
      ...(categoryId && { categoryId }),
      ...(level && { level }),
      ...(featured !== undefined && { featured }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [courses, total] = await prisma.$transaction([
      prisma.course.findMany({
        where,
        include: courseInclude,
        orderBy: orderByMap[sort],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return { data: courses.map(serializeCourse), meta: buildMeta(page, limit, total) };
  },

  async getById(id: number) {
    return serializeCourse(
      await prisma.course.findUniqueOrThrow({ where: { id }, include: courseInclude }),
    );
  },

  async getBySlug(slug: string) {
    return serializeCourse(
      await prisma.course.findUniqueOrThrow({ where: { slug }, include: courseInclude }),
    );
  },

  async create(data: CreateInput, userId: number) {
    await assertRelations(data.categoryId, data.instructorId);
    const course = await prisma.course.create({
      data: { ...data, slug: data.slug ?? slugify(data.title), createdById: userId },
      include: courseInclude,
    });
    return serializeCourse(course);
  },

  async update(id: number, data: UpdateInput) {
    await assertRelations(data.categoryId, data.instructorId);
    return serializeCourse(await prisma.course.update({ where: { id }, data, include: courseInclude }));
  },

  remove: (id: number) => prisma.course.delete({ where: { id } }),
};
