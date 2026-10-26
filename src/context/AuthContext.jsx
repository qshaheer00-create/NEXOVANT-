import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext({ user: null, profile: null, loading: true });
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return undefined; }
    let alive = true;
    const load = async (sessionUser) => {
      if (!alive) return;
      setUser(sessionUser || null);
      if (!sessionUser) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('id, full_name, company, phone, account_type').eq('id', sessionUser.id).maybeSingle();
      if (alive) { setProfile(data || null); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void load(session?.user || null); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading, configured: supabaseConfigured }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
