import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { coursesRouter } from "./modules/courses/courses.routes";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.routes";
import { instructorsRouter } from "./modules/instructors/instructors.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/instructors", instructorsRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/enrollments", enrollmentsRouter);
