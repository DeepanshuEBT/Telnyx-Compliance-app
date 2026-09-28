import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, GROUP_STATUS_LABELS } from '../api';
import { SEARCH_BY } from '../constants';
import {
  DEFAULT_CRITERIA,
  NumberSearchForm,
  toQuery,
  type SearchCriteria,
} from './NumberSearchForm';
import {
  availableNumbersQueryKey,
  getAvailableNumbersQueryOptions,
} from '../queries/query-options/phoneNumbers';
import { getRequirementGroupsQueryOptions } from '../queries/query-options/requirementGroups';
import type { AvailableNumber } from '../types';
import { formatCost, formatRateCenter, formatRegion } from '../format';
import { ConfirmPurchase } from './ConfirmPurchase';

interface Props {
  onOrdered: () => void;
}

export function BuyNumber({ onOrdered }: Props) {
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA);
  const countryCode = criteria.country_code;
  const phoneNumberType = criteria.phone_number_type;

  const queryClient = useQueryClient();

  // A search is an action, not a subscription, so each press gets its own key.
  // That makes repeating a search really re-run it, and means a slow response
  // can never land over the results of a later search.
  const [search, setSearch] = useState<{
    nonce: number;
    params: Record<string, unknown>;
    label: string;
  } | null>(null);

  const [chosenGroupId, setChosenGroupId] = useState('');
  const [groupTouched, setGroupTouched] = useState(false);

  const [pending, setPending] = useState<AvailableNumber | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Never claim the customer has no paperwork just because the call failed or
  // has not come back yet -- that is how an approved group goes unattached.
  const groupsQuery = useQuery(getRequirementGroupsQueryOptions());
  const groups = groupsQuery.data ?? [];
  const groupsLoading = groupsQuery.isPending;
  const groupsError = (groupsQuery.error as Error | null)?.message ?? null;

  const searchQuery = useQuery(
    getAvailableNumbersQueryOptions(
      search?.nonce ?? 0,
      search?.params ?? {},
      Boolean(search),
    ),
  );

  // Results are dropped the moment a new search starts, because leaving the old
  // rows up while another runs makes a stale list look like a fresh one.
  const results = search && searchQuery.isSuccess ? searchQuery.data : null;
  const resultsFor = results && search ? search.label : '';
  const searching = Boolean(search) && searchQuery.isPending;

  const createOrder = useMutation({
    mutationFn: (number: AvailableNumber) =>
      api.createNumberOrder({
        phone_number: number.phone_number,
        country_code: countryCode,
        requirement_group_id: chosenGroupId || undefined,
      }),
    onSuccess: (_response, number) => {
      setNotice(
        `${number.phone_number} is yours. Track the order under Orders, and it will show under My numbers once Telnyx completes it.`,
      );
      // Take the bought number off the list that is on screen, as before.
      if (search) {
        queryClient.setQueryData<AvailableNumber[]>(
          availableNumbersQueryKey(search.nonce, search.params),
          (current) =>
            (current ?? []).filter(
              (item) => item.phone_number !== number.phone_number,
            ),
        );
      }
      setPending(null);
      onOrdered();
    },
    onError: (err) => {
      setActionError((err as Error).message);
      setPending(null);
    },
  });

  const ordering = createOrder.isPending
    ? (createOrder.variables?.phone_number ?? null)
    : null;
  const error =
    actionError ?? (searchQuery.error as Error | null)?.message ?? null;

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

  function handleSearch() {
    setActionError(null);
    setNotice(null);
    const label = describeSearch();
    setSearch((current) => ({
      nonce: (current?.nonce ?? 0) + 1,
      params: toQuery(criteria),
      label,
    }));
  }

  function handleConfirmedOrder() {
    if (!pending) return;
    setActionError(null);
    setNotice(null);
    createOrder.mutate(pending);
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
