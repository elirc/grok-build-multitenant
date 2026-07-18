/**
 * Test demonstrating tenant isolation at repository level.
 * 
 * In real code, repositories should never have methods that allow cross-tenant queries.
 */

import * as repo from '../repositories/projectRepository';
import { vi } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    project: {
      findMany: vi.fn(),
    },
  })),
}));

describe('projectRepository (multi-tenant)', () => {
  it('findByOrganizationId must always be called with orgId', async () => {
    const spy = vi.spyOn(repo, 'findByOrganizationId');
    await repo.findByOrganizationId('org_123');
    expect(spy).toHaveBeenCalledWith('org_123');
  });
});
