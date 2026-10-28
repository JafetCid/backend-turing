import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { courseInclude, serializeCourse } from "../courses/courses.service";

export const enrollmentsService = {
  async listMine(userId: number) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: { include: courseInclude } },
      orderBy: { createdAt: "desc" },
    });
    return enrollments.map((e) => ({ enrolledAt: e.createdAt, course: serializeCourse(e.course) }));
  },

  async enroll(userId: number, courseId: number) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError(404, "El curso indicado no existe");

    try {
      const enrollment = await prisma.enrollment.create({ data: { userId, courseId } });
      return { courseId: enrollment.courseId, enrolledAt: enrollment.createdAt };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Ya estás inscrito en este curso");
      }
      throw error;
    }
  },

  // P2025 si no existía la inscripción -> 404 por el errorHandler
  unenroll: (userId: number, courseId: number) =>
    prisma.enrollment.delete({ where: { userId_courseId: { userId, courseId } } }),
};
