import { useEffect, useState } from 'react';
import { api, resolveToken } from './api';
import { RequirementGroupsTab } from './components/RequirementGroupsTab';
import { PhoneNumbersTab } from './components/PhoneNumbersTab';
import { RequirementsTab } from './components/RequirementsTab';

type Tab = 'requirements' | 'groups' | 'numbers';

export function App() {
  const [tab, setTab] = useState<Tab>('groups');
  const [subOrganizationId, setSubOrganizationId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = resolveToken();
    if (!token) {
      setAuthError('This page needs the link we sent you.');
      setChecking(false);
      return;
    }
    api
      .session()
      .then((response) => setSubOrganizationId(response.data.sub_organization_id))
      .catch((err) => setAuthError(err.message))
      .finally(() => setChecking(false));
  }, []);

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
            <button
              className={`tab ${tab === 'requirements' ? 'tab--active' : ''}`}
              onClick={() => setTab('requirements')}
            >
              Requirements
            </button>
            <button
              className={`tab ${tab === 'groups' ? 'tab--active' : ''}`}
              onClick={() => setTab('groups')}
            >
              Requirement groups
            </button>
            <button
              className={`tab ${tab === 'numbers' ? 'tab--active' : ''}`}
              onClick={() => setTab('numbers')}
            >
              Phone numbers
            </button>
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
        ) : tab === 'requirements' ? (
          <RequirementsTab />
        ) : tab === 'numbers' ? (
          <PhoneNumbersTab />
        ) : (
          <RequirementGroupsTab />
        )}
      </main>
    </div>
  );
}
