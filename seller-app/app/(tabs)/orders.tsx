import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Screen } from '../../ui/components/Screen';
import { Card } from '../../ui/components/Card';
import { Text } from '../../ui/components/Text';
import { Button } from '../../ui/components/Button';
import { theme } from '../../ui/theme';

type OrderItemPreview = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_id: string | null;
  products?: {
    image_url?: string | null;
  } | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  contact_number: string;
  delivery_address: string;
  notes: string | null;
  status: string;
  created_at: string;
  order_items?: OrderItemPreview[];
};

const STATUS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'orders' | 'delivered'>('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    async function load() {
      setError(null);
      setLoading(true);
      const { data, error: err } = await supabase
        .from('orders')
        .select(
          'id,customer_name,contact_number,delivery_address,notes,status,created_at,order_items(id,product_name,quantity,unit_price,product_id,products(image_url))'
        )
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (err) setError(err.message);
      setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    }

    load();
    const channel = supabase
      .channel(`seller-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function setStatusForOrder(orderId: string, next: string) {
    setUpdatingId(orderId);
    setError(null);
    try {
      const { error: err } = await supabase.from('orders').update({ status: next }).eq('id', orderId);
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled'),
    [orders]
  );
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders]);
  const preparingCount = useMemo(
    () => orders.filter((o) => o.status === 'preparing' || o.status === 'on_the_way').length,
    [orders]
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.sm }}>
        <Animated.View entering={FadeInDown.duration(240)} style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="muted" weight="bold">
                Seller management
              </Text>
              <Text variant="title" weight="extrabold">
                Orders
              </Text>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            </View>
          </View>
          {loading ? <Text variant="muted">Loading…</Text> : null}
          {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(240).delay(40)}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Card
                style={{
                  paddingVertical: theme.spacing.md,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                }}
              >
                <Text variant="muted" weight="bold">
                  Active
                </Text>
                <Text variant="title" weight="extrabold" style={{ marginTop: 2 }}>
                  {activeOrders.length}
                </Text>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card
                style={{
                  paddingVertical: theme.spacing.md,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                }}
              >
                <Text variant="muted" weight="bold">
                  In progress
                </Text>
                <Text variant="title" weight="extrabold" style={{ marginTop: 2 }}>
                  {preparingCount}
                </Text>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card
                style={{
                  paddingVertical: theme.spacing.md,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                }}
              >
                <Text variant="muted" weight="bold">
                  Delivered
                </Text>
                <Text variant="title" weight="extrabold" style={{ marginTop: 2 }}>
                  {deliveredOrders.length}
                </Text>
              </Card>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(240).delay(70)} style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              padding: 6,
              borderRadius: 18,
              backgroundColor: '#EAF2FF',
              borderWidth: 1,
              borderColor: 'rgba(18,101,214,0.10)',
              gap: 6,
            }}
          >
            <CategoryTab
              label={`Orders (${activeOrders.length})`}
              active={selectedCategory === 'orders'}
              tone="primary"
              onPress={() => setSelectedCategory('orders')}
            />
            <CategoryTab
              label={`Delivered (${deliveredOrders.length})`}
              active={selectedCategory === 'delivered'}
              tone="success"
              onPress={() => setSelectedCategory('delivered')}
            />
          </View>
        </Animated.View>

        {selectedCategory === 'orders' ? (
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader
              title="Orders"
              subtitle="New and ongoing customer orders."
              icon="flash-outline"
            />
            {!loading && !error && activeOrders.length === 0 ? (
              <Card>
                <Text weight="extrabold">No active orders yet</Text>
                <Text variant="muted" style={{ marginTop: 6 }}>
                  New customer orders will appear here automatically.
                </Text>
              </Card>
            ) : null}

            {activeOrders.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.duration(220).delay(30 * index)}>
                <OrderCard
                  order={item}
                  updating={updatingId === item.id}
                  onChangeStatus={(next) => setStatusForOrder(item.id, next)}
                  onViewDetails={() => router.push(`/order/${item.id}`)}
                />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader
              title="Delivered"
              subtitle="Completed orders kept as history."
              icon="archive-outline"
            />
            {!loading && !error && deliveredOrders.length === 0 ? (
              <Card>
                <Text weight="extrabold">No delivered orders yet</Text>
                <Text variant="muted" style={{ marginTop: 6 }}>
                  Delivered orders will stay here as your record history.
                </Text>
              </Card>
            ) : null}

            {deliveredOrders.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.duration(220).delay(30 * index)}>
                <OrderCard
                  order={item}
                  updating={updatingId === item.id}
                  onChangeStatus={(next) => setStatusForOrder(item.id, next)}
                  onViewDetails={() => router.push(`/order/${item.id}`)}
                  delivered
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function CategoryTab({
  label,
  active,
  tone,
  onPress,
}: {
  label: string;
  active: boolean;
  tone: 'primary' | 'success';
  onPress: () => void;
}) {
  const activeBackground = tone === 'success' ? 'rgba(34,197,94,0.16)' : 'rgba(18,101,214,0.14)';
  const activeBorder = tone === 'success' ? 'rgba(34,197,94,0.30)' : 'rgba(18,101,214,0.24)';
  const activeText = tone === 'success' ? theme.colors.success : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        backgroundColor: active ? activeBackground : 'transparent',
        borderWidth: active ? 1 : 0,
        borderColor: active ? activeBorder : 'transparent',
      }}
    >
      <Text
        weight="extrabold"
        style={{
          color: active ? activeText : theme.colors.muted,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const bg =
    status === 'confirmed'
      ? 'rgba(18,101,214,0.12)'
      : status === 'preparing'
        ? 'rgba(245,158,11,0.14)'
        : status === 'on_the_way'
          ? 'rgba(155,89,182,0.14)'
          : status === 'delivered'
            ? 'rgba(34,197,94,0.14)'
            : status === 'cancelled'
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(18,101,214,0.06)';

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: status === 'delivered' ? 'rgba(34,197,94,0.28)' : theme.colors.border,
        backgroundColor: bg,
      }}
    >
      <Text variant="chip" weight="extrabold" style={{ color: theme.colors.text }}>
        {status.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

function OrderCard({
  order,
  updating,
  onChangeStatus,
  onViewDetails,
  delivered = false,
}: {
  order: OrderRow;
  updating: boolean;
  onChangeStatus: (next: string) => void;
  onViewDetails: () => void;
  delivered?: boolean;
}) {
  const firstItem = order.order_items?.[0];
  const imagePath = firstItem?.products?.image_url ?? null;
  const extraCount = Math.max(0, (order.order_items?.length ?? 0) - 1);
  const imageUri = publicImageUrl(imagePath);

  return (
    <Card
      style={{
        borderRadius: 18,
        borderColor: delivered ? 'rgba(34,197,94,0.35)' : theme.colors.border,
        backgroundColor: delivered ? 'rgba(34,197,94,0.04)' : theme.colors.card,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: delivered ? 'rgba(34,197,94,0.20)' : theme.colors.border,
            backgroundColor: delivered ? 'rgba(34,197,94,0.08)' : '#EEF4FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text weight="extrabold" style={{ color: theme.colors.primary }}>
              IMG
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text weight="extrabold">{order.customer_name}</Text>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: delivered ? 'rgba(34,197,94,0.10)' : 'rgba(18,101,214,0.08)',
                borderWidth: 1,
                borderColor: delivered ? 'rgba(34,197,94,0.18)' : 'rgba(18,101,214,0.12)',
              }}
            >
              <Text
                variant="chip"
                weight="extrabold"
                style={{ color: delivered ? theme.colors.success : theme.colors.primary }}
              >
                {firstItem?.product_name ?? 'Order item'}
              </Text>
            </View>
          </View>

          <Text variant="muted" style={{ marginTop: 4 }}>
            {firstItem ? `${firstItem.quantity} pc • ₱${firstItem.unit_price.toFixed(2)}` : 'No item info'}
            {extraCount > 0 ? ` • +${extraCount} more item${extraCount > 1 ? 's' : ''}` : ''}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Ionicons name="person-outline" size={14} color={theme.colors.muted} />
            <Text variant="muted">{order.contact_number}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
            <Ionicons name="location-outline" size={14} color={theme.colors.muted} style={{ marginTop: 1 }} />
            <Text variant="muted" style={{ flex: 1 }}>
              {order.delivery_address}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
            <Text variant="muted">{new Date(order.created_at).toLocaleString()}</Text>
          </View>
        </View>

        <StatusPill status={order.status} />
      </View>

      {order.notes ? (
        <View
          style={{
            marginTop: theme.spacing.md,
            padding: 10,
            borderRadius: 12,
            backgroundColor: delivered ? 'rgba(34,197,94,0.04)' : '#F8FBFF',
            borderWidth: 1,
            borderColor: delivered ? 'rgba(34,197,94,0.16)' : theme.colors.border,
          }}
        >
          <Text variant="muted" weight="bold">
            Notes / Instruction
          </Text>
          <Text style={{ marginTop: 4 }}>{order.notes}</Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 10,
          marginTop: theme.spacing.md,
        }}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: delivered ? 'rgba(34,197,94,0.22)' : 'rgba(18,101,214,0.14)',
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: delivered ? 'rgba(240,253,244,0.95)' : '#FFFFFF',
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: 2,
              backgroundColor: delivered ? 'rgba(240,253,244,0.95)' : '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="muted" weight="bold">
              Set as
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={delivered ? theme.colors.success : theme.colors.primary}
            />
          </View>
          <Picker
            enabled={!updating && !delivered}
            dropdownIconColor={delivered ? theme.colors.success : theme.colors.primary}
            selectedValue={delivered ? 'delivered' : order.status}
            onValueChange={(value) => {
              if (!value || value === order.status) return;
              onChangeStatus(String(value));
            }}
          >
            <Picker.Item label="Set as..." value="" />
            {STATUS_OPTIONS.map((option) => (
              <Picker.Item key={option.key} label={option.label} value={option.key} />
            ))}
          </Picker>
        </View>
        <View style={{ width: 122, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={onViewDetails}
            style={{
              minHeight: 54,
              borderRadius: 12,
              backgroundColor: theme.colors.primary,
              borderWidth: 1,
              borderColor: 'rgba(18,101,214,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              ...theme.shadow.card,
            }}
          >
            <Text variant="h2" weight="extrabold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
              View details
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: 'rgba(18,101,214,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(18,101,214,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="h2" weight="extrabold">
          {title}
        </Text>
        <Text variant="muted">{subtitle}</Text>
      </View>
    </View>
  );
}

function publicImageUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  const { data } = supabase.storage.from('wrs-assets').getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

