import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { loginSchema, registerSchema } from "./auth.schema";
import * as controller from "./auth.controller";

// Freno a fuerza bruta en login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: "Demasiados intentos, intenta de nuevo en 15 minutos" },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), controller.register);
authRouter.post("/login", authLimiter, validate(loginSchema), controller.login);
authRouter.get("/me", authenticate, controller.me);
