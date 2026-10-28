import type { RequestHandler } from "express";
import { enrollmentsService } from "./enrollments.service";

export const listMine: RequestHandler = async (req, res) => {
  res.json({ data: await enrollmentsService.listMine(req.user!.id) });
};

export const enroll: RequestHandler = async (req, res) => {
  res.status(201).json({ data: await enrollmentsService.enroll(req.user!.id, req.body.courseId) });
};

export const unenroll: RequestHandler = async (req, res) => {
  await enrollmentsService.unenroll(req.user!.id, res.locals.params.courseId);
  res.status(204).send();
};
