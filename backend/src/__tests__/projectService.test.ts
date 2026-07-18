/**
 * Example test for multi-tenant project service.
 * 
 * Key learning: Tests should verify that queries are properly scoped by organization.
 */

import * as projectService from '../services/projectService';
import * as projectRepo from '../repositories/projectRepository';
import { vi } from 'vitest';

vi.mock('../repositories/projectRepository');

describe('projectService (multi-tenant)', () => {
  it('should always pass organizationId to repository', async () => {
    const spy = vi.spyOn(projectRepo, 'findByOrganizationId').mockResolvedValue([]);

    await projectService.getProjectsForOrganization('org_123');

    expect(spy).toHaveBeenCalledWith('org_123');
  });
});
