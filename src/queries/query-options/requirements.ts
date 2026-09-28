import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export interface RequirementsParams {
  country_code: string;
  phone_number_type: string;
  action: string;
}

export const requirementsQueryKey = (
  subOrgId: string,
  params: RequirementsParams,
) => ['requirements', subOrgId, params] as const;

export const getRequirementsQueryOptions = (
  subOrgId: string,
  params: RequirementsParams,
  enabled = true,
) =>
  queryOptions({
    queryKey: requirementsQueryKey(subOrgId, params),
    queryFn: () =>
      api.listRequirements(params).then((response) => response.data),
    enabled,
  });
