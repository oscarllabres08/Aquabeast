import { Link } from 'react-router-dom';

import heroImg from '../assets/store.jpeg';
import logoImg from '../assets/icon.jpeg';

export function HomePage() {
  return (
    <div className="page">
      <header className="topbar">
        <img className="brand-logo" src={logoImg} alt="Aquabeast logo" />
        <div className="brand-title brand-title-center">Aquabeast WRS</div>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"
              fill="currentColor"
            />
            <path
              d="M19 17H5a2 2 0 0 1 2-2V10a5 5 0 0 1 10 0v5a2 2 0 0 1 2 2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <span className="notif-dot" aria-hidden="true" />
        </button>
      </header>

      <section className="hero-card">
        <img className="hero-img" src={heroImg} alt="Aquabeast store" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-actions">
          <Link to="/order" className="btn btn-primary hero-cta">
            Order now
          </Link>
          <div className="hero-label">Order for delivery</div>
        </div>
      </section>

      <section className="card">
        <div className="h2">Order for delivery</div>
        <div className="muted">Tap products, add quantity, then checkout.</div>
      </section>

      <section className="card">
        <h2 className="h2">How it works</h2>
        <p className="muted">Choose a product, add quantity, fill delivery details, then track status.</p>
      </section>

      <section className="card">
        <div className="grid-2">
          <div>
            <div className="kpi">Restaurant‑style menu</div>
            <div className="muted">Tap products, add quantity.</div>
          </div>
          <div>
            <div className="kpi">Live order status</div>
            <div className="muted">Confirmed → Preparing → On the way → Delivered</div>
          </div>
        </div>
      </section>
    </div>
  );
}

