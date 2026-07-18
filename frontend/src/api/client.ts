// API client with explicit organization context
// In real apps, the current org would come from auth context or URL

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchProjects(orgId: string = 'demo-org') {
  const res = await fetch(`${API_BASE}/projects?orgId=${orgId}`);
  return res.json();
}
