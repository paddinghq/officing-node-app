import { create } from 'zustand';
import type { User, Subscription } from '@officing/api-client';
import { setTenantAuth, clearTenantAuth } from '@officing/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  subscription: Subscription | null;
  tenantSlug: string;
  primaryColor: string;
  logoUrl: string;
  tenantName: string;
  login: (user: User, accessToken: string, refreshToken: string, slug?: string) => void;
  logout: () => void;
  setSubscription: (sub: Subscription) => void;
  setBranding: (branding: { primaryColor?: string; logoUrl?: string; name?: string }) => void;
}

// ─── Persist / restore user object ───────────────────────────────────────────
const USER_KEY = 'authUser';

function saveUser(user: User) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}
function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}
function removeUser() {
  try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
}

// ─── Determine initial authenticated state ───────────────────────────────────
function hasStoredSession(): boolean {
  try {
    return !!(
      localStorage.getItem('accessToken') &&
      localStorage.getItem('refreshToken')
    );
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  // Restore user from localStorage so the sidebar/header shows correct info
  // after a page refresh without requiring a new API call.
  user: hasStoredSession() ? loadUser() : null,
  isAuthenticated: hasStoredSession(),
  subscription: null,
  tenantSlug:
    localStorage.getItem('tenantSlug') ??
    (import.meta.env as Record<string, string>).VITE_DEFAULT_TENANT_SLUG ??
    'officing',
  primaryColor: '#6366f1',
  logoUrl: '',
  tenantName: 'Officing',

  login(user, accessToken, refreshToken, slug) {
    const resolvedSlug =
      slug ??
      user.tenantSlug ??
      (import.meta.env as Record<string, string>).VITE_DEFAULT_TENANT_SLUG ??
      'officing';
    setTenantAuth(accessToken, refreshToken, resolvedSlug);
    saveUser(user);
    set({ user, isAuthenticated: true, tenantSlug: resolvedSlug });
  },

  logout() {
    clearTenantAuth();
    removeUser();
    set({ user: null, isAuthenticated: false, subscription: null });
  },

  setSubscription(subscription) {
    set({ subscription });
  },

  setBranding({ primaryColor, logoUrl, name }) {
    if (primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', primaryColor);
      set({ primaryColor });
    }
    if (logoUrl !== undefined) set({ logoUrl });
    if (name !== undefined) set({ tenantName: name });
  },
}));
