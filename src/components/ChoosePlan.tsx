import { useEffect, useState } from 'react';
import { api } from '../api';
import type { PhoneNumber, SmsPlanCatalogue } from '../types';

interface Props {
  number: PhoneNumber;
  onCancel: () => void;
  onConnected: () => void;
}

export function ChoosePlan({ number, onCancel, onConnected }: Props) {
  const [catalogue, setCatalogue] = useState<SmsPlanCatalogue | null>(null);
  const [chosenPlanName, setChosenPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryCode = number.boxly?.cca_code ?? number.country_iso_alpha2 ?? '';

  useEffect(() => {
    let cancelled = false;
    api
      .smsPlans(countryCode)
      .then((response) => {
        if (!cancelled) setCatalogue(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  function handleConfirm() {
    if (chosenPlanName === null) return;
    setSaving(true);
    setError(null);
    api
      .connectSmsChannel({
        phone_number: number.phone_number,
        plan_name: chosenPlanName,
      })
      .then(() => onConnected())
      .catch((err) => {
        setError((err as Error).message);
        setSaving(false);
      });
  }

  const symbol = catalogue?.currency_symbol ?? '';

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <div className="card__title">Choose a plan</div>
          <div className="hint">
            for <span className="mono">{number.phone_number}</span>
            {catalogue && ` · priced in ${catalogue.currency}`}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>

      <div className="card__body">
        {error && <div className="banner banner--danger">{error}</div>}

        {loading ? (
          <div className="state">Loading plans…</div>
        ) : !catalogue?.plans.length ? (
          <div className="state">
            <div className="state__title">No plans available</div>
            <div>Nothing is published for this country yet.</div>
          </div>
        ) : (
          <>
            <div className="plan-grid">
              {catalogue.plans.map((plan) => {
                const selected = chosenPlanName === plan.name;
                return (
                  <button
                    key={plan.name}
                    className={`plan ${selected ? 'plan--selected' : ''}`}
                    onClick={() => setChosenPlanName(plan.name)}
                    disabled={saving}
                  >
                    <span className="plan__count">
                      {plan.sms_count.toLocaleString()}
                    </span>
                    <span className="plan__unit">texts a month</span>
                    <span className="plan__price">
                      {symbol}
                      {plan.price_per_month}
                    </span>
                    <span className="plan__rate">
                      {symbol}
                      {plan.price_per_sms} per text
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="row" style={{ marginTop: 18 }}>
              <span className="hint">
                Billed monthly. This connects {number.phone_number} to your
                account and you can change plan later.
              </span>
              <div className="spacer" />
              <button
                className="btn btn--primary"
                onClick={handleConfirm}
                disabled={chosenPlanName === null || saving}
              >
                {saving ? 'Connecting…' : 'Confirm plan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
