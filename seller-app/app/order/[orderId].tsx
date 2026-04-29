import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, Linking, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Screen } from '../../ui/components/Screen';
import { Card } from '../../ui/components/Card';
import { Text } from '../../ui/components/Text';
import { SellerOrdersSkeleton } from '../../ui/components/Skeleton';
import { theme } from '../../ui/theme';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
  delivery_address: string;
  landmark: string | null;
  contact_number: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
};

type ItemRow = {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  product_id: string | null;
  products?: {
    image_url?: string | null;
  } | null;
};

const NEXT_STATUSES: Array<{ key: string; label: string }> = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || !orderId) return;
    let alive = true;

    async function load() {
      setError(null);
      setLoading(true);
      const { data: o, error: oErr } = await supabase
        .from('orders')
        .select('id,status,created_at,customer_name,delivery_address,landmark,contact_number,latitude,longitude,notes')
        .eq('id', orderId)
        .single();
      if (!alive) return;
      if (oErr) {
        setError(oErr.message);
        setLoading(false);
        return;
      }
      setOrder(o as OrderRow);

      const { data: it, error: itErr } = await supabase
        .from('order_items')
        .select('id,product_name,unit_price,quantity,product_id,products(image_url)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!alive) return;
      if (itErr) {
        setError(itErr.message);
        setLoading(false);
        return;
      }
      setItems((it ?? []) as ItemRow[]);
      setLoading(false);
    }

    load();
    const channel = supabase
      .channel(`seller-order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () =>
        load()
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user, orderId]);

  const total = useMemo(() => items.reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);

  async function setStatus(next: string) {
    if (!order) return;
    setUpdating(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({ status: next })
        .eq('id', order.id);
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  async function openInMaps() {
    if (!order) return;
    const hasCoords = typeof order.latitude === 'number' && typeof order.longitude === 'number';
    const destination = hasCoords
      ? `${order.latitude},${order.longitude}`
      : encodeURIComponent(`${order.delivery_address}${order.landmark ? `, ${order.landmark}` : ''}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    await Linking.openURL(url);
  }

  async function callCustomer() {
    if (!order?.contact_number) return;
    await Linking.openURL(`tel:${order.contact_number}`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Order Details' }} />

      <ScrollView contentContainerStyle={{ paddingTop: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 28 }}>
        {loading ? <SellerOrdersSkeleton /> : null}
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        {order ? (
          <>
            <Animated.View entering={FadeInDown.duration(220)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="muted" weight="bold">
                      Order status
                    </Text>
                    <Text variant="title" weight="extrabold" style={{ marginTop: 6 }}>
                      {order.status.replaceAll('_', ' ')}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: 'rgba(18,101,214,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(18,101,214,0.14)',
                    }}
                  >
                    <Text variant="chip" weight="extrabold" style={{ color: theme.colors.primary }}>
                      #{order.id.slice(0, 8)}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
                  <Text variant="muted">{new Date(order.created_at).toLocaleString()}</Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(220).delay(40)}>
              <Card>
                <Text variant="h2" weight="extrabold">
                  Customer information
                </Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                    <Text weight="extrabold">{order.customer_name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                    <Text variant="muted">{order.contact_number}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text>{order.delivery_address}</Text>
                      {order.landmark ? <Text variant="muted">Landmark: {order.landmark}</Text> : null}
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Open in Maps" onPress={openInMaps} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button variant="ghost" title="Call Customer" onPress={callCustomer} />
                  </View>
                </View>

                {order.notes ? (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: '#F8FBFF',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text variant="muted" weight="bold">
                      Notes / Instruction
                    </Text>
                    <Text style={{ marginTop: 4 }}>{order.notes}</Text>
                  </View>
                ) : null}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(220).delay(80)}>
              <Card>
                <Text variant="h2" weight="extrabold">
                  Order items
                </Text>

                <View style={{ marginTop: 10 }}>
                  {items.map((i) => (
                    <View
                      key={i.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 14,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: '#EEF4FF',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {publicImageUrl(i.products?.image_url) ? (
                          <Image
                            source={{ uri: publicImageUrl(i.products?.image_url)! }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text weight="extrabold" style={{ color: theme.colors.primary }}>
                            IMG
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text weight="extrabold">{i.product_name}</Text>
                        <Text variant="muted" style={{ marginTop: 2 }}>
                          {i.quantity} × {money(i.unit_price)}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 10,
                          backgroundColor: 'rgba(18,101,214,0.06)',
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text weight="extrabold">{money(i.unit_price * i.quantity)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="muted" weight="bold">
                    Total amount
                  </Text>
                  <Text variant="title" weight="extrabold" style={{ color: theme.colors.primary }}>
                    {money(total)}
                  </Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(220).delay(120)}>
              <Card>
                <Text variant="h2" weight="extrabold">
                  Set as
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    marginTop: 12,
                  }}
                >
                  <Picker
                    enabled={!updating}
                    selectedValue={order.status}
                    onValueChange={(value) => {
                      if (!value || value === order.status) return;
                      setStatus(String(value));
                    }}
                  >
                    {NEXT_STATUSES.map((s) => (
                      <Picker.Item key={s.key} label={s.label} value={s.key} />
                    ))}
                  </Picker>
                </View>
              </Card>
            </Animated.View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function publicImageUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  const { data } = supabase.storage.from('wrs-assets').getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

