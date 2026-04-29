import { Link, useNavigate } from 'react-router-dom';

export function AboutPage() {
  const nav = useNavigate();
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <div className="spacer" />
      </header>

      <section className="card">
        <div className="h2">About Aquabeast WRS</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Aquabeast Water Refilling Station — purified water delivery for home and office.
        </p>

        <div className="divider" />

        <div className="list">
          <Link className="list-tile" to="/legal/terms">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M7 3h10v18H7V3Z" fill="currentColor" opacity="0.2" />
                <path d="M7 3h10v18H7V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Terms & Conditions</div>
              <div className="muted">Read our terms</div>
            </div>
            <div className="chev">›</div>
          </Link>

          <Link className="list-tile" to="/legal/privacy">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2 4 6v6c0 6 4 9 8 10 4-1 8-4 8-10V6l-8-4Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2 4 6v6c0 6 4 9 8 10 4-1 8-4 8-10V6l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9.2 12.2 11 14l3.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Privacy Policy</div>
              <div className="muted">How we handle data</div>
            </div>
            <div className="chev">›</div>
          </Link>

          <Link className="list-tile" to="/help">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" fill="currentColor" opacity="0.2" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M10.7 9.3a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.6 1.2-1.6 2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 17.2h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Help & Support</div>
              <div className="muted">Get assistance</div>
            </div>
            <div className="chev">›</div>
          </Link>
        </div>
      </section>
    </div>
  );
}

