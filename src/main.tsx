import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from './router';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider />
    </ErrorBoundary>
  </StrictMode>
);
