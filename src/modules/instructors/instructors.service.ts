import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../lib/prisma";
import type { createInstructorSchema, updateInstructorSchema } from "./instructors.schema";

type CreateInput = z.infer<typeof createInstructorSchema>;
type UpdateInput = z.infer<typeof updateInstructorSchema>;

const withCount = { _count: { select: { courses: true } } } satisfies Prisma.InstructorInclude;
type InstructorWithCount = Prisma.InstructorGetPayload<{ include: typeof withCount }>;

const serialize = ({ _count, ...instructor }: InstructorWithCount) => ({
  ...instructor,
  coursesCount: _count.courses,
});

export const instructorsService = {
  async list(limit: number) {
    const instructors = await prisma.instructor.findMany({
      include: withCount,
      orderBy: { id: "asc" },
      take: limit,
    });
    return instructors.map(serialize);
  },

  async getById(id: number) {
    return serialize(await prisma.instructor.findUniqueOrThrow({ where: { id }, include: withCount }));
  },

  async create(data: CreateInput) {
    return serialize(await prisma.instructor.create({ data, include: withCount }));
  },

  async update(id: number, data: UpdateInput) {
    return serialize(await prisma.instructor.update({ where: { id }, data, include: withCount }));
  },

  remove: (id: number) => prisma.instructor.delete({ where: { id } }),
};
