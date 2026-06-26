import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/auth';

const NAV = [
  { to: '/admin/overview', label: 'Overview', icon: '📊' },
  { to: '/admin/tenants', label: 'Tenants', icon: '🏢' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
];

export function Layout() {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-56 flex flex-col bg-white border-r border-gray-200">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="font-bold text-indigo-700">Officing Admin</p>
          <p className="text-xs text-gray-500 mt-0.5">Platform Control</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4">
          {admin && <p className="text-xs text-gray-500 mb-2 truncate">{admin.email}</p>}
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-2">
            🚪 Logout
          </button>
        </div>
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold text-gray-800">Platform Administration</h1>
          {admin && <span className="text-sm text-gray-600 capitalize">{admin.role}</span>}
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
