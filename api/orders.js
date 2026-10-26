const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clean = (v, n=300) => typeof v === 'string' ? v.trim().slice(0,n) : '';
const money = n => Math.round(n * 100) / 100;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!URL || !KEY) return res.status(503).json({ error: 'Order service is not configured yet. Please try again later.' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const customer_name=clean(b.customer_name,120), email=clean(b.email,254).toLowerCase(), phone=clean(b.phone,40), country=clean(b.country,100), address=clean(b.address,500), city=clean(b.city,120), postal_code=clean(b.postal_code,40), notes=clean(b.notes,1000);
    if (!customer_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !country || !address || !city) return res.status(400).json({ error: 'Please provide valid contact and delivery details.' });
    if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 30) return res.status(400).json({ error: 'Order must contain 1–30 product lines.' });
    const map = new Map();
    for (const it of b.items) { const id=clean(it.product_id,80); const quantity=Number(it.quantity), kg=Number(it.weight_kg); if(!id || !Number.isSafeInteger(quantity) || quantity<1 || quantity>99 || ![1,2,3,5,10].includes(kg)) return res.status(400).json({ error: 'Invalid product, pack size or quantity.' }); const k=id+'|'+kg; const prev=map.get(k)||{id,kg,quantity:0}; prev.quantity+=quantity; if(prev.quantity>99)return res.status(400).json({error:'Maximum 99 packs per line.'}); map.set(k,prev); }
    const ids=[...new Set([...map.values()].map(x=>x.id))];
    const filter=ids.map(id=>`id.eq.${id}`).join(',');
    const pr=await fetch(`${URL.replace(/\/$/,'')}/rest/v1/products?select=id,name,price_per_kg,is_active&is_active=eq.true&or=(${encodeURIComponent(filter)})`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
    const products=await pr.json().catch(()=>null); if(!pr.ok || !Array.isArray(products)) { console.error('Order product lookup failed',pr.status); return res.status(502).json({error:'Could not verify product prices.'}); }
    if(products.length!==ids.length) return res.status(400).json({error:'One or more products are unavailable. Please refresh and try again.'});
    const byId=new Map(products.map(p=>[String(p.id),p])); const lines=[...map.values()].map(it=>{const p=byId.get(it.id), price=Number(p.price_per_kg); return {product_id:it.id,name:p.name,weight_kg:it.kg,quantity:it.quantity,unit_price_per_kg:price,line_total:money(price*it.kg*it.quantity)};});
    if(lines.some(x=>!Number.isFinite(x.unit_price_per_kg)||x.unit_price_per_kg<0)) return res.status(500).json({error:'A product has an invalid price. Contact the site owner.'});
    const total=money(lines.reduce((sum,x)=>sum+x.line_total,0));
    const r=await fetch(`${URL.replace(/\/$/,'')}/rest/v1/orders`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify([{customer_name,email,phone,country,address,city,postal_code,notes,items:lines,total,currency:'PKR',status:'pending'}])});
    const created=await r.json().catch(()=>null); if(!r.ok||!Array.isArray(created)||!created[0]?.id){console.error('Order insert failed',r.status,created);return res.status(502).json({error:'Your order request could not be saved. Please try again.'});}
    return res.status(201).json({message:'Order request saved.',order_id:created[0].id,total:created[0].total,status:created[0].status});
  } catch(e) { if(e instanceof SyntaxError)return res.status(400).json({error:'Request body must be valid JSON.'}); console.error('Orders API error',e); return res.status(500).json({error:'Unexpected server error.'}); }
}
