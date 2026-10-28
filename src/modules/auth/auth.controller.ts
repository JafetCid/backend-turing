import type { RequestHandler } from "express";
import { authService } from "./auth.service";

export const register: RequestHandler = async (req, res) => {
  res.status(201).json({ data: await authService.register(req.body) });
};

export const login: RequestHandler = async (req, res) => {
  res.json({ data: await authService.login(req.body.email, req.body.password) });
};

export const me: RequestHandler = async (req, res) => {
  res.json({ data: await authService.me(req.user!.id) });
};
