# Nexovant Exporters — Website Starter

A responsive, multi-page React + Vite website concept for a B2B agricultural commodities exporter. Built with React Router and Lucide icons.

## Pages included
- `/` — Homepage
- `/products` — Searchable and filterable product catalog
- `/products/sesame-seeds` and other product slugs — Product detail and technical overview
- `/quote` — Three-step RFQ wizard with field validation and review/success state
- `/about` — Company approach and process
- `/logistics` — FOB / CFR / CIF explainer and export workflow
- `/quality` — Quality and compliance information with expandable details
- `/contact` — Contact enquiry form UI
- `/freight-estimator` — Informational container load estimator
- `/specifications` — Spec sheet library index

## Run locally
1. Install Node.js LTS.
2. Open a terminal in this folder.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL shown by Vite.
6. Before publishing, run `npm run build` to test production output.

## Publish to GitHub
1. Create a new GitHub repository.
2. Upload the contents of this folder (not the ZIP file itself) to the repository root, or use Git:
   ```bash
   git init
   git add .
   git commit -m "Add Nexovant Exporters website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```
3. For a static deployment, use a host such as Vercel or Netlify and connect the GitHub repository. Configure SPA fallback so routes such as `/products/sesame-seeds` resolve to `index.html`.

## Important before going live
- This is a polished **frontend starter**, not a complete production backend.
- RFQ and contact forms currently validate input and show a demo success state, but they do not send email or store leads. Connect a secure server/API, Resend/SendGrid, and optionally a CRM webhook.
- No real admin dashboard or authentication is included. Do not expose admin operations in a frontend-only deployment. Add server-side authentication and authorization if an admin portal is required.
- Product values, origins, purities, container capacities and imagery are sample/indicative. Confirm every specification and image licence before publishing.
- The website intentionally avoids claiming that the company holds ISO, HACCP, SGS, Bureau Veritas or other certifications. Add only current, verifiable certificates.
- Images and Google Fonts are loaded from third-party URLs and require an internet connection. Replace image URLs with owned/licensed assets for production.
- Set your actual company email, telephone, registered address, privacy policy and terms before launch.

## Main files
- `src/main.jsx` — pages, sample product data and UI interactions
- `src/styles.css` — responsive visual system and styling
- `index.html` — page metadata
