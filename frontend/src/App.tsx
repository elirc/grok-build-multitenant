import { FormEvent, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectsPage } from "./features/projects/pages/ProjectsPage";
import { OrganizationsPage } from "./features/organizations/pages/OrganizationsPage";
import { request, Session } from "./api/client";

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    [organization, setOrganization] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [signingIn, setSigningIn] = useState(false);
  const [guard, setGuard] = useState({ dirty: false, busy: false });
  const mayLeave = () =>
    !guard.busy &&
    (!guard.dirty ||
      confirm(
        "Discard unsaved project or task changes? Export the drafts first to keep them.",
      ));
  async function login(event: FormEvent) {
    event.preventDefault();
    if (signingIn) return;
    setSigningIn(true);
    setError("");
    try {
      const result = await request<Session>("/auth/login", null, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      client.clear();
      setSession(result);
      setOrganization(result.user.memberships[0]?.organization.id || "");
      setPassword("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Sign-in failed.");
    } finally {
      setSigningIn(false);
    }
  }
  return (
    <QueryClientProvider client={client}>
      <main>
        <header className="hero">
          <p className="eyebrow">TENANT WORKSPACE</p>
          <h1>Clear work. The right workspace.</h1>
          <p>
            Plan projects, track tasks, and keep each organization’s work
            together.
          </p>
        </header>
        {!session ? (
          <section className="panel login-panel">
            <h2>Sign in to your workspace</h2>
            <p>
              Use one of the fictional accounts created by the local seed
              command.
            </p>
            <form onSubmit={login}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && (
                <p className="message error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary" disabled={signingIn}>
                {signingIn ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <p className="muted">
              Your session stays in this tab’s memory. Refreshing signs you out.
            </p>
          </section>
        ) : (
          <>
            <div className="session-bar">
              <p>
                Signed in as <strong>{session.user.name}</strong>
              </p>
              <button
                disabled={guard.busy}
                onClick={() => {
                  if (mayLeave()) {
                    client.clear();
                    setSession(null);
                    setOrganization("");
                    setGuard({ dirty: false, busy: false });
                    setEmail("");
                    setError("");
                  }
                }}
              >
                Sign out
              </button>
            </div>
            {session.user.memberships.length ? (
              <>
                <OrganizationsPage
                  memberships={session.user.memberships}
                  current={organization}
                  disabled={guard.busy}
                  onChange={(id) => {
                    if (id !== organization && mayLeave()) setOrganization(id);
                  }}
                />
                <ProjectsPage
                  key={session.user.id + ":" + organization}
                  session={session}
                  membership={
                    session.user.memberships.find(
                      (m) => m.organization.id === organization,
                    )!
                  }
                  onGuardChange={setGuard}
                />
              </>
            ) : (
              <section className="panel">
                <h2>No organization access</h2>
                <p>
                  This account has no current memberships. Ask the local
                  workspace administrator to review access.
                </p>
              </section>
            )}
          </>
        )}
        <footer>
          A local learning workspace. Keep a database backup before schema
          changes.
        </footer>
      </main>
    </QueryClientProvider>
  );
}
