import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

function TabLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `bn-item ${isActive ? 'bn-active' : ''}`.trim()
      }
      end
    >
      <div className="bn-icon">{icon}</div>
      <div className="bn-label">{label}</div>
    </NavLink>
  );
}

export function BottomNavLayout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/auth');

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>

      {!hideNav && (
        <div className="bottom-nav-wrap" aria-hidden={false}>
          <nav className="bottom-nav" aria-label="Primary">
            <TabLink
              to="/"
              label="Home"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 3 10v11h6v-7h6v7h6V10l-9-7z" fill="currentColor" />
                </svg>
              }
            />
            <TabLink
              to="/order"
              label="Order"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 4h10l1 4H6l1-4zm-1 6h12l-1 10H7L6 10zm4 2v6h2v-6h-2z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
            <TabLink
              to="/profile"
              label="Profile"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z"
                    fill="currentColor"
                  />
                </svg>
              }
            />
          </nav>
        </div>
      )}
    </div>
  );
}

