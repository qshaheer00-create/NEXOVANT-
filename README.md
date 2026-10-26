# Nexovant Exporters — Modular Phase 1

This project preserves the existing public React website and adds separate account-related page modules. It is a development handoff, not a production-ready commerce system.

## What's included

- Existing public pages and styles preserved in `src/main.jsx` and `src/styles.css`.
- Separate preview pages in `src/pages/`: login, registration, retail dashboard, B2B dashboard, admin dashboard, and order tracking.
- Shared account layout in `src/components/AccountShell.jsx`.
- Account-only styles in `src/styles/account.css`.
- Existing Vercel API routes in `api/` and existing Supabase schema in `supabase/schema.sql` preserved.
- New account preview routes registered in the React router.

## Routes added

- `/login`
- `/register`
- `/account/retail`
- `/account/b2b`
- `/admin`
- `/order-tracking`

## Important limitations

The new account pages are UI previews only. They do not yet authenticate users, fetch customer-specific orders, or provide working admin controls. Do not treat the admin preview as an access-control mechanism. The existing retail checkout/order-history implementation uses browser local storage, so those orders are not securely persisted for an account across devices. Online payments are not implemented. Keep COD and online gateway integration disabled until the server-side order flow and payment verification are completed.

The large existing public-page module `src/main.jsx` is retained to reduce the risk of breaking working pages in this first handoff. The next refactor should extract existing page components into separate files in small, build-tested steps, then move data and API operations into dedicated service modules.

## Setup

Requirements: Node.js 20 or a current supported LTS release.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Deployment notes

- Keep production secrets in Vercel environment variables; never commit service-role keys or API secrets.
- Preserve the existing environment variable names unless the backend code is deliberately migrated.
- Apply and review Supabase schema/policy changes before deploying any authenticated order workflow.
- Test the public pages, forms, cart, checkout, and every new route before production deployment.

## Verification status

A build could not be verified in the preparation environment because dependencies were unavailable (`vite` was not installed and dependency installation did not complete). Run `npm install` and `npm run build` locally before deploying. This archive has not been deployed and does not modify the remote GitHub or Vercel project.

## Phase 2: Supabase Authentication starter

This phase replaces the login/register alert previews with Supabase Auth calls and adds a profile trigger/policies SQL file. It is not yet a complete customer portal: order persistence, role-protected admin APIs, quotations and tracking still need implementation.

### Configure locally

1. In Supabase, open Project Settings > API and copy the Project URL and anon/public key.
2. Copy `.env.example` to `.env.local` in the project root.
3. Replace the example values with your own `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase Dashboard > Authentication > URL Configuration, add your local URL (for example `http://localhost:5173`) to the allowed redirect URLs.
5. Open Supabase SQL Editor and run `supabase/auth-profiles.sql`.
6. Run `npm.cmd install` in Windows PowerShell, then `npm.cmd run dev`.

Only the anon/public key belongs in `.env.local`; never use the Supabase `service_role` key in frontend code. Keep all server secrets in Vercel environment variables. New users may choose retail or B2B; registration cannot grant admin access. Assign admin access manually through a trusted database/admin process after the authorization design is implemented.

### Build and limitations

Run `npm.cmd run build` before deployment. Dependency installation could not be completed in the preparation environment, so this archive's production build has not been verified. Login uses Supabase email/password authentication; registration may require email confirmation according to your Supabase Auth settings. Dashboards remain previews and do not yet fetch order data.
