const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const base = () => URL.replace(/\/$/, '');
async function authenticate(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || !URL || !KEY || !ADMIN_EMAIL) return null;
  const response = await fetch(`${base()}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const user = await response.json();
  return user.email && user.email.toLowerCase() === ADMIN_EMAIL ? user : null;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET','PATCH'].includes(req.method)) { res.setHeader('Allow','GET, PATCH'); return res.status(405).json({error:'Method not allowed'}); }
  if (!URL || !KEY || !ADMIN_EMAIL) return res.status(503).json({error:'Admin API is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL in Vercel.'});
  try {
    const user = await authenticate(req);
    if (!user) return res.status(403).json({error:'Admin access denied. Sign in using the configured admin account.'});
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json' };
    if (req.method === 'GET') {
      const r = await fetch(`${base()}/rest/v1/products?select=id,slug,name,description,category,price_per_kg,sale_price_per_kg,stock_quantity,is_active&order=name.asc`, {headers});
      const data = await r.json().catch(()=>[]);
      if (!r.ok) return res.status(502).json({error:'Could not load products. Apply the admin-products.sql migration first.'});
      return res.status(200).json({products:data});
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return res.status(400).json({error:'Product ID is required.'});
    const patch = {};
    if (body.price_per_kg !== undefined) { const n=Number(body.price_per_kg); if(!Number.isFinite(n)||n<0) return res.status(400).json({error:'Regular price must be zero or greater.'}); patch.price_per_kg=n; }
    if (body.sale_price_per_kg !== undefined) { const raw=body.sale_price_per_kg; if(raw === '' || raw === null) patch.sale_price_per_kg=null; else { const n=Number(raw); if(!Number.isFinite(n)||n<0) return res.status(400).json({error:'Sale price must be blank or zero or greater.'}); patch.sale_price_per_kg=n; } }
    if (body.stock_quantity !== undefined) { const n=Number(body.stock_quantity); if(!Number.isInteger(n)||n<0) return res.status(400).json({error:'Stock quantity must be a whole number, zero or greater.'}); patch.stock_quantity=n; }
    if (body.is_active !== undefined) { if(typeof body.is_active!=='boolean') return res.status(400).json({error:'Availability must be true or false.'}); patch.is_active=body.is_active; }
    if (!Object.keys(patch).length) return res.status(400).json({error:'No editable fields supplied.'});
    patch.updated_at = new Date().toISOString();
    const r = await fetch(`${base()}/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=id,slug,name,description,category,price_per_kg,sale_price_per_kg,stock_quantity,is_active`, {method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(patch)});
    const data = await r.json().catch(()=>[]);
    if (!r.ok) return res.status(502).json({error:'Could not save product changes.'});
    if (!data.length) return res.status(404).json({error:'Product not found.'});
    return res.status(200).json({product:data[0]});
  } catch (error) { console.error('Admin products API error', error); return res.status(500).json({error:'Unexpected server error.'}); }
}
