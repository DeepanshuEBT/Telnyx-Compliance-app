import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const phoneNumbersQueryKey = () => ['phone-numbers'] as const;

export const numberOrdersQueryKey = () => ['number-orders'] as const;

/**
 * Searches carry a nonce so every press of Search is its own cache entry.
 * Repeating a search then really re-runs it rather than replaying stale rows,
 * and an older response can never land over a newer one.
 */
export const availableNumbersQueryKey = (
  nonce: number,
  params: Record<string, unknown>,
) => ['available-numbers', nonce, params] as const;

export const getPhoneNumbersQueryOptions = () =>
  queryOptions({
    queryKey: phoneNumbersQueryKey(),
    queryFn: () => api.listPhoneNumbers().then((response) => response.data),
  });

export const getNumberOrdersQueryOptions = () =>
  queryOptions({
    queryKey: numberOrdersQueryKey(),
    queryFn: () => api.listNumberOrders().then((response) => response.data),
  });

export const getAvailableNumbersQueryOptions = (
  nonce: number,
  params: Record<string, unknown>,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: availableNumbersQueryKey(nonce, params),
    queryFn: () =>
      api.searchAvailableNumbers(params).then((response) => response.data),
    enabled,
    gcTime: 0,
  });
