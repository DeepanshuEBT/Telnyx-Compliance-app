import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { resolveToken } from './api';
import { queryClient } from './queries/queryClient';
import { createAppRouter } from './routes';
import './styles.css';

// Lift the token out of the URL before the router is built. resolveToken
// rewrites the address bar, and the router reads it as it is created, so the
// order here is what keeps the two agreeing on the current location.
resolveToken();

const router = createAppRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
