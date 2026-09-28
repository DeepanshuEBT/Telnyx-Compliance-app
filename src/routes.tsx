import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { GroupDetailRoute } from './components/GroupDetailRoute';
import { PhoneNumbersTab } from './components/PhoneNumbersTab';
import { RequirementGroupsTab } from './components/RequirementGroupsTab';
import { RequirementsTab } from './components/RequirementsTab';

/**
 * Where the customer is lives in the URL, so a refresh keeps their place and
 * the browser's back button works inside the app. The phone numbers sub-tabs
 * are routes for the same reason.
 *
 * A factory rather than a value: the router reads the address bar the moment it
 * is built, and the token has to be lifted out of the URL before that happens.
 * A module-level value would be built on import, which runs first.
 */
export const createAppRouter = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/groups" replace /> },
        { path: 'requirements', element: <RequirementsTab /> },
        { path: 'groups', element: <RequirementGroupsTab /> },
        { path: 'groups/:groupId', element: <GroupDetailRoute /> },
        { path: 'numbers', element: <PhoneNumbersTab /> },
        { path: 'numbers/orders', element: <PhoneNumbersTab /> },
        { path: 'numbers/buy', element: <PhoneNumbersTab /> },
        { path: '*', element: <Navigate to="/groups" replace /> },
      ],
    },
  ]);
