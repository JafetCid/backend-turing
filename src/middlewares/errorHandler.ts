import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // JSON mal formado en el body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON mal formado" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "El registro ya existe" });
    if (err.code === "P2025") return res.status(404).json({ error: "Registro no encontrado" });
    if (err.code === "P2003") {
      return res
        .status(409)
        .json({ error: "No se puede completar la operación: hay registros relacionados" });
    }
  }

  console.error(err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
