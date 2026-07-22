import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Separator,
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
  CreditCard,
  SquareLetterT,
} from '@gravity-ui/icons';
import { useAuthStore } from '../store/auth';
import { SubscriptionBanner } from './SubscriptionBanner';

type NavItem = { to: string; label: string; Icon: React.ComponentType<{ width?: number; height?: number; style?: React.CSSProperties }> };

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     label: 'Dashboard',     Icon: ChartBar },
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
  { to: '/crm',           label: 'CRM Dashboard',  Icon: Magnet },
  { to: '/leads',         label: 'Leads',          Icon: Target },
  { to: '/prospects',     label: 'Prospects',      Icon: Person },
  { to: '/deals',         label: 'Deals',          Icon: Hand },
  { to: '/crm-settings',  label: 'CRM Settings',   Icon: Sliders },
];

function NavItem({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const { Icon } = item;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      end={item.to === '/dashboard'}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={({ isActive }) => ({
        background: isActive ? 'var(--brand-primary)' : 'transparent',
        color: isActive ? '#fff' : 'var(--muted)',
      })}
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon
            width={17}
            height={17}
            style={{ color: isActive ? '#fff' : 'var(--muted)', flexShrink: 0 }}
          />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { user, tenantName, logoUrl, logout, subscription } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : 'U';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}
          >
            <SquareLetterT width={18} height={18} />
          </div>
        )}
        {!collapsed && (
          <span
            className="truncate font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {tenantName}
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto shrink-0 rounded-lg p-1.5 transition-colors lg:flex hidden"
          style={{ color: 'var(--muted)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronDown width={14} height={14} style={{ transform: 'rotate(-90deg)' }} />
          ) : (
            <ChevronDown width={14} height={14} style={{ transform: 'rotate(90deg)' }} />
          )}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto shrink-0 rounded-lg p-1.5 transition-colors lg:hidden"
          style={{ color: 'var(--muted)' }}
          aria-label="Close menu"
        >
          <Xmark width={18} height={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
        ))}

        {hasCrm && (
          <>
            {!collapsed && (
              <p
                className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--muted)' }}
              >
                CRM
              </p>
            )}
            {collapsed && <Separator className="my-2" style={{ background: 'var(--separator)' }} />}
            {CRM_NAV_ITEMS.map(item => (
              <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <Separator style={{ background: 'var(--separator)' }} />

      {/* User */}
      <div className="p-3">
        <Dropdown>
          <DropdownTrigger>
            <button
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar>
                <AvatarImage src="" alt={user?.firstName ?? ''} />
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)', color: 'var(--brand-primary)' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && user && (
                <>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown width={13} height={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </>
              )}
            </button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem key="logout" onPress={handleLogout} className="text-red-600">
              <span className="flex items-center gap-2">
                <ArrowRightFromSquare width={15} height={15} />
                Log out
              </span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 border-r ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar mobile slide-over */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Subscription banner */}
        <SubscriptionBanner />

        {/* Topbar */}
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6"
          style={{
            background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 transition-colors lg:hidden"
              style={{ color: 'var(--muted)' }}
              aria-label="Open menu"
            >
              <Bars width={18} height={18} />
            </button>
            <span
              className="text-sm font-semibold hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {tenantName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="Notifications"
            >
              <Bell width={18} height={18} />
            </NavLink>
            <span className="text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
