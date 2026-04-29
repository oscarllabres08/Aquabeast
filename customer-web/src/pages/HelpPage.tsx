import { useNavigate } from 'react-router-dom';

export function HelpPage() {
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
        <div className="h2">Help & Support</div>
        <p className="muted" style={{ marginTop: 8 }}>
          Need help with your order? Contact your water station or check your order status in Profile → My orders.
        </p>

        <div className="divider" />

        <div className="grid">
          <div>
            <div className="item-title">Common issues</div>
            <div className="muted" style={{ marginTop: 6 }}>
              - Can’t login: use the same email you registered with.
              <br />- No products: ensure a seller is configured and products are available.
              <br />- Order not updating: make sure Realtime is enabled on orders tables in Supabase.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

