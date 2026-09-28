import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const addressesQueryKey = () => ['addresses'] as const;

export const getAddressesQueryOptions = () =>
  queryOptions({
    queryKey: addressesQueryKey(),
    queryFn: () => api.listAddresses().then((response) => response.data),
  });
