import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/**
 * Valida con Zod. En Express 5 `req.query` es de solo lectura, por eso
 * lo validado de query/params se expone en `res.locals`.
 */
export const validate =
  (schema: ZodSchema, source: Source = "body"): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.parse(req[source]);
    if (source === "body") req.body = parsed;
    else res.locals[source] = parsed;
    next();
  };
