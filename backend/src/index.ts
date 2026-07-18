// =============================================================================
// BACKEND ENTRY POINT - grokbuildmultitenantproject
// =============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import { attachTenantContext } from './middleware/tenantContext';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Attach tenant context early - very important for multi-tenancy
app.use(attachTenantContext);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`Multi-tenant backend running on port ${PORT}`);
});
