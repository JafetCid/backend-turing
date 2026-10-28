import { z } from "zod";
import { Level } from "@prisma/client";
import { slugSchema } from "../../utils/schemas";

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
  categoryId: z.coerce.number().int().positive().optional(),
  level: z.nativeEnum(Level).optional(),
  search: z.string().trim().max(100).optional(),
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["latest", "rating", "price_asc", "price_desc"]).default("latest"),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(0).max(99999999),
  imageUrl: z.string().url().optional(),
  level: z.nativeEnum(Level).default("BEGINNER"),
  durationHours: z.coerce.number().int().min(1).max(1000),
  rating: z.coerce.number().min(0).max(5).default(0),
  featured: z.boolean().default(false),
  categoryId: z.number().int().positive(),
  instructorId: z.number().int().positive(),
});

// partial(): los defaults no se aplican si el campo no viene en el PUT
export const updateCourseSchema = createCourseSchema.partial();
