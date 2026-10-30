import "./types/express";
import express from "express";
import type { RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { openApiSpec } from "./docs/openapi";

const app = express();

const docsHelmet = helmet({
  contentSecurityPolicy: false,
}) as unknown as RequestHandler;

const defaultHelmet = helmet() as unknown as RequestHandler;

app.disable("x-powered-by");

// Swagger UI necesita scripts inline: se monta antes de helmet con CSP propia desactivada
app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  "/api/docs",
  docsHelmet,
  swaggerUi.serveFiles(openApiSpec),
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Turing IA · API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      url: "/api/docs.json",
    },
  }),
);

app.use(defaultHelmet);

app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()), credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    message: { error: "Demasiadas solicitudes, intenta de nuevo en un minuto" },
  }),
);
if (env.NODE_ENV !== "test") app.use(morgan("dev"));

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;