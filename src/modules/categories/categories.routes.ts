import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { idParamSchema } from "../../utils/schemas";
import { createCategorySchema, updateCategorySchema } from "./categories.schema";
import * as controller from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", controller.list);
categoriesRouter.get("/:id", validate(idParamSchema, "params"), controller.getById);

categoriesRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  controller.create,
);
categoriesRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateCategorySchema),
  controller.update,
);
categoriesRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  controller.remove,
);
