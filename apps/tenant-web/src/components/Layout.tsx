import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { SubscriptionBanner } from './SubscriptionBanner';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/invoices', label: 'Invoices', icon: '📄' },
  { to: '/estimates', label: 'Estimates', icon: '📋' },
  { to: '/bills', label: 'Bills', icon: '🧾' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/customers', label: 'Customers', icon: '👤' },
  { to: '/merchants', label: 'Merchants', icon: '🏪' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/people', label: 'People', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/security', label: 'Security', icon: '🔒' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

export function Layout() {
  const { user, tenantName, logoUrl, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          {logoUrl && <img src={logoUrl} alt="logo" className="w-8 h-8 object-contain rounded" />}
          {!collapsed && (
            <span className="font-bold text-gray-900 truncate">{tenantName}</span>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="ml-auto text-gray-400 hover:text-gray-600">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-4">
          {!collapsed && user && (
            <div className="text-xs text-gray-500 mb-2 truncate">{user.firstName} {user.lastName}</div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
            title="Logout"
          >
            <span>🚪</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <SubscriptionBanner />
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold text-gray-800">
            {tenantName}
          </h1>
          <div className="flex items-center gap-4">
            <NavLink to="/notifications" className="text-gray-500 hover:text-gray-800">🔔</NavLink>
            <span className="text-sm text-gray-600">
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
