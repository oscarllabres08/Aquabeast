import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function LegalPage() {
  const nav = useNavigate();
  const { type } = useParams<{ type: string }>();

  const title = useMemo(() => {
    if (type === 'terms') return 'Terms & Conditions';
    if (type === 'privacy') return 'Privacy Policy';
    return 'Legal';
  }, [type]);

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          Back
        </button>
        <div className="spacer" />
      </header>

      <section className="card">
        <div className="h2">{title}</div>
        <p className="muted" style={{ marginTop: 8 }}>
          This is a placeholder page. Add your official {title.toLowerCase()} content here.
        </p>
      </section>
    </div>
  );
}

