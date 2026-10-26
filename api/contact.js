const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clean = (v, n = 1000) => typeof v === 'string' ? v.trim().slice(0, n) : '';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!URL || !KEY) {
    return res.status(503).json({ error: 'Contact service is not configured.' });
  }

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = clean(b.name, 120);
    const email = clean(b.email, 254).toLowerCase();
    const message = clean(b.message, 2000);

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
      return res.status(400).json({ error: 'Enter your name, a valid email and a message.' });
    }

    const row = {
      name,
      email,
      company: clean(b.company, 160),
      country: clean(b.country, 100),
      enquiry_type: clean(b.enquiry_type, 100),
      message,
      status: 'new'
    };

    const response = await fetch(`${URL.replace(/\/$/, '')}/rest/v1/contact_messages`, {
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
      console.error('Contact insert failed:', response.status, data);
      return res.status(502).json({ error: 'Could not save your message. Please try again.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Your message was saved.',
      message_id: data[0].id
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Contact API error:', error);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
