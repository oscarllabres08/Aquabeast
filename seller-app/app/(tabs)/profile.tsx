import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Screen } from '../../ui/components/Screen';
import { Card } from '../../ui/components/Card';
import { GradientCard } from '../../ui/components/GradientCard';
import { Text } from '../../ui/components/Text';
import { Button } from '../../ui/components/Button';
import { TextField } from '../../ui/components/TextField';
import { theme } from '../../ui/theme';
import { SellerProfileSkeleton } from '../../ui/components/Skeleton';

type ProfileRow = {
  store_name: string | null;
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
type ProfileSection = 'profile' | 'wallets' | 'settings' | 'help';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [walletSavingId, setWalletSavingId] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [walletDrafts, setWalletDrafts] = useState<Record<string, { account_name: string; account_number: string }>>(
    {}
  );

  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');

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
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (pErr) setError(pErr.message);
    const row = (data ?? null) as ProfileRow | null;
    setProfile(row);
    setStoreName(row?.store_name ?? '');
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
    const nextWallets = (w ?? []) as WalletRow[];
    setWallets(nextWallets);
    setWalletDrafts((prev) => {
      const next = { ...prev };
      for (const item of nextWallets) {
        if (!next[item.id]) {
          next[item.id] = {
            account_name: item.account_name ?? '',
            account_number: item.account_number ?? '',
          };
        }
      }
      return next;
    });

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
    setProfileSaving(true);
    setError(null);
    setSuccess(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        store_name: storeName || null,
        phone: phone || null,
        store_address: storeAddress || null,
        business_hours: businessHours || null,
        store_logo_url: logoUrl || null,
      })
      .eq('user_id', user.id);
    if (err) {
      const msg = err.message.includes('does not exist')
        ? `${err.message}\n\nRun latest SQL in supabase/schema.sql in Supabase SQL Editor.`
        : err.message;
      setError(msg);
    }
    setProfileSaving(false);
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

  async function addWallet(provider: 'GCash' | 'Maya') {
    if (!user) return;
    setWalletSavingId(`new-${provider}`);
    setError(null);
    setSuccess(null);
    const { error: err } = await supabase.from('ewallet_accounts').insert({
      seller_id: user.id,
      provider,
      account_name: null,
      account_number: null,
      qr_image_path: null,
      is_active: true,
    });
    if (err) setError(err.message);
    if (!err) setSuccess(`${provider} account added.`);
    setWalletSavingId(null);
  }

  async function updateWallet(id: string, patch: Partial<WalletRow>) {
    setWalletSavingId(id);
    setError(null);
    setSuccess(null);
    const { error: err } = await supabase.from('ewallet_accounts').update(patch).eq('id', id);
    if (err) setError(err.message);
    setWalletSavingId(null);
  }

  async function saveWalletDetails(id: string) {
    const d = walletDrafts[id];
    if (!d) return;
    await updateWallet(id, {
      account_name: d.account_name.trim() ? d.account_name.trim() : null,
      account_number: d.account_number.trim() ? d.account_number.trim() : null,
    });
  }

  async function changePassword() {
    if (!user?.email) {
      setError('Missing account email.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    setError(null);
    setSuccess(null);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      setError('Current password is incorrect.');
      setPasswordSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      setPasswordSaving(false);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('Password updated successfully.');
    setPasswordSaving(false);
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
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <Text variant="title" weight="extrabold">
          Profile
        </Text>

        {loading ? <SellerProfileSkeleton /> : null}
        {error ? (
          <Text style={{ color: theme.colors.danger }} weight="bold">
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text style={{ color: '#0F7B39' }} weight="bold">
            {success}
          </Text>
        ) : null}

        {!loading ? (
          <Animated.View entering={FadeInDown.duration(220)} style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          <GradientCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {publicLogoUrl ? (
                  <Image source={{ uri: publicLogoUrl }} style={{ width: 54, height: 54 }} />
                ) : (
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title" weight="extrabold" style={{ color: '#FFFFFF' }}>
                  {storeName || 'Seller'}
                </Text>
                <Text variant="muted" style={{ color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>
                  {user?.email ?? ' '}
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text variant="chip" weight="extrabold" style={{ color: '#FFFFFF' }}>
                  Verified Seller
                </Text>
              </View>
            </View>
          </GradientCard>

          <Card>
            <Pressable onPress={() => setActiveSection('profile')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
              <Text weight={activeSection === 'profile' ? 'extrabold' : 'bold'} style={{ flex: 1 }}>
                Profile
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <Pressable onPress={() => setActiveSection('wallets')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
              <Text weight={activeSection === 'wallets' ? 'extrabold' : 'bold'} style={{ flex: 1 }}>
                E-wallet accounts
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <Pressable onPress={() => setActiveSection('settings')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
              <Text weight={activeSection === 'settings' ? 'extrabold' : 'bold'} style={{ flex: 1 }}>
                Account settings
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <Pressable onPress={() => setActiveSection('help')} style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 10 }}>
              <Text weight={activeSection === 'help' ? 'extrabold' : 'bold'} style={{ flex: 1 }}>
                Help Center
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
          </Card>

          {activeSection === 'profile' ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="h2" weight="extrabold">
                  Business Profile
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={async () => {
                    const path = await pickAndUploadImage('logo');
                    if (!path) return;
                    setLogoUrl(path);
                    await supabase.from('profiles').update({ store_logo_url: path }).eq('user_id', user?.id);
                  }}
                  disabled={profileSaving || walletSavingId !== null}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    opacity: profileSaving || walletSavingId !== null ? 0.6 : 1,
                  }}
                >
                  <Text variant="chip" weight="extrabold" style={{ color: theme.colors.primary }}>
                    Edit logo
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 12, gap: 10 }}>
                <TextField label="Store name" value={storeName} onChangeText={setStoreName} placeholder="Aquabeast WRS" />
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
                <Button title={profileSaving ? 'Saving…' : 'Save profile'} disabled={profileSaving} onPress={saveProfile} />
              </View>
            </Card>
          ) : null}

          {activeSection === 'wallets' ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="h2" weight="extrabold">
                  E-wallet Accounts
                </Text>
                <View style={{ flex: 1 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button variant="ghost" title="+ GCash" disabled={walletSavingId !== null} onPress={() => addWallet('GCash')} />
                  <Button variant="ghost" title="+ Maya" disabled={walletSavingId !== null} onPress={() => addWallet('Maya')} />
                </View>
              </View>

              <View style={{ marginTop: 12, gap: 12 }}>
                {wallets.length === 0 ? (
                  <Text variant="muted">No e-wallet accounts yet.</Text>
                ) : (
                  wallets.map((w) => {
                    const qrUrl = walletQrPublicUrl(w.qr_image_path);
                    const draft = walletDrafts[w.id] ?? { account_name: w.account_name ?? '', account_number: w.account_number ?? '' };
                    const walletBusy = walletSavingId === w.id || walletSavingId?.startsWith('new-');
                    return (
                      <Card key={w.id} style={{ padding: 12, borderRadius: 18, backgroundColor: '#FBFDFF' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text weight="extrabold" style={{ flex: 1 }}>
                            {w.provider}
                          </Text>
                          <Button
                            variant={w.is_active ? 'primary' : 'ghost'}
                            title={w.is_active ? 'Active' : 'Inactive'}
                            disabled={walletBusy}
                            onPress={() => updateWallet(w.id, { is_active: !w.is_active })}
                          />
                        </View>

                        <View style={{ marginTop: 10, gap: 10 }}>
                          <TextField
                            label="Account name"
                            value={draft.account_name}
                            onChangeText={(v) => setWalletDrafts((prev) => ({ ...prev, [w.id]: { ...draft, account_name: v } }))}
                            placeholder="Juan Dela Cruz"
                          />
                          <TextField
                            label="Account number"
                            value={draft.account_number}
                            onChangeText={(v) => setWalletDrafts((prev) => ({ ...prev, [w.id]: { ...draft, account_number: v } }))}
                            placeholder="09xx xxx xxxx"
                            inputMode="numeric"
                          />

                          <Button
                            variant="ghost"
                            title={walletBusy ? 'Saving…' : 'Save details'}
                            disabled={walletBusy}
                            onPress={() => saveWalletDetails(w.id)}
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
                              {qrUrl ? <Image source={{ uri: qrUrl }} style={{ width: 84, height: 84 }} /> : null}
                            </View>
                            <View style={{ flex: 1, gap: 10 }}>
                              <Button
                                variant="ghost"
                                title={w.qr_image_path ? 'Change QR' : 'Upload QR'}
                                disabled={walletBusy}
                                onPress={() => uploadWalletQr(w.id)}
                              />
                              <Button
                                variant="danger"
                                title={w.is_active ? 'Deactivate' : 'Activate'}
                                disabled={walletBusy}
                                onPress={() => updateWallet(w.id, { is_active: !w.is_active })}
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
          ) : null}

          {activeSection === 'settings' ? (
            <Card>
              <Text variant="h2" weight="extrabold">
                Account settings
              </Text>
              <Text variant="muted" style={{ marginTop: 6 }}>
                Update your password to keep your seller account secure.
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                <TextField
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                />
                <TextField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                />
                <TextField
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
                <Button title={passwordSaving ? 'Updating...' : 'Change password'} disabled={passwordSaving} onPress={changePassword} />
                <Button variant="ghost" title="Logout" onPress={signOut} />
              </View>
            </Card>
          ) : null}

          {activeSection === 'help' ? (
            <Card>
              <Text variant="h2" weight="extrabold">
                Help Center
              </Text>
              <Text variant="muted" style={{ marginTop: 6 }}>
                Contact developer support if you need account or app assistance.
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                <TextField label="Developer name" value="Aquabeast WRS Dev Team" editable={false} />
                <TextField label="Email" value="aquabeastwrs.dev@gmail.com" editable={false} />
                <TextField label="Phone" value="+63 912 345 6789" editable={false} />
              </View>
            </Card>
          ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

