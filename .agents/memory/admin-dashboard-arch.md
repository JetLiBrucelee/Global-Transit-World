---
name: STG Admin Dashboard architecture
description: What was built for the admin portal artifact at /admin — pages, auth, routing pattern.
---

## Artifact
- Dir: `artifacts/admin`, previewPath `/admin`, port 23744
- Workflow: `artifacts/admin: web`

## Auth
- Clerk with `shadcn` theme, navy/amber branding
- `clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)`
- `tsconfig.node.json` was missing from scaffold — had to create it manually

## Routing pattern
All protected routes use a `<Guard>` wrapper component that renders `<AdminLayout>` when signed-in or `<Redirect to="/sign-in">` when signed-out. Uses `<Show when="signed-in/signed-out">` from `@clerk/react`.

## Pages built
- `/dashboard` — stats cards + bar chart + activity feed
- `/shipments` — list with create/archive/duplicate
- `/shipments/:id` — detail with tracking events + holds CRUD
- `/customers` — list + create
- `/customers/:id` — detail + edit + delete
- `/quotes` — list with inline expand + respond modal
- `/news` — articles CRUD + CMS sections tab
- `/users` — list + create
- `/warehouses` — full CRUD
- `/carriers` — full CRUD
- `/audit-logs` — read-only with expandable JSON details

## setBaseUrl
Called in `main.tsx`: `setBaseUrl('')` routes all API calls through same-origin `/api`.
