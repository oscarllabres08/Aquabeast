import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export function useNotificationsUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  async function refresh() {
    if (!user) {
      setCount(0);
      return;
    }
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null);
    setCount(count ?? 0);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-count-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { unreadCount: count, refresh };
}

