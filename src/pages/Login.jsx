import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AccountShell } from '../components/AccountShell';
import { requireSupabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
export default function Login(){
  const navigate=useNavigate(); const [searchParams]=useSearchParams(); const {configured}=useAuth();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function submit(e){e.preventDefault();setError('');setBusy(true);try{const client=requireSupabase();const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;const requested=searchParams.get('redirect');const destination=requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/account/retail';navigate(destination,{replace:true});}catch(err){setError(err.message||'Unable to sign in.');}finally{setBusy(false);}}
  return <AccountShell eyebrow="WELCOME BACK" title="Sign in to your account" description="Access your orders, quotations and shipment updates.">{!configured&&<p className="account-inline-warning">Authentication setup is not complete. Configure the two Vite Supabase public variables as described in README.md.</p>}{error&&<p role="alert" className="account-inline-warning">{error}</p>}<form className="account-form" onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/></label><button className="account-submit" disabled={busy||!configured}>{busy?'Signing in…':'Sign in'}</button></form><p className="account-switch"><Link to="/forgot-password">Forgot password?</Link></p><p className="account-switch">New to Nexovant? <Link to="/register">Create an account</Link></p></AccountShell>;
}
