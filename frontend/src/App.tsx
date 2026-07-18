import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsPage } from './features/projects/pages/ProjectsPage';
import { OrganizationsPage } from './features/organizations/pages/OrganizationsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-8">
        <h1 className="text-3xl mb-8">Multi-Tenant SaaS Demo</h1>
        <OrganizationsPage />
        <div className="my-8 border-t" />
        <ProjectsPage />
      </div>
    </QueryClientProvider>
  );
}
