import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  getNumberOrdersQueryOptions,
  getPhoneNumbersQueryOptions,
  numberOrdersQueryKey,
  phoneNumbersQueryKey,
} from '../queries/query-options/phoneNumbers';
import type { PhoneNumber } from '../types';
import { BuyNumber } from './BuyNumber';
import { ChoosePlan } from './ChoosePlan';

type Section = 'mine' | 'orders' | 'buy';

const SECTION_PATHS: Record<Section, string> = {
  mine: '/numbers',
  orders: '/numbers/orders',
  buy: '/numbers/buy',
};

function sectionFromPath(pathname: string): Section {
  if (pathname.endsWith('/orders')) return 'orders';
  if (pathname.endsWith('/buy')) return 'buy';
  return 'mine';
}

const ALREADY_CONNECTED_HINT =
  'Your SMS channel is already connected to another number.';
const CONNECTED_NUMBER_HINT =
  'This number is connected to your SMS channel. ' +
  'Get in touch with us to change it.';

const ORDER_TONE: Record<string, string> = {
  success: 'success',
  pending: 'warning',
  failure: 'danger',
};

export function PhoneNumbersTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const section = sectionFromPath(location.pathname);
  const setSection = (next: Section) => navigate(SECTION_PATHS[next]);

  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [choosingPlanFor, setChoosingPlanFor] = useState<PhoneNumber | null>(null);
  const [justConnected, setJustConnected] = useState<string | null>(null);

  const numbersQuery = useQuery(getPhoneNumbersQueryOptions());
  const ordersQuery = useQuery(getNumberOrdersQueryOptions());

  const releaseNumber = useMutation({
    mutationFn: (numberId: string) => api.releasePhoneNumber(numberId),
    onSuccess: (_response, numberId) => {
      setReleaseError(null);
      // Drop the row from the cache rather than refetching, which is what the
      // component did before and keeps the table from flashing.
      queryClient.setQueryData<PhoneNumber[]>(phoneNumbersQueryKey(), (current) =>
        (current ?? []).filter((item) => item.id !== numberId),
      );
    },
    onError: (err) => setReleaseError((err as Error).message),
  });

  const numbers = numbersQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const loading = numbersQuery.isPending || ordersQuery.isPending;
  const releasing = releaseNumber.isPending ? releaseNumber.variables : null;
  const error =
    releaseError ??
    (numbersQuery.error as Error | null)?.message ??
    (ordersQuery.error as Error | null)?.message ??
    null;

  function reload() {
    setReleaseError(null);
    queryClient.invalidateQueries({ queryKey: phoneNumbersQueryKey() });
    queryClient.invalidateQueries({ queryKey: numberOrdersQueryKey() });
  }

  // Replace rather than push: the buy screen they are being moved off is not
  // somewhere the back button should return them to.
  const numberCount = numbers.length;
  useEffect(() => {
    if (numberCount > 0 && section === 'buy') {
      navigate(SECTION_PATHS.mine, { replace: true });
    }
  }, [numberCount, section, navigate]);

  const readyForPlan = numbers.filter(
    (number) => number.boxly?.verified && !number.boxly?.connected,
  );
  const alreadyConnected = numbers.some((number) => number.boxly?.connected);
  // One SMS channel per account means one number, so buying is offered only
  // while they have none. Hidden until the list has loaded, otherwise the tab
  // appears and then vanishes. The backend refuses a second one either way.
  const canBuy = !loading && numbers.length === 0;

  function handleRelease(number: PhoneNumber) {
    const confirmed = window.confirm(
      `Release ${number.phone_number}? This gives the number up permanently and it cannot be recovered.`,
    );
    if (!confirmed) return;

    setReleaseError(null);
    releaseNumber.mutate(number.id);
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card__body" style={{ paddingBottom: 0, paddingTop: 4 }}>
          <nav className="subtabs">
            <button
              className={`subtab ${section === 'mine' ? 'subtab--active' : ''}`}
              onClick={() => setSection('mine')}
            >
              My numbers {numbers.length > 0 && `(${numbers.length})`}
            </button>
            <button
              className={`subtab ${section === 'orders' ? 'subtab--active' : ''}`}
              onClick={() => setSection('orders')}
            >
              Orders {orders.length > 0 && `(${orders.length})`}
            </button>
            {canBuy && (
              <button
                className={`subtab ${section === 'buy' ? 'subtab--active' : ''}`}
                onClick={() => setSection('buy')}
              >
                Buy a number
              </button>
            )}
          </nav>
        </div>
      </div>

      {error && <div className="banner banner--danger">{error}</div>}

      {justConnected && (
        <div className="banner banner--success">
          {justConnected} is connected. You can start texting from Boxly now.
        </div>
      )}

      {!choosingPlanFor &&
        !alreadyConnected &&
        readyForPlan.length > 0 &&
        section !== 'buy' && (
        <div className="banner banner--info">
          {readyForPlan.length === 1
            ? `${readyForPlan[0].phone_number} is ready. Choose a plan to start using it.`
            : `${readyForPlan.length} numbers are ready and need a plan.`}
        </div>
      )}

      {choosingPlanFor ? (
        <ChoosePlan
          number={choosingPlanFor}
          onCancel={() => setChoosingPlanFor(null)}
          onConnected={() => {
            setJustConnected(choosingPlanFor.phone_number);
            setChoosingPlanFor(null);
            reload();
          }}
        />
      ) : section === 'buy' ? (
        <BuyNumber onOrdered={reload} />
      ) : loading ? (
        <div className="card"><div className="state">Loading…</div></div>
      ) : section === 'mine' ? (
        <div className="card">
          <div className="card__header">
            <div className="card__title">My numbers</div>
            <div className="spacer" />
            <button
              className="btn btn--ghost btn--sm"
              onClick={reload}
              disabled={numbersQuery.isFetching || ordersQuery.isFetching}
            >
              Refresh
            </button>
          </div>
          {numbers.length === 0 ? (
            <div className="state">
              <div className="state__title">No numbers yet</div>
              <div>Buy one under "Buy a number" and it will appear here.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {numbers.map((number) => (
                  <tr key={number.id}>
                    <td className="mono"><strong>{number.phone_number}</strong></td>
                    <td>
                      <span className={`badge badge--${number.status === 'active' ? 'success' : 'neutral'}`}>
                        {number.status ?? 'unknown'}
                      </span>
                    </td>
                    <td>{number.phone_number_type ?? '—'}</td>
                    <td>
                      {number.boxly?.connected ? (
                        <span>
                          {(number.boxly.sms_count ?? 0).toLocaleString()} texts
                          <div className="hint">connected</div>
                        </span>
                      ) : number.boxly?.verified ? (
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={alreadyConnected}
                          title={
                            alreadyConnected ? ALREADY_CONNECTED_HINT : undefined
                          }
                          onClick={() => setChoosingPlanFor(number)}
                        >
                          Choose a plan
                        </button>
                      ) : number.boxly?.known ? (
                        <span className="badge badge--warning">
                          {number.boxly.verification_status ?? 'Verifying'}
                        </span>
                      ) : (
                        <span className="hint">Not set up</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn--danger btn--sm"
                        disabled={
                          releasing === number.id || number.boxly?.connected
                        }
                        title={
                          number.boxly?.connected
                            ? CONNECTED_NUMBER_HINT
                            : undefined
                        }
                        onClick={() => handleRelease(number)}
                      >
                        {releasing === number.id ? 'Releasing…' : 'Release'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card__header">
            <div className="card__title">Orders</div>
            <div className="spacer" />
            <button
              className="btn btn--ghost btn--sm"
              onClick={reload}
              disabled={numbersQuery.isFetching || ordersQuery.isFetching}
            >
              Refresh
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="state">
              <div className="state__title">No orders yet</div>
              <div>Orders you place show up here with their regulatory status.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Numbers</th>
                  <th>Requirements</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="mono">{order.id.slice(0, 8)}</td>
                    <td>
                      <span className={`badge badge--${ORDER_TONE[order.status ?? ''] ?? 'neutral'}`}>
                        {order.status ?? 'unknown'}
                      </span>
                    </td>
                    <td>
                      {(order.phone_numbers ?? []).map((item) => (
                        <div className="mono" key={item.phone_number}>
                          {item.phone_number}
                        </div>
                      )) || order.phone_numbers_count}
                    </td>
                    <td>
                      {order.requirements_met === true ? (
                        <span className="badge badge--success">Met</span>
                      ) : order.requirements_met === false ? (
                        <span className="badge badge--warning">Outstanding</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hint">
                      {order.created_at ? order.created_at.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
