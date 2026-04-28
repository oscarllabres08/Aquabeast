import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
  delivery_address: string;
};

function statusLabel(s: string) {
  if (s === 'pending') return 'Pending';
  if (s === 'confirmed') return 'Confirmed';
  if (s === 'preparing') return 'Preparing';
  if (s === 'on_the_way') return 'On the way';
  if (s === 'delivered') return 'Delivered';
  if (s === 'cancelled') return 'Cancelled';
  return s;
}

export function ProfilePage() {
  const nav = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let alive = true;
    async function load() {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id,status,created_at,customer_name,delivery_address')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) setErr(error.message);
      setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="page">
        <section className="card">Loading…</section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <header className="topbar">
          <div>
            <div className="muted">Profile</div>
            <div className="h2">Account</div>
          </div>
        </header>
        <section className="card">
          <div className="muted">Login to view your orders.</div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" to="/auth">
              Login / Register
            </Link>
            <Link className="btn btn-ghost" to="/order">
              Order
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="profile-hero" style={{ flex: 1 }}>
          <div className="avatar-badge">{(user.email?.[0] ?? 'A').toUpperCase()}</div>
          <div>
            <div className="muted">Profile</div>
            <div className="h2">My account</div>
            <div className="muted">{user.email}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await signOut();
            nav('/');
          }}
        >
          Logout
        </button>
      </header>

      <section className="summary-grid">
        <div className="summary-tile">
          <div className="muted">Total orders</div>
          <div className="summary-value">{orders.length}</div>
        </div>
        <div className="summary-tile">
          <div className="muted">Pending</div>
          <div className="summary-value">{orders.filter((o) => o.status === 'pending').length}</div>
        </div>
        <div className="summary-tile">
          <div className="muted">Delivered</div>
          <div className="summary-value">{orders.filter((o) => o.status === 'delivered').length}</div>
        </div>
      </section>

      <section className="card">
        <div className="row">
          <div className="h2">My Orders</div>
          <div className="spacer" />
          <Link to="/order" className="btn btn-ghost">
            New order
          </Link>
        </div>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : err ? (
          <div className="alert alert-error">{err}</div>
        ) : orders.length === 0 ? (
          <div className="muted">No orders yet.</div>
        ) : (
          <div className="order-history" style={{ marginTop: 10 }}>
            {orders.map((o) => (
              <Link key={o.id} to={`/profile/orders/${o.id}`} className="order-history-card">
                <div className="order-history-top">
                  <div className="icon-box" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        d="M7 4h10l1 4H6l1-4zm-1 6h12l-1 10H7L6 10zm4 2v6h2v-6h-2z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="order-history-meta">
                    <div className="item-title">{o.customer_name || 'Order'}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      {o.delivery_address}
                    </div>
                    <div className="status-row">
                      <div className={`pill pill-${o.status}`}>{statusLabel(o.status)}</div>
                      <span className="muted">{new Date(o.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

