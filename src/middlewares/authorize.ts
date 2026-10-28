import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "No tienes permisos para esta acción");
    }
    next();
  };
