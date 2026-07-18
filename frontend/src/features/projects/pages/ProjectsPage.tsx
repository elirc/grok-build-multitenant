// ProjectsPage for multi-tenant demo
// Note: In a real app, current org would come from user context or localStorage/URL.
// All data access must include the orgId to prevent cross-tenant leakage.

import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '../../api/client';

export function ProjectsPage() {
  // Demo org - replace with real context in production
  const orgId = 'org_demo_001';

  const { data, isLoading } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => fetchProjects(orgId),
  });

  if (isLoading) return <div>Loading projects for current organization...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Projects in Current Tenant</h2>
      <p className="text-sm text-gray-500 mb-3">Data is strictly isolated by organization.</p>
      {data?.data?.map((p: any) => (
        <div key={p.id} className="border p-3 mb-2 rounded">{p.name}</div>
      ))}
    </div>
  );
}
