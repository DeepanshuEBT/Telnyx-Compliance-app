import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const requirementGroupsQueryKey = (subOrgId: string) =>
  ['requirement-groups', subOrgId] as const;

export const requirementGroupQueryKey = (subOrgId: string, groupId: string) =>
  ['requirement-groups', subOrgId, groupId] as const;

export const getRequirementGroupsQueryOptions = (subOrgId: string) =>
  queryOptions({
    queryKey: requirementGroupsQueryKey(subOrgId),
    queryFn: () => api.listGroups().then((response) => response.data),
  });

export const getRequirementGroupQueryOptions = (
  subOrgId: string,
  groupId: string,
) =>
  queryOptions({
    queryKey: requirementGroupQueryKey(subOrgId, groupId),
    queryFn: () => api.getGroup(groupId).then((response) => response.data),
  });
