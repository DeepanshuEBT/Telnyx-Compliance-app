import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ACTIONS, COMMON_COUNTRIES, PHONE_NUMBER_TYPES } from '../constants';
import { getRequirementGroupsQueryOptions } from '../queries/query-options/requirementGroups';
import { StatusBadge } from './StatusBadge';

export function RequirementGroupsTab() {
  const navigate = useNavigate();
  const [createError, setCreateError] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState('GB');
  const [phoneNumberType, setPhoneNumberType] = useState('local');
  const [action, setAction] = useState('ordering');

  // This component only renders on /groups, so opening a group unmounts it and
  // coming back remounts it, which re-runs the list and picks up any edits.
  const groupsQuery = useQuery(getRequirementGroupsQueryOptions());

  const createGroup = useMutation({
    mutationFn: () =>
      api.createGroup({
        country_code: countryCode,
        phone_number_type: phoneNumberType,
        action,
      }),
    onSuccess: (response) => {
      const notice = response.reused
        ? `You already have a ${countryCode} ${phoneNumberType} group, so we have opened that one rather than starting a second.`
        : undefined;
      navigate(`/groups/${response.data.id}`, { state: { notice } });
    },
    onError: (err) => setCreateError((err as Error).message),
  });

  const groups = groupsQuery.data ?? [];
  const creating = createGroup.isPending;
  const loading = groupsQuery.isPending;
  const error =
    createError ?? (groupsQuery.error as Error | null)?.message ?? null;

  function handleCreate() {
    setCreateError(null);
    createGroup.mutate();
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

      <div className="card">
        <div className="card__header">
          <div className="card__title">Your requirement groups</div>
          <div className="spacer" />
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setCreateError(null);
              groupsQuery.refetch();
            }}
            disabled={groupsQuery.isFetching}
          >
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
                  onClick={() => navigate(`/groups/${group.id}`)}
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
