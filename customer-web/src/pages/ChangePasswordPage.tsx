import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';

export function ChangePasswordPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) nav('/auth');
  }, [user, loading, nav]);

  async function save() {
    setError(null);
    setOk(null);
    if (!password.trim()) {
      setError('Please enter a new password.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk('Password updated!');
      setPassword('');
      setConfirm('');
      setTimeout(() => nav('/profile'), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update password');
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
        <div className="h2">Change password</div>
        <div className="muted">Choose a strong password.</div>

        <div className="grid" style={{ marginTop: 12 }}>
          <label className="field">
            <div className="field-label">New password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <div className="field-label">Confirm password</div>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </label>
        </div>

        {error ? <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
        {ok ? <div className="alert alert-ok" style={{ marginTop: 12 }}>{ok}</div> : null}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </section>
    </div>
  );
}

