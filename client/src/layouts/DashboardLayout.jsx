import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_SUPER_ADMIN = [
  { to: '/super-admin',         icon: '🏛️',  label: 'Dashboard' },
  { to: '/super-admin/schools', icon: '🏫',  label: 'Schools' },
];

const NAV_SCHOOL_ADMIN = [
  { to: '/admin',               icon: '📊',  label: 'Dashboard' },
  { to: '/admin/students',      icon: '👨‍🎓', label: 'Students' },
  { to: '/admin/attendance',    icon: '✅',  label: 'Attendance' },
  { to: '/admin/fees',          icon: '💰',  label: 'Fees' },
  { to: '/admin/grades',        icon: '📝',  label: 'Grades' },
  { to: '/admin/results',       icon: '📋',  label: 'Publish Results' },
  { to: '/admin/communications',icon: '📨',  label: 'Communications' },
  { to: '/admin/subscription',  icon: '🔑',  label: 'Subscription' },
];

const NAV_STAFF = [
  { to: '/staff',               icon: '📊',  label: 'Dashboard' },
  { to: '/staff/attendance',    icon: '✅',  label: 'Mark Attendance' },
  { to: '/staff/grades',        icon: '📝',  label: 'Grade Entry' },
];

function getNav(role) {
  if (role === 'SUPER_ADMIN')  return NAV_SUPER_ADMIN;
  if (role === 'SCHOOL_ADMIN') return NAV_SCHOOL_ADMIN;
  if (role === 'STAFF')        return NAV_STAFF;
  return [];
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function DashboardLayout() {
  const { user, logout }          = useAuth();
  const navigate                   = useNavigate();
  const location                   = useLocation();
  const [collapsed, setCollapsed]  = useState(false);
  const [mobileOpen, setMobile]    = useState(false);
  const [subWarn, setSubWarn]      = useState(null);

  const nav = getNav(user?.role);

  // jQuery: pulse the active nav item on route change
  useEffect(() => {
    const $ = window.$;
    if (!$) return;
    $('.nav-item.active').addClass('scale-105').delay(200).queue(function (next) {
      $(this).removeClass('scale-105');
      next();
    });
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const roleLabel = {
    SUPER_ADMIN:  'Super Admin',
    SCHOOL_ADMIN: 'School Admin',
    STAFF:        'Staff',
  }[user?.role] || '';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden animate-fade-in"
          onClick={() => setMobile(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:relative z-30 flex flex-col h-full
                    transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-16' : 'w-60'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10
                          ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br
                          from-brand-600 to-brand-800 flex items-center justify-center
                          shadow-glow-blue">
            <span className="text-lg">🎓</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="font-extrabold text-white text-base leading-none">Akademia</div>
              <div className="text-xs text-slate-400 mt-0.5">{roleLabel}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {nav.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              className={({ isActive }) =>
                `nav-item group ${isActive ? 'active' : ''}`
              }
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setMobile(false)}
            >
              <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600
                              flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {initials(user?.fullName)}
              </div>
              <div className="overflow-hidden animate-fade-in">
                <div className="text-sm font-semibold text-white truncate">{user?.fullName}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-400 hover:text-red-400 hover:bg-red-900/20
                       transition-all duration-200 text-sm font-medium"
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-500 hover:text-white hover:bg-white/10
                       transition-all duration-200 text-sm"
          >
            <span className="text-base flex-shrink-0">{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900 p-1"
            onClick={() => setMobile(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title from breadcrumb */}
          <div className="flex-1 min-w-0">
            <BreadCrumb />
          </div>

          {/* User chip */}
          <div className="flex items-center gap-3">
            {subWarn && (
              <span className="badge-expired text-xs hidden sm:inline-flex gap-1 items-center">
                ⚠️ Grace Period
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800
                              flex items-center justify-center text-xs font-bold text-white">
                {initials(user?.fullName)}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-none">{user?.fullName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{roleLabel}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Subscription warning banner */}
        {subWarn && (
          <div className="sub-warning mx-6 mt-4 animate-fade-in-down">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>Subscription Grace Period:</strong> Your subscription has expired.
              You have {subWarn} days remaining before access is locked.
              <a href="/admin/subscription" className="ml-2 underline font-semibold hover:text-amber-900">Renew now →</a>
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function BreadCrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const label = parts[parts.length - 1] || 'Dashboard';
  const readable = label
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
  return <h1 className="text-lg font-bold text-slate-800 truncate">{readable}</h1>;
}
