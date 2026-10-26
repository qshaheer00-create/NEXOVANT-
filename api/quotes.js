const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clean = (v, n = 500) => typeof v === 'string' ? v.trim().slice(0, n) : '';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!URL || !KEY) {
    return res.status(503).json({ error: 'Enquiry service is not configured.' });
  }

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const product = clean(b.product, 100);
    const quantity = Number(b.quantity);
    const destination = clean(b.destination, 200);
    const incoterm = clean(b.incoterm, 10).toUpperCase();
    const company = clean(b.company, 160);
    const contact_name = clean(b.contact_name, 120);
    const email = clean(b.email, 254).toLowerCase();

    if (!product || !Number.isFinite(quantity) || quantity <= 0 ||
        quantity > 100000 || !destination ||
        !['FOB', 'CFR', 'CIF'].includes(incoterm) ||
        !company || !contact_name ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please complete all required quotation fields.' });
    }

    const row = {
      product, quantity, destination, incoterm,
      packaging: clean(b.packaging, 100),
      timeline: clean(b.timeline, 100),
      company, contact_name, email,
      phone: clean(b.phone, 40),
      country: clean(b.country, 100),
      notes: clean(b.notes, 1500),
      status: 'new'
    };

    const response = await fetch(`${URL.replace(/\/$/, '')}/rest/v1/quote_requests`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify([row])
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !Array.isArray(data) || !data[0]?.id) {
      console.error('Quote insert failed:', response.status, data);
      return res.status(502).json({ error: 'Could not save your enquiry. Please try again.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Your quotation request was saved.',
      request_id: data[0].id
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Quote API error:', error);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
