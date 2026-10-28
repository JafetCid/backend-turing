import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { idParamSchema } from "../../utils/schemas";
import { createCourseSchema, listCoursesQuerySchema, updateCourseSchema } from "./courses.schema";
import * as controller from "./courses.controller";

export const coursesRouter = Router();

// Públicas: alimentan carrusel, lista lateral y grid del frontend
coursesRouter.get("/", validate(listCoursesQuerySchema, "query"), controller.list);
coursesRouter.get("/:id", validate(idParamSchema, "params"), controller.getById);

// Solo ADMIN
coursesRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCourseSchema),
  controller.create,
);
coursesRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateCourseSchema),
  controller.update,
);
coursesRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  controller.remove,
);
