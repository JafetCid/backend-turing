import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (solo minúsculas, números y guiones)");
