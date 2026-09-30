# Tenant Workspace

A local React, Express, TypeScript, Prisma, and PostgreSQL application for learning reliable multi-tenant CRUD. The original starter's trusted tenant header and placeholder pages have been replaced with verified membership, project and task CRUD, role checks, version conflicts, and transactional audit history.

Start the [detailed learning course](astraupskill/README.md) for source maps, worked examples, debugging labs, exercises, and review criteria.

## Run locally

Use Node 22 and npm. PostgreSQL can run through Docker Compose or an existing local installation. The application binds its API and frontend to loopback.

```powershell
npm ci
npm run setup:local
docker compose up -d
npm run db:generate
npm run db:deploy
npm run build
npm run seed --workspace backend
```

Setup creates root `.env` and `backend/.env` with generated credentials, and refuses to overwrite either existing file. Review `backend/.env` locally to obtain `DEMO_PASSWORD`. Do not commit those files. If you already have a database, configure `backend/.env` from its example instead and use an empty dedicated database. The migration is a fresh schema, not an automatic upgrade of unknown existing data.

Start two terminals from the repository root:

```powershell
npm run dev --workspace backend
npm run dev --workspace frontend
```

Open `http://127.0.0.1:5173`. The frontend proxies `/api` to `http://127.0.0.1:4000`. `FRONTEND_URL` must match the browser origin exactly. Vite uses a strict port so it will not silently move to an origin the API rejects. If using another local port, update `WEB_PORT`, `API_PROXY_TARGET`, `PORT`, and `FRONTEND_URL` consistently.

The seed creates fictional accounts sharing the generated demo password:

| Account | Cedar Studio | Maple Works |
|---|---|---|
| `owner@example.test` | Owner | Member |
| `member@example.test` | Member | No access |
| `outsider@example.test` | No access | Owner |

Owners and admins manage projects. Every member can manage tasks within authorized projects. The seed preserves existing identities, passwords, and edits on repeat; it rejects partial fixture identities for manual review. It requires explicit `ALLOW_DEMO_SEED=yes`. These are local demonstration accounts, not a production account-management flow.

## Editing behavior

Project and task editors hold the version they loaded. A stale save or delete returns a conflict and preserves input. Export drafts before loading current values. Tenant switching and sign-out require confirmation when work is unsaved. Tokens remain in tab memory and expire after thirty minutes; refreshing signs out. Re-sign-in and manually reconcile an exported draft if a session expires.

Projects containing tasks cannot be deleted until their tasks are explicitly removed. Audits retain minimal action metadata after deletion. Project audit is visible in the UI; task audit metadata is stored in PostgreSQL. Search is bounded, literal, and paginated at twenty records. New creates do not have idempotency keys, so inspect current records before retrying an uncertain timeout.

## Verification

The repeatable helper creates its own temporary PostgreSQL cluster, applies migrations, runs checks, and stops/removes that cluster. It does not use your configured application database. Install PostgreSQL binaries and set `POSTGRES_BIN` to their directory if it differs from the Windows default `C:\Program Files\PostgreSQL\18\bin` or is not on PATH on another platform.

```powershell
npx playwright install chromium
npm test
npm run verify
```

`npm test` runs backend and frontend checks using the temporary database. `npm run verify` also builds both applications, seeds twice, drives Chromium, and creates desktop/narrow screenshots. Reports go to `.verification`. `npm run test:browser` reruns the browser checks with a new temporary database. Individual backend tests deliberately refuse an unmarked database.

Use a PostgreSQL backup/restore workflow before changing a real schema. The local setup and tests do not establish production hosting, refresh tokens, MFA, account invitations, row-level security, distributed rate limiting, or durable create idempotency. Docker Compose configuration is provided; the actual verification uses installed PostgreSQL binaries. See [measured verification scope](astraupskill/VERIFICATION.md).
