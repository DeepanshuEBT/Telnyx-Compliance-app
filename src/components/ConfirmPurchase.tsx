import { useEffect, useRef } from 'react';
import { costAmount, formatCost } from '../format';
import type { AvailableNumber, RequirementGroup } from '../types';

type PaperworkState = 'attached' | 'in-review' | 'declined' | 'none';

interface Props {
  number: AvailableNumber;
  requirementGroup: RequirementGroup | null;
  paperworkState: PaperworkState;
  countryCode: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmPurchase({
  number,
  requirementGroup,
  paperworkState,
  countryCode,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  const cost = number.cost_information ?? {};
  const currency = cost.currency ?? '';
  const monthly = formatCost(cost.monthly_cost, currency);
  const upfront = formatCost(cost.upfront_cost, currency);
  // What actually leaves the account today, which is both costs together.
  const dueNow = formatCost(
    String(costAmount(cost.upfront_cost) + costAmount(cost.monthly_cost)),
    currency,
  );

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal__head">
          <h2 className="modal__title" id="confirm-title">Confirm this purchase</h2>
        </div>

        <div className="modal__body">
          <p>
            You are about to buy <strong className="mono">{number.phone_number}</strong>.
            Once you confirm, the number is bought and assigned to you, and the
            charges below start.
          </p>

          <dl className="summary">
            <div className="summary__row">
              <dt>Number</dt>
              <dd className="mono">{number.phone_number}</dd>
            </div>
            <div className="summary__row">
              <dt>Type</dt>
              <dd>{number.phone_number_type} · {countryCode}</dd>
            </div>
            <div className="summary__row">
              <dt>One-off setup cost</dt>
              <dd>{upfront}</dd>
            </div>
            <div className="summary__row">
              <dt>Ongoing cost</dt>
              <dd>{monthly} per month</dd>
            </div>
            <div className="summary__row summary__row--total">
              <dt>Charged today</dt>
              <dd><strong>{dueNow}</strong></dd>
            </div>
            <div className="summary__row">
              <dt>Paperwork</dt>
              <dd>
                {requirementGroup ? (
                  <span className="mono">{requirementGroup.id.slice(0, 8)} (approved)</span>
                ) : (
                  'None attached'
                )}
              </dd>
            </div>
          </dl>

          <div className="banner banner--warning" style={{ marginBottom: 0 }}>
            {dueNow} is charged today, then {monthly} every month until you
            release the number. Releasing it gives the number up permanently.
          </div>

          {paperworkState === 'in-review' && (
            <div className="banner banner--warning" style={{ marginTop: 12, marginBottom: 0 }}>
              Your {countryCode} paperwork is still being reviewed by Telnyx, so it
              cannot be attached yet. You will still be charged today, but the
              number will not work until the review finishes.
            </div>
          )}

          {paperworkState === 'declined' && (
            <div className="banner banner--danger" style={{ marginTop: 12, marginBottom: 0 }}>
              Your {countryCode} paperwork was not accepted, so nothing can be
              attached. Fix it under Requirement groups first, otherwise you will
              be charged for a number you cannot use.
            </div>
          )}

          {paperworkState === 'none' && (
            <div className="banner banner--info" style={{ marginTop: 12, marginBottom: 0 }}>
              No requirement group is attached. If {countryCode} has regulatory
              requirements, the order will be held until the paperwork is done,
              and the number will not work until then.
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button
            className="btn btn--ghost"
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Buying…' : `Buy this number · ${dueNow} now`}
          </button>
        </div>
      </div>
    </div>
  );
}
