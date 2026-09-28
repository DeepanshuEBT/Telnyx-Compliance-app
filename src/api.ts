import type {
  AddressPayload,
  AvailableNumber,
  ConnectedSmsChannel,
  NumberOrder,
  PageMeta,
  PhoneNumber,
  Requirement,
  RequirementGroup,
  RequirementGroupStatus,
  RequirementType,
  SmsPlanCatalogue,
  TelnyxAddress,
  TelnyxDocument,
} from './types';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8000/api/telnyx_compliance';

const TOKEN_KEY = 'compliance_token';

/**
 * The customer arrives on a signed link. We lift the token out of the URL once,
 * keep it for the session, and strip it from the address bar so it does not end
 * up in screenshots or shared links.
 */
export function hasStoredToken(): boolean {
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}

export function resolveToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('token');
  if (fromUrl) {
    sessionStorage.setItem(TOKEN_KEY, fromUrl);
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
    return fromUrl;
  }
  return sessionStorage.getItem(TOKEN_KEY);
}

export class ApiError extends Error {
  errorKey: string;
  status: number;

  constructor(message: string, errorKey: string, status: number) {
    super(message);
    this.errorKey = errorKey;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? 'Something went wrong. Please try again.',
      payload?.error_key ?? 'UNKNOWN',
      response.status,
    );
  }
  return payload as T;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: PageMeta;
  /** Set on group creation when an existing group was handed back instead. */
  reused?: boolean;
}

export const api = {
  session: () => request<Envelope<{ sub_organization_id: string }>>('/session'),

  listRequirements: (params: {
    country_code?: string;
    phone_number_type?: string;
    action?: string;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : '';
    return request<Envelope<Requirement[]>>(`/requirements${suffix}`);
  },

  listRequirementTypes: () =>
    request<Envelope<RequirementType[]>>('/requirement_types'),

  listGroups: () =>
    request<Envelope<RequirementGroup[]>>('/requirement_groups'),

  createGroup: (body: {
    country_code: string;
    phone_number_type: string;
    action: string;
  }) =>
    request<Envelope<RequirementGroup>>('/requirement_groups', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getGroup: (id: string) =>
    request<Envelope<RequirementGroup>>(`/requirement_groups/${id}`),

  updateGroup: (
    id: string,
    regulatory_requirements: { requirement_id: string; field_value: string }[],
  ) =>
    request<Envelope<RequirementGroup>>(`/requirement_groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ regulatory_requirements }),
    }),

  submitGroup: (id: string) =>
    request<Envelope<RequirementGroup>>(
      `/requirement_groups/${id}/submit_for_approval`,
      { method: 'POST' },
    ),

  deleteGroup: (id: string) =>
    request<Envelope<{ id: string }>>(`/requirement_groups/${id}`, {
      method: 'DELETE',
    }),

  listAddresses: () => request<Envelope<TelnyxAddress[]>>('/addresses'),

  createAddress: (body: AddressPayload) =>
    request<Envelope<TelnyxAddress>>('/addresses', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  searchAvailableNumbers: (params: Record<string, unknown>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, String(item)));
      } else {
        query.set(key, String(value));
      }
    });
    return request<Envelope<AvailableNumber[]>>(
      `/available_phone_numbers?${query}`,
    );
  },

  listPhoneNumbers: () => request<Envelope<PhoneNumber[]>>('/phone_numbers'),

  releasePhoneNumber: (id: string) =>
    request<Envelope<{ id: string }>>(`/phone_numbers/${id}`, {
      method: 'DELETE',
    }),

  listNumberOrders: () => request<Envelope<NumberOrder[]>>('/number_orders'),

  smsPlans: (countryCode: string) =>
    request<Envelope<SmsPlanCatalogue>>(
      `/sms_plans?country_code=${countryCode}`,
    ),

  createNumberOrder: (body: {
    phone_number: string;
    country_code: string;
    requirement_group_id?: string;
  }) =>
    request<Envelope<NumberOrder>>('/number_orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  connectSmsChannel: (body: { phone_number: string; plan_name: string }) =>
    request<Envelope<ConnectedSmsChannel>>('/sms_channel', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  uploadDocument: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<Envelope<TelnyxDocument>>('/documents', {
      method: 'POST',
      body,
    });
  },
};

export const GROUP_STATUS_LABELS: Record<RequirementGroupStatus, string> = {
  unapproved: 'Not submitted',
  'pending-approval': 'In review',
  approved: 'Approved',
  declined: 'Declined',
  expired: 'Expired',
  'no-longer-eligible': 'No longer eligible',
};
