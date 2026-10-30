import "./types/express";
import express from "express";
import type { RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { openApiSpec } from "./docs/openapi";

const app = express();

const docsHelmet = helmet({
  contentSecurityPolicy: false,
}) as unknown as RequestHandler;

app.disable("x-powered-by");

// Swagger UI necesita scripts inline: se monta antes de helmet con CSP propia desactivada
app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});

// Sirve los recursos localmente durante el desarrollo.
// En Vercel, los archivos de public/ se sirven desde su CDN.
app.use(
  "/swagger-ui",
  express.static("public/swagger-ui"),
);

app.get("/api/docs", docsHelmet, (_req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Turing IA · API Docs</title>

        <link
          rel="stylesheet"
          href="/swagger-ui/swagger-ui.css"
        />

        <link
          rel="icon"
          type="image/png"
          href="/swagger-ui/favicon-32x32.png"
        />

        <style>
          html {
            box-sizing: border-box;
            overflow-y: scroll;
          }

          *,
          *::before,
          *::after {
            box-sizing: inherit;
          }

          body {
            margin: 0;
            background: #fafafa;
          }

          .swagger-ui .topbar .download-url-wrapper {
            display: none;
          }
        </style>
      </head>

      <body>
        <div id="swagger-ui"></div>

        <script src="/swagger-ui/swagger-ui-bundle.js"></script>
        <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>

        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: "/api/docs.json",
              dom_id: "#swagger-ui",
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              persistAuthorization: true,
              displayRequestDuration: true
            });
          };
        </script>
      </body>
    </html>
  `);
});

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