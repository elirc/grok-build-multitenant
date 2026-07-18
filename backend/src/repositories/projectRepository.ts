// =============================================================================
// PROJECT REPOSITORY
// =============================================================================
//
// Data access must always be tenant-scoped.
// Never expose methods that can query across organizations.
// =============================================================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function findByOrganizationId(orgId: string) {
  return prisma.project.findMany({
    where: { organizationId: orgId },
  });
}

export async function create(data: { name: string; organizationId: string }) {
  return prisma.project.create({ data });
}
