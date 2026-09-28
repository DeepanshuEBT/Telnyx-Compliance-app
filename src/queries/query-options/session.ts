import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api';

export const sessionQueryKey = () => ['session'] as const;

export const getSessionQueryOptions = () =>
  queryOptions({
    queryKey: sessionQueryKey(),
    queryFn: () => api.session().then((response) => response.data),
  });
