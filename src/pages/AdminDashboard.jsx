import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Save, RefreshCw, LogOut, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { DashboardShell } from '../components/AccountShell';

const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value)||0);
export default function AdminDashboard(){
  const {user,loading,configured}=useAuth();
  const [products,setProducts]=useState([]),[busy,setBusy]=useState(false),[saving,setSaving]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function load(){
    setBusy(true);setError('');setNotice('');
    try { const {data}=await supabase.auth.getSession(); const token=data?.session?.access_token; if(!token)throw new Error('Please sign in with your admin account first.');
      const r=await fetch('/api/admin-products',{headers:{Authorization:`Bearer ${token}`}});const result=await r.json().catch(()=>({}));if(!r.ok)throw new Error(result.error||'Could not load products.');
      setProducts((result.products||[]).map(p=>({...p,price_per_kg:String(p.price_per_kg??''),sale_price_per_kg:p.sale_price_per_kg==null?'':String(p.sale_price_per_kg),stock_quantity:String(p.stock_quantity??0)})));
    }catch(e){setError(e.message||'Unable to load admin products.');}finally{setBusy(false)}
  }
  useEffect(()=>{if(user)load();},[user]);
  const edit=(id,key,value)=>setProducts(old=>old.map(p=>p.id===id?{...p,[key]:value}:p));
  async function save(p){setSaving(p.id);setError('');setNotice('');try{const {data}=await supabase.auth.getSession();const r=await fetch('/api/admin-products',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data?.session?.access_token||''}`},body:JSON.stringify({id:p.id,price_per_kg:p.price_per_kg,sale_price_per_kg:p.sale_price_per_kg,stock_quantity:p.stock_quantity,is_active:p.is_active})});const result=await r.json().catch(()=>({}));if(!r.ok)throw new Error(result.error||'Save failed.');setProducts(old=>old.map(x=>x.id===p.id?{...x,...result.product,price_per_kg:String(result.product.price_per_kg),sale_price_per_kg:result.product.sale_price_per_kg==null?'':String(result.product.sale_price_per_kg),stock_quantity:String(result.product.stock_quantity)}:x));setNotice(`${p.name} saved successfully.`);}catch(e){setError(e.message||'Could not save changes.');}finally{setSaving('');}}
  async function signOut(){await supabase.auth.signOut();setProducts([])}
  if(!configured)return <DashboardShell title="Admin dashboard" description="Manage retail pricing, stock and discounts."><div className="account-inline-warning"><AlertCircle size={18}/> Supabase is not configured. Set the public Supabase environment variables first.</div></DashboardShell>;
  if(loading)return <DashboardShell title="Admin dashboard" description="Checking your account…"><p>Loading secure account session…</p></DashboardShell>;
  if(!user)return <DashboardShell title="Admin sign in required" description="Only the account configured as ADMIN_EMAIL in Vercel can manage products."><div className="account-inline-warning"><ShieldCheck size={18}/> Sign in with your admin account. Customer accounts are not permitted to manage products.</div><Link className="btn btn-dark" to="/login">Go to sign in</Link></DashboardShell>;
  return <DashboardShell title="Product admin dashboard" description="Update USD prices per kilogram, discounts, stock quantities and product availability.">
    <div className="account-inline-warning"><ShieldCheck size={18}/> Signed in as {user.email}. The server checks your identity against the ADMIN_EMAIL setting before allowing changes.</div>
    <div className="admin-toolbar"><div><strong>{products.length} products</strong><p className="tiny">Sale price is optional. Leave it blank to remove a discount.</p></div><div className="admin-actions"><button className="btn btn-outline-dark" onClick={load} disabled={busy}><RefreshCw size={16}/> Refresh</button><button className="btn btn-outline-dark" onClick={signOut}><LogOut size={16}/> Sign out</button></div></div>
    {error&&<div className="notice" role="alert">{error}</div>}{notice&&<div className="retail-notice" role="status">{notice}</div>}
    {busy&&!products.length?<p>Loading products…</p>:<div className="admin-product-list">{products.map(p=><article className="account-panel admin-product" key={p.id}>
      <div className="admin-product-heading"><div><span className="doc-category">{p.category}</span><h2>{p.name}</h2><small>Product ID: {p.id}</small></div><label className="admin-toggle"><input type="checkbox" checked={Boolean(p.is_active)} onChange={e=>edit(p.id,'is_active',e.target.checked)}/> Available in shop</label></div>
      <div className="admin-fields"><label>Regular price (USD/kg)<input type="number" min="0" step="0.01" value={p.price_per_kg} onChange={e=>edit(p.id,'price_per_kg',e.target.value)} required/></label><label>Sale price (USD/kg)<input type="number" min="0" step="0.01" placeholder="No discount" value={p.sale_price_per_kg} onChange={e=>edit(p.id,'sale_price_per_kg',e.target.value)}/></label><label>Stock quantity (kg)<input type="number" min="0" step="1" value={p.stock_quantity} onChange={e=>edit(p.id,'stock_quantity',e.target.value)} required/></label></div>
      <div className="admin-product-footer"><span className="tiny">{p.sale_price_per_kg!==''&&Number(p.sale_price_per_kg)<Number(p.price_per_kg)?<><strong>{Math.round((1-Number(p.sale_price_per_kg)/Math.max(Number(p.price_per_kg),0.01))*100)}% discount</strong> · {money(p.sale_price_per_kg)} sale price</>:`Current price: ${money(p.price_per_kg)} / kg`}</span><button className="btn btn-dark" onClick={()=>save(p)} disabled={saving===p.id||busy}><Save size={16}/>{saving===p.id?'Saving…':'Save changes'}</button></div>
    </article>)}</div>}
    <p className="tiny">Prices are managed in the database. The retail shop must read these database values to show edits to customers; this dashboard does not change historic order totals.</p>
  </DashboardShell>;
}
