import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const requirementGroupsQueryKey = () => ['requirement-groups'] as const;

export const requirementGroupQueryKey = (groupId: string) =>
  ['requirement-groups', groupId] as const;

export const getRequirementGroupsQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: requirementGroupsQueryKey(),
    queryFn: () => api.listGroups().then((response) => response.data),
    enabled,
  });

export const getRequirementGroupQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: requirementGroupQueryKey(groupId),
    queryFn: () => api.getGroup(groupId).then((response) => response.data),
  });
