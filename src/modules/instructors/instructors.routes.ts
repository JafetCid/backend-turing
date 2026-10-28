import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { idParamSchema } from "../../utils/schemas";
import {
  createInstructorSchema,
  listInstructorsQuerySchema,
  updateInstructorSchema,
} from "./instructors.schema";
import * as controller from "./instructors.controller";

export const instructorsRouter = Router();

instructorsRouter.get("/", validate(listInstructorsQuerySchema, "query"), controller.list);
instructorsRouter.get("/:id", validate(idParamSchema, "params"), controller.getById);

instructorsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createInstructorSchema),
  controller.create,
);
instructorsRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateInstructorSchema),
  controller.update,
);
instructorsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  controller.remove,
);
