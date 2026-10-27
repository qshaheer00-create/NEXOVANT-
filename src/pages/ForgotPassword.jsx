import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountShell } from '../components/AccountShell';
import { requireSupabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { configured } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const client = requireSupabase();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setMessage('If an account exists for that email, a password-reset link will be sent. Check your inbox and spam folder.');
    } catch (err) { setError(err.message || 'Unable to send the reset email.'); }
    finally { setBusy(false); }
  }
  return <AccountShell eyebrow="ACCOUNT RECOVERY" title="Reset your password" description="Enter the email address for your Nexovant account and we'll send a secure reset link.">
    {!configured && <p className="account-inline-warning">Authentication is not configured. Please contact the site administrator.</p>}
    {error && <p role="alert" className="account-inline-warning">{error}</p>}
    {message && <p role="status" className="account-success-message">{message}</p>}
    <form className="account-form" onSubmit={submit}><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" /></label><button className="account-submit" disabled={busy||!configured}>{busy?'Sending reset link…':'Send reset link'}</button></form>
    <p className="account-switch"><Link to="/login">Back to sign in</Link></p>
  </AccountShell>;
}
