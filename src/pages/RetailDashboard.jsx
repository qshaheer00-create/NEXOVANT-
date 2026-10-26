
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  PackageCheck,
  Clock3,
  UserRound,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { DashboardShell } from '../components/AccountShell';
import { supabase } from '../services/supabaseClient';

export default function RetailDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        if (active) {
          setError('Please sign in to view your customer profile.');
          setLoading(false);
        }
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else if (!data) {
        setError('Your customer profile has not been created yet.');
      } else {
        setProfile({
          ...data,
          email: authData.user.email
        });
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        try {
          const response = await fetch('/api/orders', {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store'
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result?.error || 'Could not load your orders.');
          if (active) setOrders(Array.isArray(result.orders) ? result.orders : []);
        } catch (orderError) {
          if (active) setOrdersError(orderError.message || 'Could not load your orders.');
        }
      }
      if (active) setOrdersLoading(false);
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardShell
      title="Retail dashboard"
      description="Your current orders, order history and delivery updates."
    >
      <div className="account-stat-grid">
        <article>
          <ShoppingBag />
          <span>Current orders</span>
          <strong>{orders.filter(o => !['completed', 'delivered', 'cancelled'].includes(String(o.status || '').toLowerCase())).length}</strong>
        </article>
        <article>
          <PackageCheck />
          <span>Completed orders</span>
          <strong>{orders.filter(o => ['completed', 'delivered'].includes(String(o.status || '').toLowerCase())).length}</strong>
        </article>
        <article>
          <Clock3 />
          <span>Pending confirmation</span>
          <strong>{orders.filter(o => ['pending', 'pending confirmation'].includes(String(o.status || '').toLowerCase())).length}</strong>
        </article>
      </div>

      <section className="account-panel">
        <h2>Your customer profile</h2>

        {loading ? (
          <p>Loading your profile...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          <div>
            <p>
              <UserRound size={17} />{' '}
              <strong>Name:</strong>{' '}
              {profile.full_name || 'Not provided'}
            </p>

            <p>
              <Mail size={17} />{' '}
              <strong>Email:</strong>{' '}
              {profile.email || 'Not provided'}
            </p>

            <p>
              <Building2 size={17} />{' '}
              <strong>Company:</strong>{' '}
              {profile.company || 'Not provided'}
            </p>

            <p>
              <Phone size={17} />{' '}
              <strong>Phone:</strong>{' '}
              {profile.phone || 'Not provided'}
            </p>
          </div>
        )}
      </section>

      <section className="account-panel">
        <h2>Your orders</h2>
        {ordersLoading ? (
          <p>Loading your orders...</p>
        ) : ordersError ? (
          <p role="alert">{ordersError}</p>
        ) : orders.length ? (
          <div className="retail-order-list">
            {orders.map(order => (
              <article key={order.id} className="account-panel">
                <p><strong>Order:</strong> {order.id}</p>
                <p><strong>Date:</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</p>
                <p><strong>Status:</strong> {order.status || 'Pending'}</p>
                <p><strong>Total:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(order.total || 0))}</p>
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <ul>{order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>{item.name || item.product_name || 'Item'} — Qty: {item.quantity ?? '—'}</li>
                  ))}</ul>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p>No orders are linked to this account yet. New orders placed while signed in will appear here.</p>
        )}
        <Link className="account-link-button" to="/shop">
          Browse retail products
        </Link>
      </section>

      <section className="account-panel">
        <h2>Quick links</h2>
        <p>
          <Link to="/my-orders">Existing local order history →</Link>
        </p>
        <p>
          <Link to="/order-tracking">Track an order →</Link>
        </p>
      </section>
    </DashboardShell>
  );
}
