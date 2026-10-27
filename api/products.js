const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!URL || !KEY) return res.status(503).json({ error: 'Database is not configured yet.' });
  try {
    const r = await fetch(`${URL.replace(/\/$/, '')}/rest/v1/products?select=id,slug,name,description,category,price_per_kg,sale_price_per_kg,image_url,stock_quantity,is_active&is_active=eq.true&order=name.asc`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const data = await r.json().catch(() => null);
    if (!r.ok) { console.error('Products query failed', r.status); return res.status(502).json({ error: 'Could not load products.' }); }
    return res.status(200).json({ products: data || [] });
  } catch (e) { console.error('Products API error', e); return res.status(500).json({ error: 'Unexpected server error.' }); }
}
