// =============================================================================
// TENANT CONTEXT MIDDLEWARE
// =============================================================================
//
// In a real multi-tenant app, this middleware would:
// 1. Extract user from JWT
// 2. Determine the current organization (from header, body, or user's default)
// 3. Attach it to req for downstream use
//
// This is one of the most critical pieces for SaaS security.
// =============================================================================

import { Request, Response, NextFunction } from 'express';

export function attachTenantContext(req: Request, res: Response, next: NextFunction) {
  // In production: decode JWT and set current org
  // For learning/demo:
  req.currentOrgId = (req.headers['x-org-id'] as string) || 'demo-org';
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      currentOrgId?: string;
    }
  }
}
