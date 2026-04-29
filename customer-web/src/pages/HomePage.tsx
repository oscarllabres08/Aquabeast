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
          <div className="hero-title">Pure Water, Delivered to You</div>
          <div className="hero-sub">Safe. Clean. Refreshing.</div>
          <div className="hero-cta-row">
            <Link to="/order" className="btn btn-primary hero-cta">
              Order now
            </Link>
            <div className="hero-label">Doorstep water refilling</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Why choose Aquabeast?</div>
        <div className="icon-row-3" style={{ marginTop: 10 }}>
          <div className="mini-feature">
            <div className="mini-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M12 3c3.5 5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6 6-11Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M12 3c3.5 5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6 6-11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="kpi">Purified Water</div>
            <div className="muted" style={{ fontSize: 12 }}>
              High-quality refilling station.
            </div>
          </div>
          <div className="mini-feature">
            <div className="mini-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M7 17h10l1-9H6l1 9Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M9 8V6.7A2.7 2.7 0 0 1 11.7 4h.6A2.7 2.7 0 0 1 15 6.7V8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="kpi">Fast Delivery</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Quick and reliable service.
            </div>
          </div>
          <div className="mini-feature">
            <div className="mini-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 7v10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="kpi">Affordable</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Great quality at fair prices.
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">How it works</div>
        <div className="grid" style={{ marginTop: 10 }}>
          <div className="row">
            <div className="tag">1</div>
            <div>
              <div className="item-title">Choose a product</div>
              <div className="muted">Select the water you need.</div>
            </div>
          </div>
          <div className="row">
            <div className="tag">2</div>
            <div>
              <div className="item-title">Add quantity & details</div>
              <div className="muted">Enter delivery address and contact.</div>
            </div>
          </div>
          <div className="row">
            <div className="tag">3</div>
            <div>
              <div className="item-title">Checkout</div>
              <div className="muted">Review and confirm your order.</div>
            </div>
          </div>
          <div className="row">
            <div className="tag">4</div>
            <div>
              <div className="item-title">Track your order</div>
              <div className="muted">We’ll keep you updated.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link to="/order" className="btn btn-primary btn-wide">
            Start your order
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Our services</div>
        <div className="list" style={{ marginTop: 10 }}>
          <div className="list-tile">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M12 3c3.5 5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6 6-11Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M12 3c3.5 5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6 6-11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Water Refilling</div>
              <div className="muted">Purified drinking water for your needs.</div>
            </div>
            <div className="chev" aria-hidden="true">
              ›
            </div>
          </div>
          <div className="list-tile">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M5 12h14l-2 7H7l-2-7Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M7 10 12 5l5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 12h14l-2 7H7l-2-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Home & Office Delivery</div>
              <div className="muted">Delivered safely to your doorstep.</div>
            </div>
            <div className="chev" aria-hidden="true">
              ›
            </div>
          </div>
          <div className="list-tile">
            <div className="list-tile-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 12l2.6 2.6L16.8 8.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-title">Clean & Safe</div>
              <div className="muted">Strict quality control for your safety.</div>
            </div>
            <div className="chev" aria-hidden="true">
              ›
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

