import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export interface RequirementsParams {
  country_code: string;
  phone_number_type: string;
  action: string;
}

export const requirementsQueryKey = (params: RequirementsParams) =>
  ['requirements', params] as const;

export const getRequirementsQueryOptions = (
  params: RequirementsParams,
  enabled = true,
) =>
  queryOptions({
    queryKey: requirementsQueryKey(params),
    queryFn: () => api.listRequirements(params).then((response) => response.data),
    enabled,
  });
