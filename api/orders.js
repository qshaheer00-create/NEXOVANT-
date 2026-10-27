const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const clean = (v, n = 300) =>
  typeof v === 'string' ? v.trim().slice(0, n) : '';
const money = n => Math.round(n * 100) / 100;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL || !KEY) {
    return res.status(503).json({
      error: 'Order service is not configured yet. Please try again later.'
    });
  }

  // GET: return only the signed-in customer's orders.
  if (req.method === 'GET') {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const match = /^Bearer\s+(.+)$/i.exec(authHeader || '');
    if (!match) return res.status(401).json({ error: 'Please sign in to view your orders.' });

    try {
      const authResponse = await fetch(`${URL.replace(/\/$/, '')}/auth/v1/user`, {
        headers: { apikey: KEY, Authorization: `Bearer ${match[1]}` }
      });
      const authUser = await authResponse.json().catch(() => null);
      if (!authResponse.ok || !authUser?.id) {
        return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
      }

      const ordersResponse = await fetch(
        `${URL.replace(/\/$/, '')}/rest/v1/orders?select=id,created_at,items,total,currency,status,notes&user_id=eq.${encodeURIComponent(authUser.id)}&order=created_at.desc`,
        { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
      );
      const orders = await ordersResponse.json().catch(() => null);
      if (!ordersResponse.ok || !Array.isArray(orders)) {
        console.error('Order history lookup failed', ordersResponse.status);
        return res.status(502).json({ error: 'Could not load your orders right now.' });
      }
      return res.status(200).json({ orders });
    } catch (error) {
      console.error('Order history API error', error);
      return res.status(500).json({ error: 'Unexpected server error.' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!URL || !KEY) {
    return res.status(503).json({
      error: 'Order service is not configured yet. Please try again later.'
    });
  }

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Every retail order must belong to an authenticated customer account.
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const match = /^Bearer\s+(.+)$/i.exec(authHeader || '');
    if (!match) return res.status(401).json({ error: 'Please sign in to your customer account before placing an order.' });
    const authResponse = await fetch(`${URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: KEY, Authorization: `Bearer ${match[1]}` }
    });
    const authUser = await authResponse.json().catch(() => null);
    if (!authResponse.ok || !authUser?.id) {
      return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
    }
    const userId = authUser.id;
    const suppliedEmail = clean(b.email, 254).toLowerCase();
    if (!authUser.email || suppliedEmail !== authUser.email.toLowerCase()) {
      return res.status(403).json({ error: 'The checkout email must match your signed-in account.' });
    }

    const customer_name = clean(b.customer_name, 120);
    const email = clean(b.email, 254).toLowerCase();
    const phone = clean(b.phone, 40);
    const country = clean(b.country, 100);
    const address = clean(b.address, 500);
    const city = clean(b.city, 120);
    const postal_code = clean(b.postal_code, 40);
    const notes = clean(b.notes, 1000);

    if (!customer_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !phone || !country || !address || !city) {
      return res.status(400).json({
        error: 'Please provide valid contact and delivery details.'
      });
    }

    if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 30) {
      return res.status(400).json({ error: 'Order must contain 1–30 product lines.' });
    }

    const map = new Map();
    for (const it of b.items) {
      const id = clean(it.product_id, 80);
      const quantity = Number(it.quantity);
      const kg = Number(it.weight_kg);

      if (!id || !Number.isSafeInteger(quantity) || quantity < 1 ||
          quantity > 99 || ![1, 2, 3, 5, 10].includes(kg)) {
        return res.status(400).json({
          error: 'Invalid product, pack size or quantity.'
        });
      }

      const k = `${id}|${kg}`;
      const prev = map.get(k) || { id, kg, quantity: 0 };
      prev.quantity += quantity;
      if (prev.quantity > 99) {
        return res.status(400).json({ error: 'Maximum 99 packs per line.' });
      }
      map.set(k, prev);
    }

    const ids = [...new Set([...map.values()].map(x => x.id))];
    const filter = ids.map(id => `id.eq.${id}`).join(',');
    const productsResponse = await fetch(
      `${URL.replace(/\/$/, '')}/rest/v1/products?select=id,name,price_per_kg,sale_price_per_kg,is_active&is_active=eq.true&or=(${encodeURIComponent(filter)})`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    );

    const products = await productsResponse.json().catch(() => null);
    if (!productsResponse.ok || !Array.isArray(products)) {
      console.error('Order product lookup failed', productsResponse.status);
      return res.status(502).json({ error: 'Could not verify product prices.' });
    }
    if (products.length !== ids.length) {
      return res.status(400).json({
        error: 'One or more products are unavailable. Please refresh and try again.'
      });
    }

    const byId = new Map(products.map(p => [String(p.id), p]));
    const lines = [...map.values()].map(it => {
      const p = byId.get(it.id);
      const regularPrice = Number(p.price_per_kg);
      const salePrice = p.sale_price_per_kg == null ? null : Number(p.sale_price_per_kg);
      const price = salePrice !== null && Number.isFinite(salePrice) && salePrice >= 0 && salePrice < regularPrice ? salePrice : regularPrice;
      return {
        product_id: it.id,
        name: p.name,
        weight_kg: it.kg,
        quantity: it.quantity,
        unit_price_per_kg: price,
        line_total: money(price * it.kg * it.quantity)
      };
    });

    if (lines.some(x => !Number.isFinite(x.unit_price_per_kg) || x.unit_price_per_kg < 0)) {
      return res.status(500).json({
        error: 'A product has an invalid price. Contact the site owner.'
      });
    }

    const total = money(lines.reduce((sum, x) => sum + x.line_total, 0));
    const order = {
      customer_name, email, phone, country, address, city, postal_code, notes,
      items: lines, total, currency: 'USD', status: 'pending',
      user_id: userId
    };

    const insertResponse = await fetch(`${URL.replace(/\/$/, '')}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify([order])
    });

    const created = await insertResponse.json().catch(() => null);
    if (!insertResponse.ok || !Array.isArray(created) || !created[0]?.id) {
      console.error('Order insert failed', insertResponse.status, created);
      return res.status(502).json({
        error: 'Your order request could not be saved. Please try again.'
      });
    }

    return res.status(201).json({
      message: 'Order request saved.',
      order_id: created[0].id,
      total: created[0].total,
      status: created[0].status
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Orders API error', e);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
