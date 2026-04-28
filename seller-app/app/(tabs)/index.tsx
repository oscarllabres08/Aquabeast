import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { theme } from '../../ui/theme';
import { Screen } from '../../ui/components/Screen';
import { Card } from '../../ui/components/Card';
import { Text } from '../../ui/components/Text';
import { Button } from '../../ui/components/Button';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
};

type ItemRow = {
  order_id: string;
  unit_price: number;
  quantity: number;
};

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSeenOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    async function load() {
      setError(null);
      setLoading(true);
      const { data: o, error: oErr } = await supabase
        .from('orders')
        .select('id,status,created_at,customer_name')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!alive) return;
      if (oErr) {
        setError(oErr.message);
        setLoading(false);
        return;
      }
      const ord = (o ?? []) as OrderRow[];
      setOrders(ord);
      if (!lastSeenOrderIdRef.current && ord.length > 0) {
        lastSeenOrderIdRef.current = ord[0]!.id;
      }

      const ids = ord.slice(0, 50).map((x) => x.id);
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const { data: it, error: itErr } = await supabase
        .from('order_items')
        .select('order_id,unit_price,quantity')
        .in('order_id', ids);
      if (!alive) return;
      if (itErr) setError(itErr.message);
      setItems((it ?? []) as ItemRow[]);
      setLoading(false);
    }

    load();
    const channel = supabase
      .channel(`seller-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` },
        async (payload) => {
          const newRow = payload.new as { id?: string; customer_name?: string } | null;
          const newId = newRow?.id;
          if (!newId) return;

          // Avoid spamming on initial load.
          if (lastSeenOrderIdRef.current === newId) return;
          lastSeenOrderIdRef.current = newId;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'New order',
              body: `${newRow?.customer_name ?? 'Customer'} placed an order.`,
              data: { orderId: newId },
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalsByOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      map.set(it.order_id, (map.get(it.order_id) ?? 0) + it.unit_price * it.quantity);
    }
    return map;
  }, [items]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const todaySales = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    let sum = 0;
    for (const o of orders) {
      if (o.status !== 'delivered') continue;
      if (new Date(o.created_at).getTime() < start.getTime()) continue;
      sum += totalsByOrder.get(o.id) ?? 0;
    }
    return sum;
  }, [orders, totalsByOrder]);

  const recent = orders.slice(0, 5);

  return (
    <Screen style={{ paddingBottom: theme.spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Text variant="title" weight="extrabold" style={{ flex: 1 }}>
          Aquabeast WRS
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/orders')}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
      <Animated.View entering={FadeInDown.duration(240)} style={{ gap: theme.spacing.md }}>
        <Card
          style={{
            backgroundColor: '#0F5ED3',
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        >
          <Text variant="muted" weight="bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Today’s Sales
          </Text>
          <Text variant="h1" weight="extrabold" style={{ color: '#FFFFFF', marginTop: 6 }}>
            {money(todaySales)}
          </Text>
          <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <Button title="Today" variant="ghost" />
          </View>
        </Card>

        {loading ? <Text variant="muted">Loading…</Text> : null}
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatCard label="Total Orders" value={orders.length} />
          <StatCard label="Pending" value={counts.pending ?? 0} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatCard label="Completed" value={counts.delivered ?? 0} />
          <StatCard label="Cancelled" value={counts.cancelled ?? 0} />
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="h2" weight="extrabold">
              Recent Orders
            </Text>
            <View style={{ flex: 1 }} />
            <Button variant="ghost" title="View all" onPress={() => router.push('/(tabs)/orders')} />
          </View>

          <View style={{ marginTop: theme.spacing.sm }}>
            <FlatList
              data={recent}
              keyExtractor={(o) => o.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 10 }} />
              )}
              renderItem={({ item }) => (
                <Button
                  variant="ghost"
                  onPress={() => router.push(`/order/${item.id}`)}
                  style={{ alignSelf: 'stretch' }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text weight="extrabold">{item.customer_name}</Text>
                      <Text variant="muted" style={{ marginTop: 2 }}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </View>
                    <Text weight="extrabold" style={{ color: theme.colors.primary }}>
                      {money(totalsByOrder.get(item.id) ?? 0)}
                    </Text>
                  </View>
                </Button>
              )}
            />
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, padding: theme.spacing.md }}>
      <Text variant="muted" weight="bold">
        {label}
      </Text>
      <Text variant="title" weight="extrabold" style={{ marginTop: 6 }}>
        {value}
      </Text>
    </Card>
  );
}
