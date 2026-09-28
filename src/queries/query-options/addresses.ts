import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const addressesQueryKey = (subOrgId: string) =>
  ['addresses', subOrgId] as const;

export const getAddressesQueryOptions = (subOrgId: string) =>
  queryOptions({
    queryKey: addressesQueryKey(subOrgId),
    queryFn: () => api.listAddresses().then((response) => response.data),
  });
