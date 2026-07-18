import { Request, Response } from 'express';
import * as projectService from '../services/projectService';

export async function getProjects(req: Request, res: Response) {
  // Use context from middleware - this is the correct way in multi-tenant
  const orgId = req.currentOrgId || 'demo-org';
  const projects = await projectService.getProjectsForOrganization(orgId);
  res.json({ data: projects });
}

export async function createProject(req: Request, res: Response) {
  const { name } = req.body;
  const orgId = req.currentOrgId || 'demo-org';
  const project = await projectService.createProject(name, orgId);
  res.status(201).json({ data: project });
}
