import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccountShell } from '../components/AccountShell';
import { requireSupabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { configured } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const client = requireSupabase();
    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      setReady(Boolean(data?.session));
      if (!data?.session) setError('This reset link is invalid or expired. Request a new reset link.');
    }).catch(err => { if(active) setError(err.message || 'Could not validate reset link.'); });
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) { setReady(true); setError(''); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  async function submit(e) {
    e.preventDefault(); setError(''); setMessage('');
    if (password.length < 8) { setError('Choose a password with at least 8 characters.'); return; }
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      setMessage('Your password has been updated. You can now sign in with your new password.');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) { setError(err.message || 'Unable to update password. Request a new reset link if needed.'); }
    finally { setBusy(false); }
  }
  return <AccountShell eyebrow="SECURE ACCOUNT RECOVERY" title="Choose a new password" description="Use at least 8 characters. Your new password will replace the old one.">
    {!configured && <p className="account-inline-warning">Authentication is not configured.</p>}
    {error && <p role="alert" className="account-inline-warning">{error}</p>}
    {message && <p role="status" className="account-success-message">{message}</p>}
    {ready && !message && <form className="account-form" onSubmit={submit}><label>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} /></label><label>Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} /></label><button className="account-submit" disabled={busy||!configured}>{busy?'Updating password…':'Update password'}</button></form>}
    <p className="account-switch"><Link to="/forgot-password">Request another reset link</Link></p>
  </AccountShell>;
}
