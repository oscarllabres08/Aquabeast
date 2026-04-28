import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export function AuthPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === 'sign_in' ? 'Login' : 'Create account'), [mode]);

  if (user) {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn btn-ghost" onClick={() => nav(-1)}>
            Back
          </button>
          <div className="spacer" />
        </header>
        <section className="card">
          <h2 className="h2">You’re logged in</h2>
          <div className="muted">{user.email}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => nav('/order')}>
              Order
            </button>
          </div>
        </section>
      </div>
    );
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'sign_in') {
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          return;
        }
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        nav('/order');
      } else {
        if (!displayName.trim() || !contactNumber.trim() || !address.trim()) {
          setError('Please fill Name, Contact number, and Complete address.');
          return;
        }
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email,
            },
          },
        });
        if (err) throw err;

        if (data.user?.id) {
          const { error: profErr } = await supabase
            .from('profiles')
            .update({
              display_name: displayName.trim() || email.trim(),
              phone: contactNumber.trim(),
              address: address.trim(),
            })
            .eq('user_id', data.user.id);
          if (profErr) throw profErr;
        }

        nav('/order');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Auth failed';
      setError(msg);
    } finally {
      setLoading(false);
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
        <h2 className="h2">{title}</h2>
        <p className="muted">You must log in to place an order.</p>

        <div className="segmented" role="tablist" aria-label="Auth mode">
          <button
            className={`seg ${mode === 'sign_in' ? 'seg-active' : ''}`}
            onClick={() => setMode('sign_in')}
            type="button"
          >
            Login
          </button>
          <button
            className={`seg ${mode === 'sign_up' ? 'seg-active' : ''}`}
            onClick={() => setMode('sign_up')}
            type="button"
          >
            Register
          </button>
        </div>

        {mode === 'sign_up' && (
          <>
            <label className="field">
              <div className="field-label">Name</div>
              <input
                className="input"
                placeholder="Juan Dela Cruz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </label>

            <label className="field">
              <div className="field-label">Contact number</div>
              <input
                className="input"
                placeholder="09xx xxx xxxx"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>

            <label className="field">
              <div className="field-label">Complete address</div>
              <input
                className="input"
                placeholder="House no., street, barangay, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </label>
          </>
        )}

        <label className="field">
          <div className="field-label">Email</div>
          <input
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="field">
          <div className="field-label">Password</div>
          <input
            className="input"
            type="password"
            placeholder={mode === 'sign_in' ? 'Enter your password' : 'Create a password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
          />
        </label>

        {mode === 'sign_up' && (
          <label className="field">
            <div className="field-label">Confirm password</div>
            <input
              className="input"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'sign_in' ? 'Login' : 'Create account'}
          </button>
        </div>
      </section>
    </div>
  );
}

