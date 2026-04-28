import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Screen } from '../../ui/components/Screen';
import { Card } from '../../ui/components/Card';
import { Text } from '../../ui/components/Text';
import { Button } from '../../ui/components/Button';
import { TextField } from '../../ui/components/TextField';
import { theme } from '../../ui/theme';

type ProfileRow = {
  store_name: string | null;
  store_code: string | null;
  phone: string | null;
  store_address: string | null;
  business_hours: string | null;
  store_logo_url: string | null;
  expo_push_token: string | null;
};

type WalletRow = {
  id: string;
  provider: string;
  account_name: string | null;
  account_number: string | null;
  qr_image_path: string | null;
  is_active: boolean;
};

const BUCKET = 'wrs-assets';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [wallets, setWallets] = useState<WalletRow[]>([]);

  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [phone, setPhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const publicLogoUrl = useMemo(() => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith('http')) return logoUrl;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(logoUrl);
    return data.publicUrl;
  }, [logoUrl]);

  async function load() {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { data, error: pErr } = await supabase
      .from('profiles')
      .select('store_name,store_code,phone,store_address,business_hours,store_logo_url,expo_push_token')
      .eq('user_id', user.id)
      .single();
    if (pErr) setError(pErr.message);
    const row = (data ?? null) as ProfileRow | null;
    setProfile(row);
    setStoreName(row?.store_name ?? '');
    setStoreCode(row?.store_code ?? '');
    setPhone(row?.phone ?? '');
    setStoreAddress(row?.store_address ?? '');
    setBusinessHours(row?.business_hours ?? '');
    setLogoUrl(row?.store_logo_url ?? null);

    const { data: w, error: wErr } = await supabase
      .from('ewallet_accounts')
      .select('id,provider,account_name,account_number,qr_image_path,is_active')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    if (wErr) setError((prev) => prev ?? wErr.message);
    setWallets((w ?? []) as WalletRow[]);

    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`seller-profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () =>
        load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ewallet_accounts', filter: `seller_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        store_name: storeName || null,
        store_code: storeCode || null,
        phone: phone || null,
        store_address: storeAddress || null,
        business_hours: businessHours || null,
        store_logo_url: logoUrl || null,
      })
      .eq('user_id', user.id);
    if (err) setError(err.message);
    setSaving(false);
  }

  async function pickAndUploadImage(prefix: 'logo' | 'qr') {
    if (!user) return null;
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Media permission is required.');
      return null;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled) return null;

    const asset = res.assets[0];
    const uri = asset.uri;
    const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${prefix}/${Date.now()}.${ext}`;
    const blob = await (await fetch(uri)).blob();

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    });
    if (upErr) {
      setError(upErr.message);
      return null;
    }
    return path;
  }

  async function addWallet() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('ewallet_accounts').insert({
      seller_id: user.id,
      provider: 'GCash',
      account_name: null,
      account_number: null,
      qr_image_path: null,
      is_active: true,
    });
    if (err) setError(err.message);
    setSaving(false);
  }

  async function updateWallet(id: string, patch: Partial<WalletRow>) {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('ewallet_accounts').update(patch).eq('id', id);
    if (err) setError(err.message);
    setSaving(false);
  }

  async function uploadWalletQr(id: string) {
    const path = await pickAndUploadImage('qr');
    if (!path) return;
    await updateWallet(id, { qr_image_path: path });
  }

  function walletQrPublicUrl(path: string | null) {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <Screen>
      <Text variant="title" weight="extrabold">
        Profile
      </Text>

      {loading ? <Text variant="muted">Loading…</Text> : null}
      {error ? <Text style={{ color: theme.colors.danger }} weight="bold">{error}</Text> : null}

      <Animated.View entering={FadeInDown.duration(220)} style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Card>
          <Text variant="h2" weight="extrabold">
            Business profile
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: '#EEF4FF',
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {publicLogoUrl ? (
                <Image source={{ uri: publicLogoUrl }} style={{ width: 56, height: 56 }} />
              ) : (
                <Text weight="extrabold" style={{ color: theme.colors.primary }}>
                  LOGO
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="ghost"
                title="Upload logo"
                disabled={saving}
                onPress={async () => {
                  const path = await pickAndUploadImage('logo');
                  if (!path) return;
                  setLogoUrl(path);
                  await supabase.from('profiles').update({ store_logo_url: path }).eq('user_id', user?.id);
                }}
              />
            </View>
          </View>

          <View style={{ marginTop: 12, gap: 10 }}>
            <TextField label="Store name" value={storeName} onChangeText={setStoreName} placeholder="Aquabeast WRS" />
            <TextField label="Store code" value={storeCode} onChangeText={setStoreCode} placeholder="AQUA1234" />
            <TextField label="Phone number" value={phone} onChangeText={setPhone} placeholder="09xx xxx xxxx" inputMode="tel" />
            <TextField
              label="Store address"
              value={storeAddress}
              onChangeText={setStoreAddress}
              placeholder="House no., street, barangay, city"
            />
            <TextField
              label="Business hours"
              value={businessHours}
              onChangeText={setBusinessHours}
              placeholder="8:00 AM - 8:00 PM"
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Button title={saving ? 'Saving…' : 'Save profile'} disabled={saving} onPress={saveProfile} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="h2" weight="extrabold">
              E‑Wallet accounts
            </Text>
            <View style={{ flex: 1 }} />
            <Button variant="ghost" title="+ Add" disabled={saving} onPress={addWallet} />
          </View>

          <View style={{ marginTop: 12, gap: 12 }}>
            {wallets.length === 0 ? (
              <Text variant="muted">No e-wallet accounts yet.</Text>
            ) : (
              wallets.map((w) => {
                const qrUrl = walletQrPublicUrl(w.qr_image_path);
                return (
                  <Card key={w.id} style={{ padding: 12, borderRadius: 18, backgroundColor: '#FBFDFF' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text weight="extrabold" style={{ flex: 1 }}>
                        {w.provider}
                      </Text>
                      <Button
                        variant={w.is_active ? 'primary' : 'ghost'}
                        title={w.is_active ? 'Active' : 'Inactive'}
                        disabled={saving}
                        onPress={() => updateWallet(w.id, { is_active: !w.is_active })}
                      />
                    </View>

                    <View style={{ marginTop: 10, gap: 10 }}>
                      <TextField
                        label="Account name"
                        value={w.account_name ?? ''}
                        onChangeText={(v) => updateWallet(w.id, { account_name: v })}
                        placeholder="Juan Dela Cruz"
                      />
                      <TextField
                        label="Account number"
                        value={w.account_number ?? ''}
                        onChangeText={(v) => updateWallet(w.id, { account_number: v })}
                        placeholder="09xx xxx xxxx"
                      />

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: 18,
                            backgroundColor: '#EEF4FF',
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            overflow: 'hidden',
                          }}
                        >
                          {qrUrl ? (
                            <Image source={{ uri: qrUrl }} style={{ width: 84, height: 84 }} />
                          ) : null}
                        </View>
                        <View style={{ flex: 1, gap: 10 }}>
                          <Button
                            variant="ghost"
                            title={w.qr_image_path ? 'Change QR' : 'Upload QR'}
                            disabled={saving}
                            onPress={() => uploadWalletQr(w.id)}
                          />
                          <Button
                            variant="danger"
                            title="Remove"
                            disabled={saving}
                            onPress={() => updateWallet(w.id, { is_active: false })}
                          />
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </Card>

        <Card>
          <Text variant="h2" weight="extrabold">
            App settings
          </Text>
          <Text variant="muted" style={{ marginTop: 6 }}>
            Push token: {profile?.expo_push_token ? profile.expo_push_token.slice(0, 18) + '…' : 'Not registered'}
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button
              variant="ghost"
              title="Logout"
              onPress={signOut}
            />
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

