import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/icon.jpeg';
import { NotificationsDropdown } from '../ui/NotificationsDropdown';
import { useNotificationsUnreadCount } from '../ui/useNotificationsUnreadCount';

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
  const { unreadCount } = useNotificationsUnreadCount();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setProfile(null);
      setLoading(false);
      return;
    }

    const userId = user.id;
    let alive = true;
    async function load() {
      setErr(null);
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name,phone')
        .eq('user_id', userId)
        .maybeSingle();
      if (!alive) return;
      setProfile((prof ?? null) as any);

      const { data, error } = await supabase
        .from('orders')
        .select('id,status,created_at,customer_name,delivery_address')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) setErr(error.message);
      setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`customer-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${userId}` },
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
      <NotificationsDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
      <header className="topbar">
        <img className="brand-logo" src={logoImg} alt="Aquabeast logo" />
        <div className="brand-title brand-title-center">Aquabeast WRS</div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications"
          onClick={() => setNotifOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"
              fill="currentColor"
            />
            <path
              d="M19 17H5a2 2 0 0 1 2-2V10a5 5 0 0 1 10 0v5a2 2 0 0 1 2 2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 ? (
            <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </header>

      <section
        className="card"
        style={{
          background: 'linear-gradient(180deg, rgba(26,99,255,0.95), rgba(10,69,201,0.95))',
          borderColor: 'rgba(255,255,255,0.15)',
          color: '#fff',
        }}
      >
        <div className="row" style={{ alignItems: 'center' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.22)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
            }}
          >
            {(profile?.display_name?.[0] ?? user.email?.[0] ?? 'A').toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, letterSpacing: '-0.2px' }}>
              {profile?.display_name || 'Customer'}
            </div>
            <div style={{ opacity: 0.9, fontSize: 13, fontWeight: 700 }}>
              {profile?.phone ? `📞 ${profile.phone}` : '📞 Add phone in your profile'}
            </div>
            <div style={{ opacity: 0.92, fontSize: 13, fontWeight: 700 }}>{user.email}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row">
          <div className="section-title">My orders</div>
          <div className="spacer" />
          <Link to="/profile" className="muted" style={{ fontWeight: 900 }}>
            View all
          </Link>
        </div>
        <div style={{ marginTop: 10 }}>
          {loading ? (
            <div className="muted">Loading…</div>
          ) : err ? (
            <div className="alert alert-error">{err}</div>
          ) : orders.length === 0 ? (
            <div className="muted">No orders yet.</div>
          ) : (
            <div className="order-history">
              {orders.slice(0, 3).map((o) => (
                <Link key={o.id} to={`/profile/orders/${o.id}`} className="order-history-card">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div className="item-title">{o.customer_name || 'Order'}</div>
                      <div className="muted" style={{ marginTop: 2 }}>
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                      <div className="muted" style={{ marginTop: 2 }}>
                        {o.delivery_address}
                      </div>
                    </div>
                    <div className={`pill pill-${o.status}`}>{statusLabel(o.status)}</div>
                    <div className="chev" aria-hidden="true">
                      ›
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="section-title">Account settings</div>
        <div className="list" style={{ marginTop: 10 }}>
          <Link className="list-tile" to="/profile/edit">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 12.2a4.6 4.6 0 1 0-4.6-4.6A4.6 4.6 0 0 0 12 12.2Z" fill="currentColor" opacity="0.2" />
                <path d="M4.7 21a7.3 7.3 0 0 1 14.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 12.2a4.6 4.6 0 1 0-4.6-4.6A4.6 4.6 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Edit profile</div>
              <div className="muted">Update name and phone</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/profile/addresses">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" fill="currentColor" opacity="0.2" />
                <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Addresses</div>
              <div className="muted">Manage delivery addresses</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/profile/notifications">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z" fill="currentColor" opacity="0.2" />
                <path d="M19 17H5a2 2 0 0 1 2-2V10a5 5 0 0 1 10 0v5a2 2 0 0 1 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Notifications</div>
              <div className="muted">Order updates</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/profile/password">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4l2.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Change password</div>
              <div className="muted">Secure your account</div>
            </div>
            <div className="chev">›</div>
          </Link>
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
      </section>

      <section className="card">
        <div className="section-title">About</div>
        <div className="list" style={{ marginTop: 10 }}>
          <Link className="list-tile" to="/about">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 7.4h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">About Aquabeast WRS</div>
              <div className="muted">Learn more about us</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/legal/terms">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M7 3h10v18H7V3Z" fill="currentColor" opacity="0.2" />
                <path d="M7 3h10v18H7V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Terms & Conditions</div>
              <div className="muted">Read our terms</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/legal/privacy">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2 4 6v6c0 6 4 9 8 10 4-1 8-4 8-10V6l-8-4Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2 4 6v6c0 6 4 9 8 10 4-1 8-4 8-10V6l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Privacy Policy</div>
              <div className="muted">How we handle data</div>
            </div>
            <div className="chev">›</div>
          </Link>
          <Link className="list-tile" to="/help">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Help & Support</div>
              <div className="muted">Get assistance</div>
            </div>
            <div className="chev">›</div>
          </Link>
        </div>
      </section>
    </div>
  );
}

