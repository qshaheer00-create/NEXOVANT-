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


## PayPal Checkout integration (Sandbox first)

This archive adds server-side PayPal Orders v2 endpoints and a PayPal button in the existing retail checkout.

### Required Vercel environment variables

Keep these server-only (do not use a `VITE_` prefix):

- `PAYPAL_CLIENT_ID` — PayPal REST app Client ID for the selected environment.
- `PAYPAL_CLIENT_SECRET` — matching PayPal REST app Secret.
- `PAYPAL_MODE` — `sandbox` for testing; use `live` only after account eligibility and live credentials are confirmed.
- `SUPABASE_URL` — existing Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — existing Supabase service-role key, server-side only.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — existing public frontend Supabase settings.

### Deployment steps

1. In Supabase SQL Editor, run `supabase/paypal-checkout-migration.sql`.
2. In Vercel Project Settings > Environment Variables, add/update the PayPal variables above for Preview and Production as appropriate. Start with Sandbox credentials and `PAYPAL_MODE=sandbox`.
3. Redeploy the Vercel project after changing environment variables.
4. Push this entire updated project to the GitHub repository connected to Vercel.
5. Create a test customer account on the site and sign in. The checkout requires a valid Supabase session and the checkout email must match the signed-in email.
6. Add products to cart, open `/checkout`, complete all delivery fields, and use a PayPal Sandbox buyer account to test.
7. Confirm the order appears in Supabase `orders` with `status=confirmed`, `payment_provider=paypal`, `payment_status=COMPLETED`, and PayPal IDs after successful capture.

### Important payment and commercial limitations

- The server recalculates item prices from the Supabase `products` table; it ignores browser-supplied prices.
- The integration currently charges the product subtotal in USD only. Shipping, duties and taxes are not calculated or collected. Do not use this for orders where those amounts must be charged until a proper shipping/tax quote flow is added.
- The checkout requires customer authentication. Buyers must register/sign in and use the same email address in checkout.
- PayPal capture is verified server-side against the stored order amount and currency before the order is marked confirmed.
- Before enabling Live mode, verify that the Italian PayPal Business account is fully verified and approved for commercial receiving, that the live REST app is enabled, and that the merchant can accept the intended currencies and card/PayPal payment methods. Country registration alone is not a guarantee of approval.
- Never commit `.env` files, Client Secrets, Supabase service-role keys, or other credentials. If a secret has been exposed, rotate it in the provider dashboard.
- This is an integration starter, not a substitute for end-to-end production QA, tax/shipping compliance, refund handling, webhook reconciliation, fraud review or accounting procedures. Configure PayPal webhooks and operational refund handling before relying on it for production volume.

### API endpoints

- `GET /api/paypal/config` — returns only the public PayPal Client ID and currency.
- `POST /api/paypal/create-order` — requires Supabase Bearer session; recalculates prices, creates a PayPal order and stores a pending database order.
- `POST /api/paypal/capture-order` — requires the same signed-in customer; captures and verifies PayPal payment and marks the matching order confirmed.

Run `npm install` and `npm run build` locally before production deployment.
