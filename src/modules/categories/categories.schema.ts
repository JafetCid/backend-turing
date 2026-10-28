import { z } from "zod";
import { slugSchema } from "../../utils/schemas";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
