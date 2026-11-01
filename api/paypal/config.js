export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'PayPal is not configured.' });
  return res.status(200).json({ client_id: clientId, currency: 'USD' });
}
