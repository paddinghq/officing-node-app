# Officing Frontend Monorepo

Two Vite/React apps wiring into the Officing Node API.

| App | Port | Audience |
|-----|------|----------|
| `apps/tenant-web` | 5173 | Company users (finance, admin, staff) |
| `apps/platform-admin` | 5174 | Officing platform ops team |

## Quick start

```bash
# 1. Copy env files
cp apps/tenant-web/.env.example apps/tenant-web/.env
cp apps/platform-admin/.env.example apps/platform-admin/.env

# 2. Install
pnpm install

# 3. Run tenant app
pnpm dev:tenant   # → http://localhost:5173

# 4. Run platform admin
pnpm dev:admin    # → http://localhost:5174
```

Requires the API running on port 3001. See `api/README.md` for backend setup.

## Apps

### tenant-web (`/apps/tenant-web`)

Finance platform for company users.

- **Login:** `/login` — uses `POST /auth/signin` + `x-tenant-slug` header
- **Dashboard:** `/dashboard` — inflow/outflow chart (Standard+ plan)
- **Invoices:** `/invoices` — full CRUD, PDF, CSV, email send, payment recording
- **Bills:** `/bills` — vendor bills with payment recording
- **Estimates:** `/estimates` — quotes, mark-as-sent, PDF
- **Expenses:** `/expenses` — categorised expenses with CSV export
- **Customers / Merchants:** `/customers`, `/merchants` — CRUD
- **Reports:** `/reports` — P&L, AR/AP aging, expenses by category (Standard+ plan)
- **People:** `/people` — invite users (magic link), manage roles
- **Security:** `/security` — change password, MFA, recovery email
- **Notifications:** `/notifications` — list + mark read
- **Subscription:** `/subscription` — read-only plan status

### platform-admin (`/apps/platform-admin`)

Internal ops dashboard.

- **Login:** `/admin/login` — uses `POST /platform/admin/auth/login`, stores `pat` token
- **Overview:** `/admin/overview` — tenant counts by plan/status
- **Tenants:** `/admin/tenants` — list, filter, view detail, create (superadmin)
- **Tenant detail:** branding editor, subscription editor, provision master admin, suspend/activate
- **Audit logs:** `/admin/audit-logs` — platform action history with tenant filter

## Architecture

```
app/
├── packages/
│   └── api-client/       # Shared typed API client (no React)
│       └── src/
│           ├── types.ts  # All TypeScript interfaces
│           ├── tenant.ts # tenantFetch + all tenant API calls
│           └── admin.ts  # adminFetch + all platform admin API calls
├── apps/
│   ├── tenant-web/       # Tenant finance app
│   └── platform-admin/   # Platform ops app
└── pnpm-workspace.yaml
```

## Token management

| App | Storage | Header |
|-----|---------|--------|
| tenant-web | `localStorage.accessToken` | `at: <token>` + `x-tenant-slug: <slug>` |
| platform-admin | `localStorage.platformToken` | `pat: <token>` |

Tenant app auto-refreshes on 401 via `GET /auth/refresh`.
