import type { RequestHandler } from "express";
import { instructorsService } from "./instructors.service";

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await instructorsService.list(res.locals.query.limit) });
};

export const getById: RequestHandler = async (_req, res) => {
  res.json({ data: await instructorsService.getById(res.locals.params.id) });
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json({ data: await instructorsService.create(req.body) });
};

export const update: RequestHandler = async (req, res) => {
  res.json({ data: await instructorsService.update(res.locals.params.id, req.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await instructorsService.remove(res.locals.params.id);
  res.status(204).send();
};
