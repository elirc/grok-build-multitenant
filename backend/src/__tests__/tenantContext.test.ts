import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    organizationMember: { findUnique: vi.fn() },
    project: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
  }
}));
vi.mock("../lib/prisma", () => ({ prisma: mocks.prisma }));

const { attachTenantContext } = await import("../middleware/tenantContext");

function run(headers: Record<string, string>, userId?: string) {
  const req = { headers, userId } as never;
  const next = vi.fn();
  return attachTenantContext(req, {} as never, next).then(() => ({ req: req as { tenant?: unknown }, error: next.mock.calls[0]?.[0] as { status?: number } | undefined }));
}

describe("tenant context is resolved from membership, never from the header alone", () => {
  beforeEach(() => vi.resetAllMocks());

  it("fails a request with no x-org-id before any project query", async () => {
    const { error } = await run({}, "user-1");
    expect(error?.status).toBe(400);
    expect(mocks.prisma.organizationMember.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.project.findMany).not.toHaveBeenCalled();
  });

  it("fails an unknown organization (no membership row) with 403", async () => {
    mocks.prisma.organizationMember.findUnique.mockResolvedValue(null);
    const { error, req } = await run({ "x-org-id": "11111111-1111-4111-8111-111111111111" }, "user-1");
    expect(error?.status).toBe(403);
    expect(req.tenant).toBeUndefined();
    expect(mocks.prisma.project.findMany).not.toHaveBeenCalled();
  });

  it("fails a revoked membership the same way as an unknown one", async () => {
    // A revoked member has no row (membership is deleted on revoke); the header is worthless on its own.
    mocks.prisma.organizationMember.findUnique.mockResolvedValue(null);
    const { error } = await run({ "x-org-id": "11111111-1111-4111-8111-111111111111" }, "revoked-user");
    expect(error?.status).toBe(403);
    expect(mocks.prisma.organizationMember.findUnique).toHaveBeenCalledWith({
      where: { userId_organizationId: { userId: "revoked-user", organizationId: "11111111-1111-4111-8111-111111111111" } }
    });
  });

  it("attaches the membership role, not anything the caller sent", async () => {
    mocks.prisma.organizationMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    const { error, req } = await run({ "x-org-id": "11111111-1111-4111-8111-111111111111", "x-role": "OWNER" }, "user-1");
    expect(error).toBeUndefined();
    expect(req.tenant).toEqual({ userId: "user-1", organizationId: "11111111-1111-4111-8111-111111111111", role: "MEMBER" });
  });
});
