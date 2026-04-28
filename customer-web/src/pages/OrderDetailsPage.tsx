import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
  delivery_address: string;
  contact_number: string;
  notes: string | null;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  products?: {
    image_url?: string | null;
  } | null;
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

function formatMoney(amount: number) {
  return `₱${amount.toFixed(2)}`;
}

export function OrderDetailsPage() {
  const nav = useNavigate();
  const { orderId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    if (authLoading) return;
    if (!user) {
      nav('/auth');
      return;
    }

    let alive = true;
    async function load() {
      setErr(null);
      setLoading(true);

      const { data: o, error: oErr } = await supabase
        .from('orders')
        .select('id,status,created_at,customer_name,delivery_address,contact_number,notes')
        .eq('id', orderId)
        .single();
      if (!alive) return;
      if (oErr) {
        setErr(oErr.message);
        setLoading(false);
        return;
      }
      setOrder(o as OrderRow);

      const { data: it, error: itErr } = await supabase
        .from('order_items')
        .select('id,product_name,unit_price,quantity,products(image_url)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!alive) return;
      if (itErr) {
        setErr(itErr.message);
        setLoading(false);
        return;
      }
      setItems((it ?? []) as OrderItemRow[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => load()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, user, authLoading]);

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  function publicImageUrl(pathOrUrl?: string | null) {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const { data } = supabase.storage.from('wrs-assets').getPublicUrl(pathOrUrl);
    return data.publicUrl;
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <div className="spacer" />
        <Link className="btn btn-ghost" to="/profile">
          Profile
        </Link>
      </header>

      {loading ? (
        <section className="card">Loading…</section>
      ) : err ? (
        <section className="card">
          <div className="alert alert-error">{err}</div>
        </section>
      ) : !order ? (
        <section className="card">
          <div className="muted">Order not found.</div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="row">
              <div>
                <div className="muted">Order</div>
                <div className="h2">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div className="spacer" />
              <div className={`pill pill-${order.status}`}>{statusLabel(order.status)}</div>
            </div>

            <div className="divider" />

            <div className="detail-stack">
              <div>
                <div className="muted">Delivery details</div>
                <div className="item-title" style={{ marginTop: 4 }}>
                  {order.customer_name}
                </div>
                <div className="muted" style={{ marginTop: 2 }}>
                  {order.contact_number}
                </div>
                <div style={{ marginTop: 6 }}>{order.delivery_address}</div>
              </div>

              {order.notes ? (
                <div className="detail-note">
                  <div className="muted">Notes / Instruction</div>
                  <div style={{ marginTop: 4 }}>{order.notes}</div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="card">
            <div className="h2">Items</div>
            <div style={{ marginTop: 8 }}>
              {items.map((i) => (
                <div key={i.id} className="item-card">
                  {publicImageUrl(i.products?.image_url) ? (
                    <img className="item-thumb" src={publicImageUrl(i.products?.image_url)!} alt={i.product_name} />
                  ) : (
                    <div className="item-thumb" aria-hidden="true" />
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="item-title">{i.product_name}</div>
                    <div className="muted">
                      {i.quantity} × {formatMoney(i.unit_price)}
                    </div>
                  </div>
                  <div className="money-chip">{formatMoney(i.unit_price * i.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="row">
              <div className="muted">Total</div>
              <div className="spacer" />
              <div className="h2">{formatMoney(total)}</div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

