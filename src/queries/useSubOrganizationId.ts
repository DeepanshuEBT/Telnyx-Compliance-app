import { useQuery } from '@tanstack/react-query';
import { getSessionQueryOptions } from './query-options/session';

/**
 * The sub-organization the current link belongs to, for scoping query keys.
 *
 * Reads the already-cached session, so it costs no extra request. Every screen
 * that calls this renders under the layout's `<Outlet />`, which only renders
 * once the session has resolved, so the id is there by the time it is needed.
 *
 * Keys are scoped by it because Boxly switches sub-organization in place,
 * without a reload. Once these screens live there, an unscoped key would hand
 * the previous account's data to the next one.
 */
export function useSubOrganizationId(): string {
  const { data } = useQuery(getSessionQueryOptions());
  return data?.sub_organization_id ?? '';
}
