import { z } from "zod";

export const listInstructorsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createInstructorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  headline: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateInstructorSchema = createInstructorSchema.partial();
