import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { courseIdParamSchema, enrollSchema } from "./enrollments.schema";
import * as controller from "./enrollments.controller";

export const enrollmentsRouter = Router();

// Cualquier usuario autenticado (user o admin) gestiona sus propias inscripciones
enrollmentsRouter.use(authenticate);

enrollmentsRouter.get("/", controller.listMine);
enrollmentsRouter.post("/", validate(enrollSchema), controller.enroll);
enrollmentsRouter.delete("/:courseId", validate(courseIdParamSchema, "params"), controller.unenroll);
