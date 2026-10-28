import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const signToken = (user: User) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    // El rol siempre es USER: los administradores se crean por seed
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash },
    });
    return { user: publicUser(user), token: signToken(user) };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) throw new AppError(401, "Credenciales inválidas");
    return { user: publicUser(user), token: signToken(user) };
  },

  async me(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(401, "Usuario no encontrado");
    return publicUser(user);
  },
};
