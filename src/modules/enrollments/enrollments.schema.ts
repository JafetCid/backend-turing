import { z } from "zod";

export const enrollSchema = z.object({ courseId: z.number().int().positive() });

export const courseIdParamSchema = z.object({ courseId: z.coerce.number().int().positive() });
