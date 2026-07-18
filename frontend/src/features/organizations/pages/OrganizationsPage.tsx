// Demo page showing tenant (organization) context

export function OrganizationsPage() {
  return (
    <div>
      <h2 className="text-xl mb-4">Current Organization</h2>
      <p>In a real app, this would show the list of organizations the user belongs to and allow switching.</p>
      <div className="mt-4 p-4 border rounded bg-white">
        <strong>Active Tenant:</strong> demo-org
      </div>
    </div>
  );
}
