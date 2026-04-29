import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { FormPageSkeleton } from '../ui/Skeleton';

export function NotificationsPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) nav('/auth');
  }, [user, loading, nav]);

  if (loading) {
    return (
      <div className="page">
        <FormPageSkeleton />
      </div>
    );
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
        <div className="h2">Notifications</div>
        <div className="muted">Control order update notifications.</div>

        <div className="divider" />

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="item-title">Order updates</div>
            <div className="muted">Confirmed → On the way → Delivered</div>
          </div>
          <button
            className={`btn ${enabled ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setEnabled((v) => !v)}
            type="button"
          >
            {enabled ? 'On' : 'Off'}
          </button>
        </div>

        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Note: This is a UI toggle for now. Push notifications require mobile app permissions.
        </div>
      </section>
    </div>
  );
}

