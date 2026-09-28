import { QueryClient } from '@tanstack/react-query';

/**
 * Defaults chosen to match how this app behaved before React Query, so the
 * migration changes the plumbing and not what the customer sees:
 *
 * - `retry: false`: a failed call showed its error straight away. Retrying
 *   three times with backoff would leave them staring at a spinner instead.
 * - no refetch on focus or reconnect, so nothing reloads behind the customer's
 *   back, and a refetch mid-form is how half-typed answers get replaced.
 * - `staleTime: 0`: every tab switch remounts and refetched. Keeping it at 0
 *   keeps that, with the cached values shown while the refetch runs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
    },
    mutations: { retry: false },
  },
});
