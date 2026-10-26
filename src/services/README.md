# Service layer plan

Keep database and business logic out of page components. Add one module per domain as the live workflows are implemented:

- `authService.js` — Supabase sign-in, sign-up and session management.
- `productService.js` — product catalog and inventory.
- `orderService.js` — server-backed retail orders and order history.
- `quotationService.js` — B2B quote submission, responses and acceptance.
- `trackingService.js` — customer-visible tracking events and admin updates.
- `paymentService.js` — later integration with the approved online gateway.

Do not put the Supabase service-role key in frontend code. Privileged operations must run in protected server-side API endpoints.
