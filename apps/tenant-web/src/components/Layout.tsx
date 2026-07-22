import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Avatar,
  Dropdown,
  Label,
} from '@heroui/react';
import {
  ChartBar,
  FileText,
  FileCode,
  Receipt,
  CircleDollar,
  Person,
  OfficeBadge,
  ChartLine,
  LetterGroup,
  Gear,
  Lock,
  Bell,
  ArrowRightFromSquare,
  Bars,
  Xmark,
  Target,
  Magnet,
  Hand,
  Sliders,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  SquareLetterT,
} from '@gravity-ui/icons';
import { useAuthStore } from '../store/auth';
import { SubscriptionBanner } from './SubscriptionBanner';

// ─── Nav item descriptor ─────────────────────────────────────────────────────
type IconComp = React.ComponentType<{
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}>;

type NavItem = { to: string; label: string; Icon: IconComp };

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Dashboard',      Icon: ChartBar },
  { to: '/invoices',      label: 'Invoices',       Icon: FileText },
  { to: '/estimates',     label: 'Estimates',      Icon: FileCode },
  { to: '/bills',         label: 'Bills',          Icon: Receipt },
  { to: '/expenses',      label: 'Expenses',       Icon: CircleDollar },
  { to: '/customers',     label: 'Customers',      Icon: Person },
  { to: '/merchants',     label: 'Merchants',      Icon: OfficeBadge },
  { to: '/reports',       label: 'Reports',        Icon: ChartLine },
  { to: '/people',        label: 'People',         Icon: LetterGroup },
  { to: '/settings',      label: 'Settings',       Icon: Gear },
  { to: '/security',      label: 'Security',       Icon: Lock },
  { to: '/notifications', label: 'Notifications',  Icon: Bell },
  { to: '/subscription',  label: 'Subscription',   Icon: CreditCard },
];

const CRM_NAV_ITEMS: NavItem[] = [
  { to: '/crm',          label: 'CRM Dashboard', Icon: Magnet },
  { to: '/leads',        label: 'Leads',         Icon: Target },
  { to: '/prospects',    label: 'Prospects',     Icon: Person },
  { to: '/deals',        label: 'Deals',         Icon: Hand },
  { to: '/crm-settings', label: 'CRM Settings',  Icon: Sliders },
];

// ─── Single nav link ─────────────────────────────────────────────────────────
function NavLink2({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { Icon } = item;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      end={item.to === '/dashboard'}
      title={collapsed ? item.label : undefined}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
      style={({ isActive }: { isActive: boolean }) => ({
        background: isActive ? 'var(--brand-primary)' : 'transparent',
        color: isActive ? '#fff' : 'var(--muted)',
      })}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <Icon
            width={17}
            height={17}
            style={{ color: isActive ? '#fff' : 'var(--muted)', flexShrink: 0 }}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

// ─── Nav list (reused by desktop + mobile) ───────────────────────────────────
function NavList({
  collapsed,
  hasCrm,
  onNavigate,
}: {
  collapsed: boolean;
  hasCrm: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
      {NAV_ITEMS.map(item => (
        <NavLink2 key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}

      {hasCrm && (
        <>
          {!collapsed ? (
            <p
              className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              CRM
            </p>
          ) : (
            <div className="my-2 h-px" style={{ background: 'var(--separator)' }} />
          )}
          {CRM_NAV_ITEMS.map(item => (
            <NavLink2 key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </>
      )}
    </nav>
  );
}

// ─── User dropdown (bottom of sidebar) ──────────────────────────────────────
function UserMenu({
  collapsed,
  user,
  onLogout,
}: {
  collapsed: boolean;
  user: { firstName: string; lastName: string; email: string } | null;
  onLogout: () => void;
}) {
  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className={`p-3 border-t border-[var(--separator)] ${collapsed ? 'flex justify-center' : ''}`}>
      {/* @ts-expect-error HeroUI v3.2.2 types missing children for Dropdown */}
      <Dropdown>
        <button
          className={`flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--surface-secondary)] outline-none ${
            collapsed ? 'justify-center' : 'w-full text-left'
          }`}
        >
          <Avatar className="shrink-0">
            {/* @ts-expect-error HeroUI v3.2.2 types missing src for Avatar.Image */}
            <Avatar.Image src="" alt={user.firstName} />
            {/* @ts-expect-error HeroUI v3.2.2 types missing children/style for Avatar.Fallback */}
            <Avatar.Fallback
              className="flex h-full w-full items-center justify-center text-xs font-bold"
              style={{
                background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)',
                color: 'var(--brand-primary)',
              }}
            >
              {initials}
            </Avatar.Fallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: 'var(--foreground)' }}
                >
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>
                  {user.email}
                </p>
              </div>
              <ChevronDown
                width={13}
                height={13}
                style={{ color: 'var(--muted)', flexShrink: 0 }}
              />
            </>
          )}
        </button>

        <Dropdown.Popover className="min-w-[200px]">
          {/* @ts-expect-error HeroUI v3.2.2 types missing children for Dropdown.Menu */}
          <Dropdown.Menu onAction={(key: React.Key) => key === 'logout' && onLogout()}>
            {/* @ts-expect-error HeroUI v3.2.2 types missing children for Dropdown.Item */}
            <Dropdown.Item id="logout" textValue="Log out">
              <div className="flex items-center gap-2 text-red-600">
                <ArrowRightFromSquare width={15} height={15} />
                {/* @ts-expect-error HeroUI v3.2.2 types missing children for Label */}
                <Label className="cursor-pointer text-red-600">Log out</Label>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

// ─── Brand header (top of sidebar) ──────────────────────────────────────────
function SidebarHeader({
  collapsed,
  logoUrl,
  tenantName,
  onToggle,
  onClose,
  showToggle,
  showClose,
}: {
  collapsed: boolean;
  logoUrl: string;
  tenantName: string;
  onToggle: () => void;
  onClose: () => void;
  showToggle: boolean;
  showClose: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 py-4 transition-all ${
        collapsed ? 'flex-col items-center gap-4 px-2' : 'flex-row items-center gap-3 px-4'
      }`}
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Logo / brand icon */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="logo"
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'var(--brand-primary)', color: '#fff' }}
        >
          <SquareLetterT width={18} height={18} />
        </div>
      )}

      {/* Tenant name — hidden when collapsed */}
      {!collapsed && (
        <span
          className="min-w-0 flex-1 truncate text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {tenantName}
        </span>
      )}

      {/* Desktop collapse/expand toggle */}
      {showToggle && (
        <button
          onClick={onToggle}
          className={`shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)] ${
            collapsed ? '' : 'ml-auto'
          }`}
          style={{ color: 'var(--muted)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight width={15} height={15} />
          ) : (
            <ChevronLeft width={15} height={15} />
          )}
        </button>
      )}

      {/* Mobile close button */}
      {showClose && (
        <button
          onClick={onClose}
          className="ml-auto shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
          style={{ color: 'var(--muted)' }}
          aria-label="Close menu"
        >
          <Xmark width={18} height={18} />
        </button>
      )}
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export function Layout() {
  const { user, tenantName, logoUrl, logout, subscription } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hasCrm =
    !subscription || ['standard', 'premium'].includes(subscription.plan);

  // Close mobile nav whenever route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);
  const closeMobile     = useCallback(() => setMobileOpen(false), []);
  const openMobile      = useCallback(() => setMobileOpen(true), []);

  const sidebarStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0 border-r
          transition-[width] duration-200 ease-in-out overflow-hidden
          ${collapsed ? 'w-[4.25rem]' : 'w-60'}
        `}
        style={sidebarStyle}
      >
        <SidebarHeader
          collapsed={collapsed}
          logoUrl={logoUrl}
          tenantName={tenantName}
          onToggle={toggleCollapsed}
          onClose={closeMobile}
          showToggle={true}
          showClose={false}
        />
        <NavList collapsed={collapsed} hasCrm={hasCrm} />
        <UserMenu collapsed={collapsed} user={user} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile slide-over sidebar ────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r
          transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={sidebarStyle}
      >
        {/* Mobile always shows the full (non-collapsed) layout */}
        <SidebarHeader
          collapsed={false}
          logoUrl={logoUrl}
          tenantName={tenantName}
          onToggle={toggleCollapsed}
          onClose={closeMobile}
          showToggle={false}
          showClose={true}
        />
        <NavList collapsed={false} hasCrm={hasCrm} onNavigate={closeMobile} />
        <UserMenu collapsed={false} user={user} onLogout={handleLogout} />
      </aside>

      {/* ── Main content column ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Subscription expiry banner */}
        <SubscriptionBanner />

        {/* Top bar */}
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6"
          style={{
            background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Left: hamburger (mobile) + page label */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={openMobile}
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)] lg:hidden"
              style={{ color: 'var(--muted)' }}
              aria-label="Open navigation menu"
            >
              <Bars width={20} height={20} />
            </button>

            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {tenantName}
            </span>
          </div>

          {/* Right: notifications + user name */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
              style={{ color: 'var(--muted)' }}
              aria-label="Notifications"
            >
              <Bell width={18} height={18} />
            </NavLink>
            <span className="hidden text-sm sm:block" style={{ color: 'var(--muted)' }}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}