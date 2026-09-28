import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ACTIONS, COMMON_COUNTRIES, PHONE_NUMBER_TYPES } from '../constants';
import type { RequirementGroup } from '../types';
import { GroupDetail } from './GroupDetail';
import { StatusBadge } from './StatusBadge';

export function RequirementGroupsTab() {
  const [groups, setGroups] = useState<RequirementGroup[]>([]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState('GB');
  const [phoneNumberType, setPhoneNumberType] = useState('local');
  const [action, setAction] = useState('ordering');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listGroups();
      setGroups(response.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!openGroupId) load();
  }, [openGroupId, load]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const response = await api.createGroup({
        country_code: countryCode,
        phone_number_type: phoneNumberType,
        action,
      });
      if (response.reused) {
        setNotice(
          `You already have a ${countryCode} ${phoneNumberType} group, so we have opened that one rather than starting a second.`,
        );
      }
      setOpenGroupId(response.data.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  if (openGroupId) {
    return (
      <div className="stack">
        {notice && <div className="banner banner--info">{notice}</div>}
        <GroupDetail
          groupId={openGroupId}
          onBack={() => {
            setOpenGroupId(null);
            setNotice(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card__header">
          <div className="card__title">Start a new requirement group</div>
        </div>
        <div className="card__body">
          <p className="hint" style={{ marginBottom: 14 }}>
            A group collects everything Telnyx needs for one country and number
            type. Fill it in once, get it approved, and it can be reused for any
            number we order against it.
          </p>
          <div className="filters">
            <div className="field">
              <label className="label" htmlFor="new-country">Country</label>
              <select
                id="new-country"
                className="select"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
              >
                {COMMON_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="new-type">Number type</label>
              <select
                id="new-type"
                className="select"
                value={phoneNumberType}
                onChange={(event) => setPhoneNumberType(event.target.value)}
              >
                {PHONE_NUMBER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="new-action">Action</label>
              <select
                id="new-action"
                className="select"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {ACTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn--primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="banner banner--danger">{error}</div>}
      {notice && <div className="banner banner--info">{notice}</div>}

      <div className="card">
        <div className="card__header">
          <div className="card__title">Your requirement groups</div>
          <div className="spacer" />
          <button className="btn btn--ghost btn--sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="state">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="state">
            <div className="state__title">Nothing here yet</div>
            <div>Create a group above to get started.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Number type</th>
                <th>Action</th>
                <th>Status</th>
                <th>Group ID</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="is-clickable"
                  onClick={() => setOpenGroupId(group.id)}
                >
                  <td><strong>{group.country_code}</strong></td>
                  <td>{group.phone_number_type}</td>
                  <td>{group.action}</td>
                  <td><StatusBadge status={group.status} /></td>
                  <td className="mono">{group.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
