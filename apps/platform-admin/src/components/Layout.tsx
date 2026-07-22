import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button as HeroButton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@heroui/react';
import {
  ChartColumn,
  House,
  ListUl,
  ArrowRightFromSquare,
  Bars,
  Xmark,
  Sun,
  Moon,
  ChevronDown,
  SquareLetterT,
} from '@gravity-ui/icons';
import { useAdminStore } from '../store/auth';
import type { ReactNode } from 'react';

// HeroUI v3 Button doesn't expose children in its TS types — cast to avoid error
const Button = HeroButton as unknown as React.FC<React.ComponentPropsWithRef<'button'> & {
  variant?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  children?: ReactNode;
}>;

const NAV = [
  { to: '/admin/overview', label: 'Overview', Icon: ChartColumn },
  { to: '/admin/tenants', label: 'Tenants', Icon: House },
  { to: '/admin/audit-logs', label: 'Audit logs', Icon: ListUl },
] as const;

function useThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark'
    );
  });

  const toggle = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    setIsDark(d => !d);
  };

  return { isDark, toggle };
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3 px-1 min-w-0">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
        style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
      >
        <SquareLetterT width={20} height={20} />
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className="truncate text-sm font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Officing
        </p>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}
        >
          Control Plane
        </p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <ul className="flex flex-col gap-0.5" role="list">
      {NAV.map(({ to, label, Icon }) => {
        const isActive = location.pathname.startsWith(to);
        return (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={({ isActive: a }: { isActive: boolean }) => ({
                background: a ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                color: a ? 'var(--accent)' : 'var(--muted)',
              })}
            >
              <Icon
                width={17}
                height={17}
                style={{ color: isActive ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}
              />
              <span>{label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}



export function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggle } = useThemeToggle();
  const { logout } = useAdminStore();
  const navigate = useNavigate();
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const currentLabel =
    NAV.find(n => location.pathname.startsWith(n.to))?.label ?? 'Dashboard';

  return (
    <div
      className="flex h-screen overflow-hidden antialiased"
      style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r transition-transform duration-300 ease-in-out lg:relative lg:z-10 lg:w-64 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {/* Brand header */}
        <div
          className="flex items-center justify-between px-4 py-5"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          <BrandMark />
          <Button
            variant="ghost"
            className="lg:hidden"
            aria-label="Close menu"
            onPress={() => setIsMobileMenuOpen(false)}
          >
            <Xmark width={18} height={18} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavList onNavigate={() => setIsMobileMenuOpen(false)} />
        </nav>

        <div className="h-px mx-3" style={{ background: 'var(--separator)' }} />

        {/* User */}
        <div className="p-3">
          <Button variant='danger'
            onClick={() => { logout(); navigate('/admin/login'); }}>
           <span className="flex items-center gap-2">
            <ArrowRightFromSquare width={15} height={15} />
            Log out
          </span>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 lg:px-8"
          style={{
            borderColor: 'var(--border)',
            background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="lg:hidden"
              aria-label="Open menu"
              onPress={() => setIsMobileMenuOpen(true)}
            >
              <Bars width={18} height={18} />
            </Button>
            <div className="leading-tight">
              <p
                className="text-base font-semibold tracking-tight sm:text-lg"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                {currentLabel}
              </p>
              <p className="hidden text-xs sm:block" style={{ color: 'var(--muted)' }}>
                Platform administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="primary"
                  aria-label="Toggle theme"
                  onPress={toggle}
                >
                  {isDark ? <Sun width={6} height={6} /> : <Moon width={6} height={6} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              </TooltipContent>
            </Tooltip>
           
          </div>
        </header>

        {/* Page */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--background)' }}
        >
          <div className="mx-auto h-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
