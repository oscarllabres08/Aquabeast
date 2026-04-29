import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { FormPageSkeleton } from '../ui/Skeleton';

export function EditProfilePage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setInitialLoading(false);
      nav('/auth');
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name,phone,address')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!alive) return;
      setDisplayName((data?.display_name ?? '').toString());
      setPhone((data?.phone ?? '').toString());
      setAddress((data?.address ?? '').toString());
      setInitialLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user, loading, nav]);

  async function save() {
    setError(null);
    setOk(null);
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq('user_id', user.id);
      if (error) throw error;
      setOk('Saved!');
      setTimeout(() => nav('/profile'), 450);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <div className="spacer" />
      </header>

      <section className="card">
        {initialLoading ? <FormPageSkeleton /> : null}
        {!initialLoading ? (
          <>
        <div className="h2">Edit profile</div>
        <div className="muted">Update name, phone, and address.</div>

        <div className="grid" style={{ marginTop: 12 }}>
          <label className="field">
            <div className="field-label">Name</div>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
            />
          </label>
          <label className="field">
            <div className="field-label">Phone</div>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xx xxx xxxx"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="field">
            <div className="field-label">Default address</div>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., street, barangay, city"
              autoComplete="street-address"
            />
          </label>
        </div>

        {error ? <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
        {ok ? <div className="alert alert-ok" style={{ marginTop: 12 }}>{ok}</div> : null}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

