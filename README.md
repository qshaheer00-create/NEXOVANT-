# Nexovant Exporters — integrated B2B + B2C starter

This bundle combines the existing React/Vite frontend with Vercel serverless API endpoints and a Supabase/PostgreSQL schema. It is a deployable starter, not a fully audited production commerce system.

## Included
- B2B pages: bulk catalog, product detail, quote wizard, logistics, quality, contact and specifications.
- B2C pages: retail shop, product detail, local cart, checkout and local order-history page.
- API endpoints: `GET /api/health`, `GET /api/products`, `POST /api/orders`, `POST /api/quotes`, `POST /api/contact`.
- Supabase schema and sample product seed data.
- Checkout and quote forms submit to the API instead of pretending that a browser-only save is a server order.

## Deploy steps
1. Back up your current GitHub repo. Upload the contents of this project folder to the repository root (same level as `index.html`, `package.json`, `src/`). Do not upload the outer ZIP folder as a nested folder.
2. In Supabase, create a project and open SQL Editor. Run `supabase/schema.sql`.
3. In Supabase Project Settings > API, copy the project URL and service-role/secret key. Never put this key in frontend code or in a `VITE_` variable.
4. In Vercel > Project > Settings > Environment Variables, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Production (and Preview if needed). Redeploy after saving them.
5. In Vercel > Project Settings, use Framework Preset Vite, Build Command `npm run build`, Output Directory `dist`, Install Command `npm install`.
6. Test `https://YOUR_DOMAIN/api/health`, then `https://YOUR_DOMAIN/api/products`. Submit a test checkout and quote request. Delete test orders after verification.

## Critical setup before accepting real orders
- All retail prices in the UI and SQL seed are sample PKR estimates. Approve prices and update both `src/main.jsx` retail prices and `products.price_per_kg` in Supabase; the backend uses database prices as authoritative. If they differ, cart estimate may differ from saved server total.
- Stock values seed to 0 but this starter does not block orders by stock. Stock reservation and inventory management need to be implemented before real fulfilment.
- Checkout creates a **manual order request**, not a paid order. No payment gateway is configured. Add a supported provider after confirming your business country, merchant account, currency, shipping/tax rules and target markets. Never collect card details directly in this site.
- There is no admin dashboard or customer authentication yet. Manage order and quote records in Supabase dashboard only; do not expose service-role credentials.
- Email notifications are not configured. Add a verified transactional email provider and send notifications from server-side functions.
- The contact page currently retains its original demo behavior; `/api/contact` is provided but the visible contact form still needs wiring before production.
- Quote API stores the RFQ but does not send email.
- Add spam/rate limiting, privacy policy, terms, returns/refund, shipping and cookie notices as appropriate. Review privacy/data obligations in your selling markets.
- Sample specifications and product imagery must be reviewed. Do not make unverified certification or food safety claims.

## Security notes
- Never commit `.env` files or service-role keys. `.env.example` contains placeholders only.
- API uses server-side environment variables and validates inputs and prices.
- The schema enables Row Level Security and creates no public policies. Server functions use the service-role key.
- Test the endpoints after deploying; a green deployment alone does not prove the database is configured.

## Local development
Requires Node.js LTS.
```bash
npm install
npm run dev
npm run build
```
Vite local development does not automatically run Vercel API functions. Use `vercel dev` for local API testing after installing the Vercel CLI, with environment variables configured.
