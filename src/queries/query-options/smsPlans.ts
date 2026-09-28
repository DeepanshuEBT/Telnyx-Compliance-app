import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const smsPlansQueryKey = (subOrgId: string, countryCode: string) =>
  ['sms-plans', subOrgId, countryCode] as const;

export const getSmsPlansQueryOptions = (
  subOrgId: string,
  countryCode: string,
) =>
  queryOptions({
    queryKey: smsPlansQueryKey(subOrgId, countryCode),
    queryFn: () => api.smsPlans(countryCode).then((response) => response.data),
  });
