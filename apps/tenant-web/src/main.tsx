import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import { loadTenantAuth, setTenantOn401 } from '@officing/api-client';
import { useAuthStore } from './store/auth';
import './index.css';

// Restore tokens into the api-client module state from localStorage
loadTenantAuth();

// When any request gets a final 401 (token expired and refresh also failed),
// clear the Zustand session and redirect to login without needing React Router.
setTenantOn401(() => {
  useAuthStore.getState().logout();
  window.location.replace('/login');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
