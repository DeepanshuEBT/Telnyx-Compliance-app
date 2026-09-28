import { useEffect, useState } from 'react';
import { api } from '../api';
import { ACTIONS, COMMON_COUNTRIES, PHONE_NUMBER_TYPES } from '../constants';
import type { Requirement } from '../types';
import { describeCriteria } from '../validation';

export function RequirementsTab() {
  const [countryCode, setCountryCode] = useState('GB');
  const [phoneNumberType, setPhoneNumberType] = useState('local');
  const [action, setAction] = useState('ordering');

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .listRequirements({
        country_code: countryCode,
        phone_number_type: phoneNumberType,
        action,
      })
      .then((response) => {
        if (!cancelled) setRequirements(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, phoneNumberType, action]);

  const total = requirements.reduce(
    (count, requirement) => count + (requirement.requirement_types?.length ?? 0),
    0,
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="card__body">
          <div className="filters">
            <div className="field">
              <label className="label" htmlFor="country">Country</label>
              <select
                id="country"
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
              <label className="label" htmlFor="number-type">Number type</label>
              <select
                id="number-type"
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
              <label className="label" htmlFor="action">Action</label>
              <select
                id="action"
                className="select"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {ACTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            {!loading && total > 0 && (
              <div className="field">
                <span className="hint">
                  {total} item{total === 1 ? '' : 's'} required
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="banner banner--danger">{error}</div>}

      {loading ? (
        <div className="card"><div className="state">Loading requirements…</div></div>
      ) : requirements.length === 0 ? (
        <div className="card">
          <div className="state">
            <div className="state__title">Nothing published for this combination</div>
            <div>
              Telnyx lists no requirements for {countryCode} {phoneNumberType} numbers.
            </div>
          </div>
        </div>
      ) : (
        requirements.map((requirement) => (
          <div className="card" key={requirement.id}>
            {requirements.length > 1 && (
              <div className="card__header">
                <div className="card__title">
                  {requirement.country_code}
                  {requirement.locality ? ` · ${requirement.locality}` : ''}
                </div>
                <div className="spacer" />
                <span className="badge badge--info">
                  {requirement.requirement_types?.length ?? 0} items
                </span>
              </div>
            )}
            <div className="card__body">
              <div className="req-list">
                {(requirement.requirement_types ?? []).map((requirementType) => (
                  <div className="req" key={requirementType.id}>
                    <div className="req__head">
                      <span className="req__name">{requirementType.name}</span>
                      <span className="type-pill">{requirementType.type}</span>
                    </div>
                    {requirementType.description && (
                      <p className="req__desc">{requirementType.description}</p>
                    )}
                    {requirementType.example && (
                      <p className="req__example">
                        For example: {requirementType.example}
                      </p>
                    )}
                    <div className="req__criteria">
                      {describeCriteria(requirementType.acceptance_criteria).map(
                        (line) => (
                          <span className="criterion" key={line}>{line}</span>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
