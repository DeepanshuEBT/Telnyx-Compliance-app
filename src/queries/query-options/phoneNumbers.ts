import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const phoneNumbersQueryKey = (subOrgId: string) =>
  ['phone-numbers', subOrgId] as const;

export const numberOrdersQueryKey = (subOrgId: string) =>
  ['number-orders', subOrgId] as const;

/**
 * Searches carry a nonce so every press of Search is its own cache entry.
 * Repeating a search then really re-runs it rather than replaying stale rows,
 * and an older response can never land over a newer one.
 */
export const availableNumbersQueryKey = (
  subOrgId: string,
  nonce: number,
  params: Record<string, unknown>,
) => ['available-numbers', subOrgId, nonce, params] as const;

export const getPhoneNumbersQueryOptions = (subOrgId: string) =>
  queryOptions({
    queryKey: phoneNumbersQueryKey(subOrgId),
    queryFn: () => api.listPhoneNumbers().then((response) => response.data),
  });

export const getNumberOrdersQueryOptions = (subOrgId: string) =>
  queryOptions({
    queryKey: numberOrdersQueryKey(subOrgId),
    queryFn: () => api.listNumberOrders().then((response) => response.data),
  });

export const getAvailableNumbersQueryOptions = (
  subOrgId: string,
  nonce: number,
  params: Record<string, unknown>,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: availableNumbersQueryKey(subOrgId, nonce, params),
    queryFn: () =>
      api.searchAvailableNumbers(params).then((response) => response.data),
    enabled,
    gcTime: 0,
  });
