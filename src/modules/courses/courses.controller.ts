import type { RequestHandler } from "express";
import { coursesService } from "./courses.service";

export const list: RequestHandler = async (_req, res) => {
  res.json(await coursesService.list(res.locals.query));
};

export const getById: RequestHandler = async (_req, res) => {
  res.json({ data: await coursesService.getById(res.locals.params.id) });
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json({ data: await coursesService.create(req.body, req.user!.id) });
};

export const update: RequestHandler = async (req, res) => {
  res.json({ data: await coursesService.update(res.locals.params.id, req.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await coursesService.remove(res.locals.params.id);
  res.status(204).send();
};
