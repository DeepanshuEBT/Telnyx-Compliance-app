import { useEffect, useRef, useState } from 'react';
import { api, GROUP_STATUS_LABELS } from '../api';
import { SEARCH_BY } from '../constants';
import {
  DEFAULT_CRITERIA,
  NumberSearchForm,
  toQuery,
  type SearchCriteria,
} from './NumberSearchForm';
import type { AvailableNumber, RequirementGroup } from '../types';
import { formatCost, formatRateCenter, formatRegion } from '../format';
import { ConfirmPurchase } from './ConfirmPurchase';

interface Props {
  onOrdered: () => void;
}

export function BuyNumber({ onOrdered }: Props) {
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA);
  const countryCode = criteria.country_code;
  const phoneNumberType = criteria.phone_number_type;

  const [results, setResults] = useState<AvailableNumber[] | null>(null);
  const [resultsFor, setResultsFor] = useState<string>('');
  const searchSeq = useRef(0);
  const [groups, setGroups] = useState<RequirementGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [chosenGroupId, setChosenGroupId] = useState('');
  const [groupTouched, setGroupTouched] = useState(false);

  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<AvailableNumber | null>(null);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // Never claim the customer has no paperwork just because the call failed or
    // has not come back yet -- that is how an approved group goes unattached.
    api
      .listGroups()
      .then((response) => setGroups(response.data))
      .catch((err) => setGroupsError((err as Error).message))
      .finally(() => setGroupsLoading(false));
  }, []);

  // Only an approved group for this exact country and number type can be
  // attached to an order, so offering anything else would just fail at Telnyx.
  const matchingGroups = groups.filter(
    (group) =>
      group.country_code === countryCode &&
      group.phone_number_type === phoneNumberType,
  );
  const usableGroups = matchingGroups.filter((group) => group.status === 'approved');
  // Not attachable, but worth telling the customer about: buying now means the
  // order sits waiting on paperwork they have already started.
  const pendingGroup = matchingGroups.find(
    (group) => group.status === 'pending-approval',
  );
  const declinedGroup = matchingGroups.find((group) => group.status === 'declined');

  // Attach approved paperwork by default. Leaving this to the customer means a
  // group they got approved quietly goes unused and the order is held anyway.
  useEffect(() => {
    const stillValid = usableGroups.some((group) => group.id === chosenGroupId);
    if (!stillValid) {
      setChosenGroupId(usableGroups[0]?.id ?? '');
      setGroupTouched(false);
    } else if (!groupTouched && !chosenGroupId && usableGroups.length) {
      setChosenGroupId(usableGroups[0].id);
    }
  }, [usableGroups, chosenGroupId, groupTouched]);

  function describeSearch(): string {
    const where = criteria.searchValue
      ? ` · ${SEARCH_BY.find((item) => item.value === criteria.searchBy)?.label} ${criteria.searchValue}`
      : '';
    const type = criteria.phone_number_type || 'all types';
    const features = criteria.features.length
      ? ` · ${criteria.features.join(', ')}`
      : '';
    return `${criteria.country_code} ${type}${where}${features}`;
  }

  async function handleSearch() {
    const seq = ++searchSeq.current;
    const label = describeSearch();

    // Drop the previous results immediately. Leaving them on screen while a new
    // search runs makes a stale list look like a fresh one, especially when the
    // rows look alike.
    setResults(null);
    setResultsFor('');
    setSearching(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.searchAvailableNumbers(toQuery(criteria));
      if (seq !== searchSeq.current) return; // a newer search has overtaken this one
      setResults(response.data);
      setResultsFor(label);
    } catch (err) {
      if (seq !== searchSeq.current) return;
      setError((err as Error).message);
      setResults(null);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  }

  async function handleConfirmedOrder() {
    if (!pending) return;
    const number = pending;

    setOrdering(number.phone_number);
    setError(null);
    setNotice(null);
    try {
      await api.createNumberOrder({
        phone_number: number.phone_number,
        country_code: countryCode,
        requirement_group_id: chosenGroupId || undefined,
      });
      setNotice(
        `${number.phone_number} is yours. Track the order under Orders, and it will show under My numbers once Telnyx completes it.`,
      );
      setResults((current) =>
        (current ?? []).filter((item) => item.phone_number !== number.phone_number),
      );
      setPending(null);
      onOrdered();
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    } finally {
      setOrdering(null);
    }
  }

  return (
    <div className="stack">
      <NumberSearchForm
        criteria={criteria}
        searching={searching}
        onChange={setCriteria}
        onSearch={handleSearch}
      />

      {results !== null && results.length > 0 && (
        <div className="card">
          <div className="card__body">
            <div className="field field--grow">
              <label className="label" htmlFor="buy-group">Requirement group</label>
              <select
                id="buy-group"
                className="select"
                value={chosenGroupId}
                onChange={(event) => {
                  setGroupTouched(true);
                  setChosenGroupId(event.target.value);
                }}
              >
                <option value="">Do not attach any</option>
                {matchingGroups.map((group) => {
                  const approved = group.status === 'approved';
                  return (
                    <option
                      key={group.id}
                      value={group.id}
                      disabled={!approved}
                      title={
                        approved
                          ? 'Approved, so it can be attached to this order'
                          : 'Only approved requirement groups can be selected'
                      }
                    >
                      {group.id.slice(0, 8)} ·{' '}
                      {approved
                        ? 'approved'
                        : `${GROUP_STATUS_LABELS[group.status] ?? group.status} — cannot be selected`}
                    </option>
                  );
                })}
              </select>
              <span className="hint">
                {groupsLoading
                  ? 'Checking your requirement groups…'
                  : groupsError
                    ? `Could not load your requirement groups: ${groupsError}`
                    : chosenGroupId
                      ? 'Your approved paperwork is attached, so this order will not be held for review.'
                      : pendingGroup
                        ? `Your ${countryCode} ${phoneNumberType} paperwork is still being reviewed by Telnyx. Buying now means the order waits until it is approved.`
                        : declinedGroup
                          ? `Your ${countryCode} ${phoneNumberType} paperwork was not accepted. Fix it under Requirement groups before buying.`
                        : `No requirement group for ${countryCode} ${phoneNumberType} yet. Countries with regulatory requirements will hold the order until the paperwork is done.`}
              </span>
              {matchingGroups.length > usableGroups.length && (
                <span className="hint">
                  Groups that are not approved yet are listed but cannot be picked.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div className="banner banner--danger">{error}</div>}
      {notice && <div className="banner banner--success">{notice}</div>}

      {searching && (
        <div className="card"><div className="state">Searching Telnyx…</div></div>
      )}

      {!searching && results !== null && (
        <div className="card">
          <div className="card__header">
            <div>
              <div className="card__title">Available numbers</div>
              <div className="hint">{resultsFor}</div>
            </div>
            <div className="spacer" />
            <span className="badge badge--info">{results.length} found</span>
          </div>
          {results.length === 0 ? (
            <div className="state">
              <div className="state__title">Nothing available</div>
              <div>
                Try a different number type or drop a feature. SMS in particular
                is only offered on certain number types, and which ones varies by
                country.
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Location/Rate center</th>
                  <th>Features</th>
                  <th>Upfront</th>
                  <th>Monthly</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((number) => (
                  <tr key={number.phone_number}>
                    <td className="mono"><strong>{number.phone_number}</strong></td>
                    <td>
                      <span className="type-pill">
                        {(number.phone_number_type ?? '').replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td>
                      {formatRegion(number.region_information)}
                      {formatRateCenter(number.region_information) !== '—' && (
                        <div className="hint">
                          {formatRateCenter(number.region_information)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {(number.features ?? []).map((feature) => (
                          <span className="criterion" key={feature.name}>
                            {feature.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {formatCost(
                        number.cost_information?.upfront_cost,
                        number.cost_information?.currency,
                      )}
                    </td>
                    <td>
                      {formatCost(
                        number.cost_information?.monthly_cost,
                        number.cost_information?.currency,
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn--primary btn--sm"
                        disabled={ordering !== null}
                        onClick={() => setPending(number)}
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pending && (
        <ConfirmPurchase
          number={pending}
          countryCode={countryCode}
          requirementGroup={
            usableGroups.find((group) => group.id === chosenGroupId) ?? null
          }
          paperworkState={
            chosenGroupId
              ? 'attached'
              : pendingGroup
                ? 'in-review'
                : declinedGroup
                  ? 'declined'
                  : 'none'
          }
          busy={ordering !== null}
          onCancel={() => setPending(null)}
          onConfirm={handleConfirmedOrder}
        />
      )}
    </div>
  );
}
