import { Request, Response, NextFunction, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError, asyncRoute } from "../lib/errors";
import { loginInput } from "../lib/validation";

const issuer = "tenant-workspace",
  audience = "tenant-workspace-web";
export function validateSecret(secret: string) {
  if (
    Buffer.byteLength(secret) < 32 ||
    /^(change|replace|example|your[-_ ])/i.test(secret)
  )
    throw new Error(
      "JWT_SECRET must be a generated secret of at least 32 bytes.",
    );
}
export function issueToken(userId: string, secret: string) {
  return jwt.sign({}, secret, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: "30m",
    issuer,
    audience,
  });
}
export function authenticate(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ") || header.length > 2048)
        throw new Error();
      const payload = jwt.verify(header.slice(7), secret, {
        algorithms: ["HS256"],
        issuer,
        audience,
      }) as JwtPayload;
      if (
        typeof payload.sub !== "string" ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(payload.sub)
      )
        throw new Error();
      req.userId = payload.sub;
      next();
    } catch {
      next(
        new AppError(
          401,
          "Sign in again to continue. Your editor can be exported first.",
        ),
      );
    }
  };
}
export async function currentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: {
        select: {
          role: true,
          organization: { select: { id: true, name: true } },
        },
        orderBy: { organizationId: "asc" },
      },
    },
  });
  if (!user) throw new AppError(401, "Sign in again to continue.");
  return user;
}
export function authRoutes(secret: string) {
  const router = Router();
  const attempts = new Map<string, { count: number; until: number }>();
  const dummyHash = bcrypt.hashSync("synthetic-unused-account-password", 10);
  router.post(
    "/login",
    asyncRoute(async (req, res) => {
      const now = Date.now(),
        key = req.ip || "local";
      for (const [ip, entry] of attempts)
        if (entry.until <= now) attempts.delete(ip);
      const entry = attempts.get(key) || {
        count: 0,
        until: now + 15 * 60 * 1000,
      };
      if (entry.count >= 20 || (!attempts.has(key) && attempts.size >= 1000)) {
        res.setHeader("Retry-After", "900");
        throw new AppError(
          429,
          "Too many sign-in attempts. Try again in fifteen minutes.",
        );
      }
      entry.count++;
      attempts.set(key, entry);
      const data = loginInput.parse(req.body);
      const found = await prisma.user.findUnique({
        where: { email: data.email },
      });
      const matches = await bcrypt.compare(
        data.password,
        found?.passwordHash || dummyHash,
      );
      if (!found || !matches)
        throw new AppError(401, "Email or password was not accepted.");
      res.json({
        token: issueToken(found.id, secret),
        user: await currentUser(found.id),
      });
    }),
  );
  return router;
}
