import { useState } from 'react';
import {
  COMMON_COUNTRIES,
  NUMBER_FEATURES,
  NUMBER_MATCH_TYPES,
  PHONE_NUMBER_TYPES,
  SEARCH_BY,
} from '../constants';

export interface SearchCriteria {
  country_code: string;
  phone_number_type: string;
  features: string[];
  searchBy: string;
  searchValue: string;
  number_match_type: string;
  number_match_value: string;
  minimum_block_size: string;
  limit: string;
  best_effort: boolean;
  quickship: boolean;
  reservable: boolean;
  exclude_held_numbers: boolean;
}

export const DEFAULT_CRITERIA: SearchCriteria = {
  country_code: 'GB',
  phone_number_type: 'mobile',
  features: ['sms'],
  searchBy: 'national_destination_code',
  searchValue: '',
  number_match_type: 'starts_with',
  number_match_value: '',
  minimum_block_size: '',
  limit: '20',
  best_effort: true,
  quickship: false,
  reservable: false,
  exclude_held_numbers: true,
};

/** Turns the form into the query the proxy expects. */
export function toQuery(criteria: SearchCriteria): Record<string, unknown> {
  return {
    country_code: criteria.country_code,
    phone_number_type: criteria.phone_number_type || undefined,
    features: criteria.features,
    [criteria.searchBy]: criteria.searchValue || undefined,
    number_match_type: criteria.number_match_value
      ? criteria.number_match_type
      : undefined,
    number_match_value: criteria.number_match_value || undefined,
    minimum_block_size: criteria.minimum_block_size || undefined,
    limit: criteria.limit || undefined,
    best_effort: criteria.best_effort,
    quickship: criteria.quickship,
    reservable: criteria.reservable,
    exclude_held_numbers: criteria.exclude_held_numbers,
  };
}

interface Props {
  criteria: SearchCriteria;
  searching: boolean;
  onChange: (criteria: SearchCriteria) => void;
  onSearch: () => void;
}

const TOGGLES: { key: keyof SearchCriteria; label: string; hint: string }[] = [
  {
    key: 'best_effort',
    label: 'Best effort',
    hint: 'Fill the results with close matches when an exact match runs out',
  },
  {
    key: 'quickship',
    label: 'Quickship',
    hint: 'Only numbers that activate immediately',
  },
  {
    key: 'reservable',
    label: 'Reservable',
    hint: 'Only numbers that can be held before buying',
  },
  {
    key: 'exclude_held_numbers',
    label: 'Exclude held numbers',
    hint: 'Skip numbers someone else has already reserved',
  },
];

export function NumberSearchForm({ criteria, searching, onChange, onSearch }: Props) {
  const [advanced, setAdvanced] = useState(false);

  function set<K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) {
    onChange({ ...criteria, [key]: value });
  }

  const searchBy = SEARCH_BY.find((item) => item.value === criteria.searchBy);

  return (
    <div className="card">
      <div className="card__body">
        <div className="filters">
          <div className="field">
            <label className="label" htmlFor="buy-country">
              Country <span className="required">required</span>
            </label>
            <select
              id="buy-country"
              className="select"
              value={criteria.country_code}
              onChange={(event) => set('country_code', event.target.value)}
            >
              {COMMON_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="buy-type">Type</label>
            <select
              id="buy-type"
              className="select"
              value={criteria.phone_number_type}
              onChange={(event) => set('phone_number_type', event.target.value)}
            >
              <option value="">All types</option>
              {PHONE_NUMBER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="buy-searchby">Search by</label>
            <select
              id="buy-searchby"
              className="select"
              value={criteria.searchBy}
              onChange={(event) =>
                // An area code is not a city, so keeping the old value here
                // silently sends nonsense to Telnyx.
                onChange({
                  ...criteria,
                  searchBy: event.target.value,
                  searchValue: '',
                })
              }
            >
              {SEARCH_BY.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="buy-searchvalue">
              {searchBy?.label ?? 'Value'}
            </label>
            <input
              id="buy-searchvalue"
              className="input"
              style={{ minWidth: 140 }}
              placeholder={searchBy?.placeholder ?? 'optional'}
              value={criteria.searchValue}
              onChange={(event) => set('searchValue', event.target.value)}
            />
          </div>

          <div className="field">
            <span className="label">Features</span>
            <div className="row" style={{ gap: 14, paddingTop: 4 }}>
              {NUMBER_FEATURES.map((feature) => (
                <label key={feature.value} className="check">
                  <input
                    type="checkbox"
                    checked={criteria.features.includes(feature.value)}
                    onChange={() =>
                      set(
                        'features',
                        criteria.features.includes(feature.value)
                          ? criteria.features.filter((item) => item !== feature.value)
                          : [...criteria.features, feature.value],
                      )
                    }
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 16, gap: 12 }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setAdvanced((current) => !current)}
          >
            Advanced search {advanced ? '▴' : '▾'}
          </button>
          <div className="spacer" />
          <button className="btn btn--primary" onClick={onSearch} disabled={searching}>
            {searching ? 'Searching…' : 'Search numbers'}
          </button>
        </div>

        {advanced && (
          <div className="advanced">
            <div className="filters">
              <div className="field">
                <label className="label" htmlFor="buy-match">Phone number</label>
                <select
                  id="buy-match"
                  className="select"
                  value={criteria.number_match_type}
                  onChange={(event) => set('number_match_type', event.target.value)}
                >
                  {NUMBER_MATCH_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="field field--grow">
                <label className="label" htmlFor="buy-matchvalue">Digits</label>
                <input
                  id="buy-matchvalue"
                  className="input"
                  placeholder="e.g. 7700"
                  value={criteria.number_match_value}
                  onChange={(event) => set('number_match_value', event.target.value)}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="buy-block">Consecutive numbers</label>
                <input
                  id="buy-block"
                  className="input"
                  style={{ minWidth: 120 }}
                  type="number"
                  min={2}
                  placeholder="any"
                  value={criteria.minimum_block_size}
                  onChange={(event) => set('minimum_block_size', event.target.value)}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="buy-limit">Results limit</label>
                <input
                  id="buy-limit"
                  className="input"
                  style={{ minWidth: 100 }}
                  type="number"
                  min={1}
                  max={100}
                  value={criteria.limit}
                  onChange={(event) => set('limit', event.target.value)}
                />
              </div>
            </div>

            <div className="toggle-grid">
              {TOGGLES.map((toggle) => (
                <label className="toggle" key={toggle.key}>
                  <input
                    type="checkbox"
                    checked={Boolean(criteria[toggle.key])}
                    onChange={(event) =>
                      set(toggle.key, event.target.checked as never)
                    }
                  />
                  <span>
                    <span className="toggle__label">{toggle.label}</span>
                    <span className="toggle__hint">{toggle.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <p className="hint">
              Matching on digits needs a paid Telnyx account. On a trial account
              the search comes back refused.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
