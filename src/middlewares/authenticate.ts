import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError(401, "Token requerido");

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as unknown as {
      sub: string;
      role: Role;
    };
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    throw new AppError(401, "Token inválido o expirado");
  }
};
