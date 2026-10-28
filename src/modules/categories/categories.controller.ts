import type { RequestHandler } from "express";
import { categoriesService } from "./categories.service";

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await categoriesService.list() });
};

export const getById: RequestHandler = async (_req, res) => {
  res.json({ data: await categoriesService.getById(res.locals.params.id) });
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json({ data: await categoriesService.create(req.body) });
};

export const update: RequestHandler = async (req, res) => {
  res.json({ data: await categoriesService.update(res.locals.params.id, req.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await categoriesService.remove(res.locals.params.id);
  res.status(204).send();
};
