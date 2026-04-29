import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';

import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type Ctx = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastPopupIdRef = useRef<string | null>(null);

  async function refresh() {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null);
    setUnreadCount(count ?? 0);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-badge-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const n = payload.new as any;
          const id = String(n.id ?? '');
          if (id && lastPopupIdRef.current !== id) {
            lastPopupIdRef.current = id;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: String(n.title ?? 'Notification'),
                body: String(n.body ?? ''),
                data: { orderId: n.order_id ?? n.data?.orderId },
              },
              trigger: null,
            });
          }
          refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo<Ctx>(() => ({ unreadCount, refresh }), [unreadCount]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

