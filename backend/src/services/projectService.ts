import * as projectRepo from '../repositories/projectRepository';

export async function getProjectsForOrganization(orgId: string) {
  if (!orgId) throw new Error('Organization context is required for multi-tenant access');
  return projectRepo.findByOrganizationId(orgId);
}

export async function createProject(name: string, orgId: string) {
  if (!orgId) throw new Error('Organization context is required');
  return projectRepo.create({ name, organizationId: orgId });
}
