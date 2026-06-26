import { create } from 'zustand';
import type { AdminUser } from '@officing/api-client';
import { setAdminToken, clearAdminToken } from '@officing/api-client';

interface AdminAuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (admin: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminAuthState>((set) => ({
  admin: null,
  isAuthenticated: !!localStorage.getItem('platformToken'),
  login(admin, token) {
    setAdminToken(token);
    set({ admin, isAuthenticated: true });
  },
  logout() {
    clearAdminToken();
    set({ admin: null, isAuthenticated: false });
  },
}));
