import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { hasStoredToken } from './api';
import { getSessionQueryOptions } from './queries/query-options/session';

const MISSING_LINK_MESSAGE = 'This page needs the link we sent you.';

const TABS = [
  { to: '/requirements', label: 'Requirements' },
  { to: '/groups', label: 'Requirement groups' },
  { to: '/numbers', label: 'Phone numbers' },
];

export function AppLayout() {
  // The token is lifted out of the URL in main.tsx, before the router reads the
  // location, so by here it is only ever a question of whether one was stored.
  const tokenPresent = hasStoredToken();

  const sessionQuery = useQuery({
    ...getSessionQueryOptions(),
    enabled: tokenPresent,
  });

  const subOrganizationId = sessionQuery.data?.sub_organization_id ?? null;
  const checking = tokenPresent && sessionQuery.isPending;
  const authError = tokenPresent
    ? ((sessionQuery.error as Error | null)?.message ?? null)
    : MISSING_LINK_MESSAGE;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="wordmark">B</span>
          <span className="topbar__title">Compliance</span>
          {subOrganizationId && (
            <span className="topbar__meta mono">{subOrganizationId}</span>
          )}
        </div>
      </header>

      {subOrganizationId && (
        <div className="tabstrip">
          <nav className="tabs">
            {TABS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <main className="main">
        {checking ? (
          <div className="card"><div className="state">Checking your link…</div></div>
        ) : authError ? (
          <div className="card">
            <div className="state">
              <div className="state__title">We could not open this page</div>
              <div>{authError}</div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
