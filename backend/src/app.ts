import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import {
  authenticate,
  authRoutes,
  currentUser,
  validateSecret,
} from "./middleware/auth";
import { attachTenantContext } from "./middleware/tenantContext";
import projectRoutes from "./routes/projectRoutes";
import { AppError, asyncRoute, errorHandler } from "./lib/errors";
import { prisma } from "./lib/prisma";

export function createApp(
  secret: string,
  frontendOrigin = "http://127.0.0.1:5173",
) {
  validateSecret(secret);
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({
      "X-Request-Id": req.requestId,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    next();
  });
  app.use(
    cors({
      origin: (origin, done) =>
        done(
          origin && origin !== frontendOrigin
            ? new AppError(403, "This browser origin is not allowed.")
            : null,
          true,
        ),
      exposedHeaders: ["Location", "X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "32kb", strict: true }));
  app.get(
    "/health",
    asyncRoute(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    }),
  );
  app.use("/api/auth", authRoutes(secret));
  app.use("/api", authenticate(secret));
  app.get(
    "/api/me",
    asyncRoute(async (req, res) => {
      res.json(await currentUser(req.userId!));
    }),
  );
  app.use("/api/projects", attachTenantContext, projectRoutes);
  app.use((_req, _res, next) => next(new AppError(404, "Route not found.")));
  app.use(errorHandler);
  return app;
}
