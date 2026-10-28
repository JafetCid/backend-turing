import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../lib/prisma";
import { slugify } from "../../utils/slugify";
import type { createCategorySchema, updateCategorySchema } from "./categories.schema";

type CreateInput = z.infer<typeof createCategorySchema>;
type UpdateInput = z.infer<typeof updateCategorySchema>;

const withCount = { _count: { select: { courses: true } } } satisfies Prisma.CategoryInclude;
type CategoryWithCount = Prisma.CategoryGetPayload<{ include: typeof withCount }>;

const serialize = ({ _count, ...category }: CategoryWithCount) => ({
  ...category,
  coursesCount: _count.courses,
});

export const categoriesService = {
  async list() {
    // Orden por id: conserva el orden de los 4 cuadros del wireframe
    const categories = await prisma.category.findMany({
      include: withCount,
      orderBy: { id: "asc" },
    });
    return categories.map(serialize);
  },

  async getById(id: number) {
    return serialize(await prisma.category.findUniqueOrThrow({ where: { id }, include: withCount }));
  },

  async create(data: CreateInput) {
    const category = await prisma.category.create({
      data: { ...data, slug: data.slug ?? slugify(data.name) },
      include: withCount,
    });
    return serialize(category);
  },

  async update(id: number, data: UpdateInput) {
    return serialize(await prisma.category.update({ where: { id }, data, include: withCount }));
  },

  // Falla con 409 si la categoría aún tiene cursos (onDelete: Restrict)
  remove: (id: number) => prisma.category.delete({ where: { id } }),
};
