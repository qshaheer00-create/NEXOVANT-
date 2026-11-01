import { SUPABASE_URL, SUPABASE_KEY, PAYPAL_BASE, getUser, paypalAccessToken, supabaseRequest } from './_shared.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ error: 'Order database is not configured.' });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to complete checkout.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const paypalOrderId = typeof body.orderID === 'string' ? body.orderID.slice(0, 80) : '';
    if (!paypalOrderId) return res.status(400).json({ error: 'Missing PayPal order ID.' });

    const found = await supabaseRequest(`orders?select=id,total,currency,status,paypal_order_id&paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    if (!found.response.ok || !Array.isArray(found.data) || !found.data[0]) {
      return res.status(404).json({ error: 'Could not find the matching checkout order.' });
    }
    const order = found.data[0];
    if (order.status === 'confirmed') return res.status(200).json({ success: true, order_id: order.id });
    const token = await paypalAccessToken();
    const captureResponse = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const capture = await captureResponse.json().catch(() => ({}));
    if (!captureResponse.ok) {
      console.error('PayPal capture failed', captureResponse.status, capture);
      return res.status(502).json({ error: 'PayPal could not complete the payment. Check your PayPal account before retrying.' });
    }
    const unit = capture.purchase_units?.[0];
    const payment = unit?.payments?.captures?.[0];
    const paidAmount = Number(payment?.amount?.value);
    if (capture.status !== 'COMPLETED' || payment?.status !== 'COMPLETED' ||
        payment?.amount?.currency_code !== order.currency ||
        Math.round(paidAmount * 100) !== Math.round(Number(order.total) * 100)) {
      console.error('PayPal capture verification mismatch', capture.id, capture.status, payment?.status);
      return res.status(409).json({ error: 'Payment could not be verified against the order total. Contact support.' });
    }
    const updated = await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'confirmed', paypal_capture_id: payment.id, payment_status: 'COMPLETED' })
    });
    if (!updated.response.ok) {
      console.error('Could not update paid order', updated.response.status, updated.data);
      return res.status(502).json({ error: 'Payment was received but order confirmation needs support review. Contact us with your PayPal receipt.' });
    }
    return res.status(200).json({ success: true, order_id: order.id, capture_id: payment.id });
  } catch (error) {
    console.error('PayPal capture endpoint error', error);
    return res.status(500).json({ error: 'Could not verify PayPal payment.' });
  }
}
