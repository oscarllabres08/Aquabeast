import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <div className="bottom-nav-wrap" aria-hidden={false}>
          <nav className="bottom-nav" aria-label="Primary">
            <TabLink
              to="/"
              label="Home"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M10.6 3.7 4.2 9.1A2 2 0 0 0 3.5 10.6V19a2.2 2.2 0 0 0 2.2 2.2h3.2V14a1.8 1.8 0 0 1 1.8-1.8h2.8A1.8 1.8 0 0 1 15.3 14v7.2h3.2A2.2 2.2 0 0 0 20.7 19v-8.4a2 2 0 0 0-.7-1.5l-6.4-5.4a2.1 2.1 0 0 0-3 0Z"
                    fill="currentColor"
                    opacity="0.18"
                  />
                  <path
                    d="M5.2 9.4 10.6 4.9a2.1 2.1 0 0 1 2.8 0l5.4 4.5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.1 10.9v8.3c0 1 .8 1.8 1.8 1.8h6.2c1 0 1.8-.8 1.8-1.8v-8.3"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <TabLink
              to="/order"
              label="Order"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 8h13l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 6.8A2 2 0 0 1 8 4.6h10"
                    fill="currentColor"
                    opacity="0.18"
                  />
                  <path
                    d="M8 8h12l-1 11a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 7"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 8V6.7A2.7 2.7 0 0 1 11.7 4h.6A2.7 2.7 0 0 1 15 6.7V8"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                    d="M12 12.2a4.6 4.6 0 1 0-4.6-4.6 4.6 4.6 0 0 0 4.6 4.6Z"
                    fill="currentColor"
                    opacity="0.18"
                  />
                  <path
                    d="M4.7 21a7.3 7.3 0 0 1 14.6 0"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12.2a4.6 4.6 0 1 0-4.6-4.6 4.6 4.6 0 0 0 4.6 4.6Z"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

