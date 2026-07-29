# Sinovera Transit Global (STG)

A world-class international logistics and shipment tracking platform for a China-based freight company shipping to 180+ countries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned via Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed)
- Validation: Zod (v3 via catalog), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (one file per entity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — Clerk auth middleware + role enforcement
- `artifacts/api-server/src/lib/audit.ts` — immutable audit log writer
- `artifacts/api-server/src/lib/tracking.ts` — tracking number generator, name masking
- `artifacts/api-server/src/lib/seed.ts` — demo data seed (runs on startup)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- **Tracking number format**: `STG-CN-YYYY-XXXXXX` (6 alphanumeric chars, uppercase, no ambiguous chars)
- **OpenAPI integer fields**: All `integer` types use `number` in the spec to avoid Orval 8.x generating `zod.int()` which is zod v4 syntax incompatible with the workspace's zod v3 catalog version
- **Audit logs are immutable**: No delete endpoint, no update endpoint. Written via `writeAuditLog()` helper on every mutation
- **Clerk auth**: Cookie-based for web (no bearer tokens in browser code). `requireUserRecord` middleware resolves the DB user from clerkId on every protected request
- **Seed on startup**: `seedDatabase()` runs on every server start but is idempotent (checks for existing records before inserting)
- **CMS via DB**: All public-facing content (homepage, FAQ, legal pages, etc.) stored in `cms_content` table and served via `/api/cms/:section` endpoints

## Product

Sinovera Transit Global (STG) is an international logistics platform:
- **Public website**: Landing page, service pages, real-time shipment tracking
- **Admin dashboard**: Full shipment lifecycle management (create, track, hold, customs, CMS)
- **Customer portal**: Authenticated accounts to save and monitor shipments
- **Tracking system**: Custom `STG-CN-YYYY-XXXXXX` format with 30+ status types and hold management

## Demo Tracking Numbers (seeded)

- `STG-CN-2026-84XH92` — Shenzhen → New York, in transit
- `STG-CN-2026-KP73MQ` — Yiwu → London, customs review
- `STG-CN-2026-ZT55WR` — Foshan → Dubai, delivered
- `STG-CN-2026-NX28BF` — Ningbo → Warsaw, rail freight in transit

## User Roles (9 levels)

`super_admin` → `operations_manager` → `warehouse_staff` / `tracking_staff` / `customs_officer` → `customer_support` / `finance` → `read_only_auditor` → `customer`

## Gotchas

- Do NOT use `type: integer` in OpenAPI spec — use `type: number` instead (Orval 8.x generates `zod.int()` which is zod v4 only)
- The health route no longer imports `@workspace/api-zod` — keep it simple to avoid circular deps
- `requireUserRecord` middleware loads the full DB user; only call it on routes where you need the user record. Use `requireAuth` for lighter Clerk-only checks
- After any spec change, always run `pnpm --filter @workspace/api-spec run codegen` before building

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for authentication setup details
