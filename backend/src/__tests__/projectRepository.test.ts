import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { createApp } from "../app";
import { issueToken } from "../middleware/auth";
import { seedDemo } from "../seed";
import * as repository from "../repositories/projectRepository";

const secret = "synthetic-local-integration-secret-" + "x".repeat(40);
const password = "synthetic-only-password-2026";
let app: ReturnType<typeof createApp>;
const a = "demo_cedar",
  b = "demo_maple";
const token = (id = "demo_owner") => issueToken(id, secret);
const call = (
  method: "get" | "post" | "put" | "delete",
  path: string,
  org = a,
  user = "demo_owner",
) =>
  request(app)
    [method](path)
    .set("Authorization", "Bearer " + token(user))
    .set("x-org-id", org);
const projectValue = {
  name: "Learning API",
  description: "Practice reliable saves",
};
async function createProject(name = "Learning API") {
  const result = await call("post", "/api/projects").send({
    ...projectValue,
    name,
  });
  expect(result.status).toBe(201);
  return result.body;
}
async function createTask(projectId: string) {
  const result = await call("post", `/api/projects/${projectId}/tasks`).send({
    title: "Write a useful regression",
    status: "TODO",
  });
  expect(result.status).toBe(201);
  return result.body;
}
async function failingAudit(work: () => Promise<void>) {
  await prisma.$executeRawUnsafe(
    `CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic internal detail'; END $$`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER reject_test_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION reject_test_audit()`,
  );
  try {
    await work();
  } finally {
    await prisma.$executeRawUnsafe(
      'DROP TRIGGER reject_test_audit ON "AuditEvent"',
    );
    await prisma.$executeRawUnsafe("DROP FUNCTION reject_test_audit()");
  }
}
beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL || "http://missing");
  if (
    process.env.TENANT_TEST_DATABASE !== "owned-temporary-cluster" ||
    url.hostname !== "127.0.0.1" ||
    url.pathname !== "/astra_tenant_test"
  )
    throw new Error(
      "Use scripts/test-database.mjs with its owned temporary cluster.",
    );
});
beforeEach(async () => {
  await prisma.auditEvent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await seedDemo(password);
  app = createApp(secret);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("real PostgreSQL and HTTP tenant contract", () => {
  it("fails closed when an internal caller omits organization context", async () => {
    await expect(
      repository.findByOrganizationId(undefined as never, { q: "", page: 1 }),
    ).rejects.toThrow();
    await expect(
      repository.getProject(undefined as never, "unknown"),
    ).rejects.toThrow();
    expect(() =>
      repository.history(undefined as never, "PROJECT", "unknown"),
    ).toThrow();
  });
  it("signs in with normalized email and returns memberships without hashes", async () => {
    const result = await request(app)
      .post("/api/auth/login")
      .send({ email: " OWNER@EXAMPLE.TEST ", password });
    expect(result.status).toBe(200);
    expect(result.body.user.memberships).toHaveLength(2);
    expect(result.body.user.passwordHash).toBeUndefined();
    expect(jwt.verify(result.body.token, secret)).toMatchObject({
      sub: "demo_owner",
    });
  });
  it("returns the same rejection for missing user and bad password", async () => {
    for (const email of ["missing@example.test", "owner@example.test"]) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "incorrect" });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Email or password was not accepted.");
    }
  });
  it("rejects missing, wrong, and expired authentication", async () => {
    expect((await request(app).get("/api/projects")).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/projects")
          .set("Authorization", "Bearer wrong")
      ).status,
    ).toBe(401);
    const expired = jwt.sign({}, secret, {
      subject: "demo_owner",
      expiresIn: -1,
      issuer: "tenant-workspace",
      audience: "tenant-workspace-web",
    });
    expect(
      (
        await request(app)
          .get("/api/me")
          .set("Authorization", "Bearer " + expired)
      ).status,
    ).toBe(401);
  });
  it("requires an explicit organization header and verified membership", async () => {
    expect(
      (
        await request(app)
          .get("/api/projects")
          .set("Authorization", "Bearer " + token())
      ).status,
    ).toBe(400);
    expect((await call("get", "/api/projects", b, "demo_member")).status).toBe(
      403,
    );
  });
  it("removes access after membership revocation without trusting old JWT roles", async () => {
    const oldToken = token("demo_member");
    await prisma.organizationMember.deleteMany({
      where: { userId: "demo_member", organizationId: a },
    });
    expect(
      (
        await request(app)
          .get("/api/projects")
          .set("Authorization", "Bearer " + oldToken)
          .set("x-org-id", a)
      ).status,
    ).toBe(403);
  });
  it("lists only the selected authorized tenant", async () => {
    const cedar = await call("get", "/api/projects"),
      maple = await call("get", "/api/projects", b);
    expect(cedar.body.items.every((p: any) => p.organizationId === a)).toBe(
      true,
    );
    expect(maple.body.items.every((p: any) => p.organizationId === b)).toBe(
      true,
    );
    expect(cedar.body.items[0].id).not.toBe(maple.body.items[0].id);
  });
  it("scopes single reads and writes even when the user belongs to both tenants", async () => {
    const row = await createProject();
    expect((await call("get", "/api/projects/" + row.id, b)).status).toBe(404);
    expect(
      (
        await call("put", "/api/projects/" + row.id, b, "demo_outsider").send({
          version: 1,
          project: { name: "Wrong" },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call(
          "delete",
          "/api/projects/" + row.id,
          b,
          "demo_outsider",
        ).send({ version: 1 })
      ).status,
    ).toBe(404);
    expect(
      (await prisma.project.findUniqueOrThrow({ where: { id: row.id } })).name,
    ).toBe(row.name);
  });
  it("forbids member project mutations while allowing task CRUD", async () => {
    const row = await createProject();
    expect(
      (await call("post", "/api/projects", a, "demo_member").send(projectValue))
        .status,
    ).toBe(403);
    expect(
      (
        await call("put", "/api/projects/" + row.id, a, "demo_member").send({
          version: 1,
          project: projectValue,
        })
      ).status,
    ).toBe(403);
    const task = await call(
      "post",
      `/api/projects/${row.id}/tasks`,
      a,
      "demo_member",
    ).send({ title: "Member task", status: "TODO" });
    expect(task.status).toBe(201);
    expect(
      (
        await call(
          "put",
          `/api/projects/${row.id}/tasks/${task.body.id}`,
          a,
          "demo_member",
        ).send({ version: 1, task: { title: "Member update", status: "DONE" } })
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          "delete",
          `/api/projects/${row.id}/tasks/${task.body.id}`,
          a,
          "demo_member",
        ).send({ version: 2 })
      ).status,
    ).toBe(200);
  });
  it("reads changed roles from membership for every request", async () => {
    const row = await createProject();
    await prisma.organizationMember.update({
      where: {
        userId_organizationId: { userId: "demo_owner", organizationId: a },
      },
      data: { role: "MEMBER" },
    });
    expect(
      (await call("delete", "/api/projects/" + row.id).send({ version: 1 }))
        .status,
    ).toBe(403);
  });
  it("creates updates and deletes stable identities with retained audit", async () => {
    const row = await createProject();
    const update = await call("put", "/api/projects/" + row.id).send({
      version: 1,
      project: { name: "Renamed", description: "" },
    });
    expect(update.body).toMatchObject({
      id: row.id,
      version: 2,
      name: "Renamed",
    });
    expect(
      (await call("delete", "/api/projects/" + row.id).send({ version: 2 }))
        .status,
    ).toBe(200);
    expect((await call("get", "/api/projects/" + row.id)).status).toBe(404);
    const audit = await call("get", `/api/projects/${row.id}/audit`);
    expect(audit.body.items).toHaveLength(3);
    expect(
      (await call("get", `/api/projects/${row.id}/audit`, b)).body.items,
    ).toHaveLength(0);
  });
  it("accepts one of two concurrent project updates", async () => {
    const row = await createProject();
    const results = await Promise.all(
      ["A", "B"].map((name) =>
        call("put", "/api/projects/" + row.id).send({
          version: 1,
          project: { name },
        }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (await prisma.project.findUniqueOrThrow({ where: { id: row.id } }))
        .version,
    ).toBe(2);
    expect(
      await prisma.auditEvent.count({ where: { resourceId: row.id } }),
    ).toBe(2);
  });
  it("rejects stale deletion and preserves the current project", async () => {
    const row = await createProject();
    await call("put", "/api/projects/" + row.id).send({
      version: 1,
      project: { name: "Current" },
    });
    expect(
      (await call("delete", "/api/projects/" + row.id).send({ version: 1 }))
        .status,
    ).toBe(409);
    expect((await call("get", "/api/projects/" + row.id)).body.name).toBe(
      "Current",
    );
  });
  it("requires explicit task removal before project deletion", async () => {
    const row = await createProject(),
      task = await createTask(row.id);
    expect(
      (await call("delete", "/api/projects/" + row.id).send({ version: 1 }))
        .status,
    ).toBe(409);
    expect(
      (
        await call("delete", `/api/projects/${row.id}/tasks/${task.id}`).send({
          version: 1,
        })
      ).status,
    ).toBe(200);
    expect(
      (await call("delete", "/api/projects/" + row.id).send({ version: 1 }))
        .status,
    ).toBe(200);
  });
  it("does not allow tasks to cross tenants or route parents", async () => {
    const row = await createProject(),
      other = await createProject("Other"),
      task = await createTask(row.id);
    expect(
      (await call("get", `/api/projects/${other.id}/tasks/${task.id}`)).status,
    ).toBe(404);
    expect(
      (
        await call(
          "post",
          `/api/projects/${row.id}/tasks`,
          b,
          "demo_outsider",
        ).send({ title: "Cross", status: "TODO" })
      ).status,
    ).toBe(404);
    expect(
      (await call("get", `/api/projects/${row.id}/tasks/${task.id}`, b)).status,
    ).toBe(404);
    expect(
      (
        await call("put", `/api/projects/${other.id}/tasks/${task.id}`).send({
          version: 1,
          task: { title: "Wrong", status: "DONE" },
        })
      ).status,
    ).toBe(404);
  });
  it("enforces tenant parent matching in the database itself", async () => {
    const row = await createProject();
    await expect(
      prisma.task.create({
        data: { organizationId: b, projectId: row.id, title: "Invalid FK" },
      }),
    ).rejects.toThrow();
  });
  it("handles task concurrency and stale deletion", async () => {
    const row = await createProject(),
      task = await createTask(row.id),
      path = `/api/projects/${row.id}/tasks/${task.id}`;
    const responses = await Promise.all(
      ["One", "Two"].map((title) =>
        call("put", path).send({ version: 1, task: { title, status: "DONE" } }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await call("delete", path).send({ version: 1 })).status).toBe(409);
    expect((await call("get", path)).body.version).toBe(2);
  });
  it("rolls back project create update and delete when audit fails", async () => {
    const row = await createProject(),
      before = await prisma.project.count();
    await failingAudit(async () => {
      for (const response of [
        await call("post", "/api/projects").send({ name: "Rejected" }),
        await call("put", "/api/projects/" + row.id).send({
          version: 1,
          project: { name: "Rejected" },
        }),
        await call("delete", "/api/projects/" + row.id).send({ version: 1 }),
      ]) {
        expect(response.status).toBeGreaterThanOrEqual(500);
        expect(JSON.stringify(response.body)).not.toContain(
          "synthetic internal detail",
        );
        expect(response.body.requestId).toBe(response.headers["x-request-id"]);
      }
    });
    expect(await prisma.project.count()).toBe(before);
    expect(
      (await prisma.project.findUniqueOrThrow({ where: { id: row.id } }))
        .version,
    ).toBe(1);
    expect(
      await prisma.auditEvent.count({ where: { resourceId: row.id } }),
    ).toBe(1);
  });
  it("rolls back task mutations when their audit fails", async () => {
    const row = await createProject(),
      task = await createTask(row.id),
      path = `/api/projects/${row.id}/tasks/${task.id}`;
    await failingAudit(async () => {
      expect(
        (
          await call("put", path).send({
            version: 1,
            task: { title: "Rejected", status: "DONE" },
          })
        ).status,
      ).toBeGreaterThanOrEqual(500);
      expect(
        (await call("delete", path).send({ version: 1 })).status,
      ).toBeGreaterThanOrEqual(500);
      expect(
        (
          await call("post", `/api/projects/${row.id}/tasks`).send({
            title: "Rejected",
            status: "TODO",
          })
        ).status,
      ).toBeGreaterThanOrEqual(500);
    });
    expect(await prisma.task.count({ where: { projectId: row.id } })).toBe(1);
    expect(
      (await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).version,
    ).toBe(1);
  });
  it("uses literal wildcard search and stable bounded pages", async () => {
    await createProject("100%_ matched");
    expect(
      (await call("get", "/api/projects?q=100%25_")).body.items,
    ).toHaveLength(1);
    for (let i = 0; i < 21; i++)
      await prisma.project.create({
        data: { name: "Page " + i, organizationId: a },
      });
    const first = await call("get", "/api/projects?q=Page&page=1"),
      second = await call("get", "/api/projects?q=Page&page=2");
    expect(first.body.items).toHaveLength(20);
    expect(second.body.items).toHaveLength(1);
    expect(
      new Set([...first.body.items, ...second.body.items].map((p: any) => p.id))
        .size,
    ).toBe(21);
  });
  it("filters and pages tasks within their parent", async () => {
    const row = await createProject();
    for (let i = 0; i < 21; i++)
      await prisma.task.create({
        data: {
          organizationId: a,
          projectId: row.id,
          title: "Task " + i,
          status: "DONE",
        },
      });
    expect(
      (await call("get", `/api/projects/${row.id}/tasks?status=DONE&page=2`))
        .body.items,
    ).toHaveLength(1);
    expect(
      (await call("get", `/api/projects/${row.id}/tasks?status=TODO`)).body
        .total,
    ).toBe(0);
  });
  it("rejects unknown fields malformed bodies and oversized requests before insertion", async () => {
    const count = await prisma.project.count();
    expect(
      (
        await call("post", "/api/projects").send({
          ...projectValue,
          organizationId: b,
        })
      ).status,
    ).toBe(400);
    expect(
      (await call("post", "/api/projects?extra=1").send(projectValue)).status,
    ).toBe(400);
    expect(
      (
        await call("post", "/api/projects")
          .set("Content-Type", "application/json")
          .send("{")
      ).status,
    ).toBe(400);
    expect(
      (
        await call("post", "/api/projects").send({
          name: "A",
          description: "x".repeat(40000),
        })
      ).status,
    ).toBe(413);
    expect(await prisma.project.count()).toBe(count);
  });
  it("rejects repeated query fields and unapproved browser origins", async () => {
    expect((await call("get", "/api/projects?q=a&q=b")).status).toBe(400);
    expect(
      (
        await call("get", "/api/projects").set(
          "Origin",
          "http://unrelated.test",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call("get", "/api/projects").set(
          "Origin",
          "http://127.0.0.1:5173",
        )
      ).status,
    ).toBe(200);
  });
  it("does not overwrite existing demo passwords or edited project data", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: "demo_owner" },
    });
    await prisma.project.updateMany({
      where: { organizationId: a },
      data: { name: "Edited demo" },
    });
    expect((await seedDemo("different-synthetic-password")).created).toBe(0);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: "demo_owner" } }))
        .passwordHash,
    ).toBe(before.passwordHash);
    expect(
      (await prisma.project.findFirstOrThrow({ where: { organizationId: a } }))
        .name,
    ).toBe("Edited demo");
  });
});
