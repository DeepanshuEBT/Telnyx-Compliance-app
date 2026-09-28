import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const smsPlansQueryKey = (countryCode: string) =>
  ['sms-plans', countryCode] as const;

export const getSmsPlansQueryOptions = (countryCode: string) =>
  queryOptions({
    queryKey: smsPlansQueryKey(countryCode),
    queryFn: () => api.smsPlans(countryCode).then((response) => response.data),
  });
