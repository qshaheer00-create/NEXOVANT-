# Nexovant Exporters — B2B + B2C website

Responsive React + Vite starter for an agricultural commodity exporter with separate bulk-export and retail-shopping journeys.

## Pages
- `/` — corporate homepage
- `/products` and `/products/:slug` — B2B catalog and technical product pages
- `/quote` — bulk RFQ wizard
- `/shop` and `/shop/:slug` — retail shop with 1 kg, 2 kg, 3 kg, 5 kg and 10 kg pack sizes
- `/cart` — editable retail cart
- `/checkout` — customer/delivery form and manual order-request confirmation
- `/my-orders` — local demo order history
- `/about`, `/logistics`, `/quality`, `/contact`, `/freight-estimator`, `/specifications`

## Run locally
Requires a current Node.js LTS release.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy on Vercel
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Commit changes to GitHub; Vercel should deploy the connected branch automatically. For React Router deep links, configure Vercel SPA rewrites if direct page refreshes return 404. Add `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` if needed.

## Important production limitations
- Retail prices are illustrative PKR placeholders. Replace them with approved prices before launch.
- Cart and demo order history use browser localStorage. Orders are not sent to a server, email, CRM, or database and are only visible in the same browser/device.
- No payment provider is configured; checkout creates a local **manual confirmation request**, not a payment or a fulfilled order.
- A production launch needs a secure backend/database, server-side price and stock validation, email notifications, payment integration suitable for your markets, customer authentication, and role-protected order administration. Do not store secret keys in frontend code.
- Sample product specifications and imagery should be reviewed/replaced with approved business data. Certification claims must only be shown with valid evidence.

## Environment variables
The frontend-only demo does not require environment variables. Add server-side environment variables only when a backend/payment/email service has actually been integrated.
