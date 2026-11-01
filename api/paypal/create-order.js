import { SUPABASE_URL, SUPABASE_KEY, PAYPAL_BASE, clean, getUser, paypalAccessToken, supabaseRequest } from './_shared.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ error: 'Order database is not configured.' });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in before checkout.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const c = body.customer || {};
    const customer = {
      customer_name: clean(c.name, 120), email: clean(c.email, 254).toLowerCase(),
      phone: clean(c.phone, 40), address: clean(c.address, 500),
      city: clean(c.city, 120), country: clean(c.country, 100)
    };
    if (!customer.customer_name || customer.email !== String(user.email || '').toLowerCase() ||
        !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(customer.email) ||
        !customer.phone || !customer.address || !customer.city || !customer.country) {
      return res.status(400).json({ error: 'Complete your delivery details. Checkout email must match your signed-in account.' });
    }
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
      return res.status(400).json({ error: 'Your cart is empty or contains too many items.' });
    }
    const map = new Map();
    for (const item of body.items) {
      const id = clean(String(item.product_id || ''), 80);
      const qty = Number(item.quantity), kg = Number(item.weight_kg);
      if (!id || !Number.isSafeInteger(qty) || qty < 1 || qty > 99 || ![1,2,3,5,10].includes(kg)) {
        return res.status(400).json({ error: 'Invalid cart item or pack size.' });
      }
      const key = `${id}|${kg}`, old = map.get(key) || { id, kg, quantity: 0 };
      old.quantity += qty;
      if (old.quantity > 99) return res.status(400).json({ error: 'Maximum 99 packs per item.' });
      map.set(key, old);
    }
    const lines = [...map.values()];
    const ids = [...new Set(lines.map(x => x.id))];
    const filter = ids.map(id => `id.eq.${id}`).join(',');
    const productsResult = await supabaseRequest(`products?select=id,name,price_per_kg,sale_price_per_kg,is_active&is_active=eq.true&or=(${encodeURIComponent(filter)})`);
    if (!productsResult.response.ok || !Array.isArray(productsResult.data) || productsResult.data.length !== ids.length) {
      return res.status(400).json({ error: 'One or more products are unavailable. Refresh your cart.' });
    }
    const productMap = new Map(productsResult.data.map(p => [String(p.id), p]));
    const orderLines = lines.map(line => {
      const p = productMap.get(line.id);
      const regular = Number(p.price_per_kg), sale = p.sale_price_per_kg == null ? null : Number(p.sale_price_per_kg);
      const price = sale !== null && Number.isFinite(sale) && sale >= 0 && sale < regular ? sale : regular;
      return { product_id: line.id, name: p.name, weight_kg: line.kg, quantity: line.quantity,
        unit_price_per_kg: price, line_total: Math.round(price * line.kg * line.quantity * 100) / 100 };
    });
    if (orderLines.some(x => !Number.isFinite(x.unit_price_per_kg) || x.unit_price_per_kg < 0)) {
      return res.status(500).json({ error: 'A product has an invalid price.' });
    }
    const total = Math.round(orderLines.reduce((sum, x) => sum + x.line_total, 0) * 100) / 100;
    if (total <= 0) return res.status(400).json({ error: 'Order total must be greater than zero.' });

    const token = await paypalAccessToken();
    const paypalResponse = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: 'NEXOVANT', description: 'Nexovant retail order',
          amount: { currency_code: 'USD', value: total.toFixed(2) } }]
      })
    });
    const paypal = await paypalResponse.json().catch(() => ({}));
    if (!paypalResponse.ok || !paypal.id) {
      console.error('PayPal create order failed', paypalResponse.status, paypal);
      return res.status(502).json({ error: 'PayPal could not create the payment. Please try again.' });
    }
    const order = { ...customer, items: orderLines, total, currency: 'USD', status: 'pending',
      user_id: user.id, paypal_order_id: paypal.id, payment_provider: 'paypal' };
    const inserted = await supabaseRequest('orders', { method: 'POST',
      headers: { Prefer: 'return=representation' }, body: JSON.stringify([order]) });
    if (!inserted.response.ok || !Array.isArray(inserted.data) || !inserted.data[0]?.id) {
      console.error('Could not save pending PayPal order', inserted.response.status, inserted.data);
      return res.status(502).json({ error: 'Could not save your order. Please contact support before retrying.' });
    }
    return res.status(201).json({ id: paypal.id, order_id: inserted.data[0].id });
  } catch (error) {
    console.error('PayPal create order error', error);
    return res.status(500).json({ error: 'Could not start PayPal checkout.' });
  }
}
