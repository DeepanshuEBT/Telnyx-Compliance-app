import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { COMMON_COUNTRIES } from '../constants';
import {
  addressesQueryKey,
  getAddressesQueryOptions,
} from '../queries/query-options/addresses';
import { useSubOrganizationId } from '../queries/useSubOrganizationId';
import type { AddressPayload, TelnyxAddress } from '../types';

interface Props {
  value: string;
  disabled: boolean;
  defaultCountryCode: string;
  onChange: (addressId: string) => void;
}

const EMPTY: AddressPayload = {
  country_code: '',
  street_address: '',
  locality: '',
  postal_code: '',
  administrative_area: '',
  business_name: '',
  first_name: '',
  last_name: '',
};

export function summariseAddress(address: TelnyxAddress): string {
  return [
    address.business_name ||
      [address.first_name, address.last_name].filter(Boolean).join(' '),
    address.street_address,
    address.locality,
    address.administrative_area,
    address.postal_code,
    address.country_code,
  ]
    .filter(Boolean)
    .join(', ');
}

export function AddressField({
  value,
  disabled,
  defaultCountryCode,
  onChange,
}: Props) {
  const queryClient = useQueryClient();
  const subOrgId = useSubOrganizationId();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<AddressPayload>({
    ...EMPTY,
    country_code: defaultCountryCode,
  });
  const [error, setError] = useState<string | null>(null);

  // A failed list leaves the picker empty and silent, as before: the customer
  // can still add an address, which is the way out of an empty list anyway.
  const addressesQuery = useQuery(getAddressesQueryOptions(subOrgId));
  const addresses = addressesQuery.data ?? [];

  const createAddress = useMutation({
    mutationFn: (payload: AddressPayload) => api.createAddress(payload),
    onSuccess: (response) => {
      queryClient.setQueryData<TelnyxAddress[]>(
        addressesQueryKey(subOrgId),
        (current) => [...(current ?? []), response.data],
      );
      onChange(response.data.id);
      setShowForm(false);
      setDraft({ ...EMPTY, country_code: defaultCountryCode });
      setError(null);
    },
    onError: (err) => setError((err as Error).message),
  });

  const saving = createAddress.isPending;
  const selected = addresses.find((address) => address.id === value);

  function handleCreate() {
    setError(null);
    createAddress.mutate(draft);
  }

  function set(field: keyof AddressPayload, fieldValue: string) {
    setDraft((current) => ({ ...current, [field]: fieldValue }));
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="file-row">
        <select
          className="select"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select an address…</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {summariseAddress(address)}
            </option>
          ))}
        </select>
        <button
          className="btn btn--ghost btn--sm"
          disabled={disabled}
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? 'Cancel' : 'Add a new address'}
        </button>
      </div>

      {selected && <span className="hint mono">Address ID: {selected.id}</span>}

      {showForm && (
        <div className="address-form">
          <div className="address-grid">
            <div className="field field--grow">
              <label className="label">Business name</label>
              <input
                className="input"
                value={draft.business_name ?? ''}
                onChange={(event) => set('business_name', event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">First name</label>
              <input
                className="input"
                value={draft.first_name ?? ''}
                onChange={(event) => set('first_name', event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Last name</label>
              <input
                className="input"
                value={draft.last_name ?? ''}
                onChange={(event) => set('last_name', event.target.value)}
              />
            </div>
            <div className="field field--grow">
              <label className="label">Street address</label>
              <input
                className="input"
                value={draft.street_address}
                onChange={(event) => set('street_address', event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Town or city</label>
              <input
                className="input"
                value={draft.locality}
                onChange={(event) => set('locality', event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">State or region</label>
              <input
                className="input"
                value={draft.administrative_area ?? ''}
                onChange={(event) =>
                  set('administrative_area', event.target.value)
                }
              />
            </div>
            <div className="field">
              <label className="label">Postal code</label>
              <input
                className="input"
                value={draft.postal_code}
                onChange={(event) => set('postal_code', event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Country</label>
              <select
                className="select"
                value={draft.country_code}
                onChange={(event) => set('country_code', event.target.value)}
              >
                {COMMON_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="hint">
            Give a business name, or a first and last name. Telnyx validates the
            address when it is created.
          </p>

          {error && <span className="req__error">{error}</span>}

          <button
            className="btn btn--primary btn--sm"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save address'}
          </button>
        </div>
      )}
    </div>
  );
}
