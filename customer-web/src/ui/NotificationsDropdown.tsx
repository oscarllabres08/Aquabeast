import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

type NotifRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  data: any;
  order_id: string | null;
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function NotificationsDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const didAskPermRef = useRef(false);

  async function load() {
    if (!user) return;
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id,title,body,created_at,read_at,data,order_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) setErr(error.message);
    setRows((data ?? []) as NotifRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    load();
    // Ask permission once (best-effort)
    if (!didAskPermRef.current && typeof window !== 'undefined' && 'Notification' in window) {
      didAskPermRef.current = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`customer-notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as any;
          // Browser popup (only when page open; without service worker this won't work in background)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const notif = new Notification(String(n.title ?? 'Notification'), {
                body: String(n.body ?? ''),
              });
              notif.onclick = () => {
                const orderId = (n.order_id ?? n.data?.orderId) as string | undefined;
                if (orderId) nav(`/profile/orders/${orderId}`);
                else nav('/order');
              };
            } catch {
              // ignore
            }
          }
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = useMemo(() => rows.filter((r) => !r.read_at).length, [rows]);

  async function markRead(id: string) {
    if (!user) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('recipient_id', user.id);
  }

  async function clearAll() {
    if (!user) return;
    setErr(null);
    const { error } = await supabase.from('notifications').delete().eq('recipient_id', user.id);
    if (error) setErr(error.message);
    setRows([]);
  }

  if (!open) return null;

  return (
    <div className="notif-popover-wrap" role="dialog" aria-label="Notifications">
      <button className="notif-backdrop" type="button" onClick={onClose} aria-label="Close notifications" />
      <div className="notif-popover">
        <div className="notif-head">
          <div>
            <div className="section-title">Notifications</div>
            <div className="muted">{unread ? `${unread} unread` : 'All caught up'}</div>
          </div>
          <div className="spacer" />
          <button className="btn btn-ghost" type="button" onClick={clearAll}>
            Clear
          </button>
        </div>

        <div className="divider" />

        <div className="notif-list">
          {loading ? <div className="muted">Loading…</div> : null}
          {err ? <div className="alert alert-error">{err}</div> : null}
          {!loading && !err && rows.length === 0 ? <div className="muted">No notifications yet.</div> : null}

          {rows.map((n) => {
            const orderId = (n.order_id ?? n.data?.orderId) as string | undefined;
            return (
              <button
                key={n.id}
                type="button"
                className={`notif-item ${n.read_at ? '' : 'notif-item-unread'}`.trim()}
                onClick={async () => {
                  await markRead(n.id);
                  onClose();
                  if (orderId) nav(`/profile/orders/${orderId}`);
                  else nav('/order');
                }}
              >
                <div className="notif-dot2" aria-hidden="true" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="item-title">{n.title}</div>
                  <div className="muted" style={{ marginTop: 2 }}>
                    {n.body}
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12, fontWeight: 800 }}>
                    {timeLabel(n.created_at)}
                  </div>
                </div>
                <div className="chev" aria-hidden="true">
                  ›
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

