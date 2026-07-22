import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import { loadAdminToken, setAdminOn401 } from '@officing/api-client';
import { useAdminStore } from './store/auth';
import './index.css';

// Restore persisted token into api-client module state
loadAdminToken();

// Any 401 from the admin API automatically signs the operator out and
// redirects to the login page — no manual handling needed per page.
setAdminOn401(() => {
  useAdminStore.getState().logout();
  window.location.replace('/admin/login');
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
