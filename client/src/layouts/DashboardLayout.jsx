import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Logo from '../components/ui/Logo';
import HelpDrawer       from '../components/ui/HelpDrawer';
import FirstTimeOverlay from '../components/ui/FirstTimeOverlay';
import {
  LayoutDashboard, School, Users, CheckSquare, Wallet,
  NotebookPen, ClipboardCheck, Send, KeyRound, LogOut, ChevronLeft,
  ChevronRight, Menu, AlertTriangle, ArrowRight, HelpCircle, Users2,
  BookOpen, UserCircle, Building2, Layers, Calendar, Lock,
} from 'lucide-react';

const ICON_SIZE = 'w-[18px] h-[18px]';

const NAV_SUPER_ADMIN = [
  { to: '/super-admin',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/schools', icon: School,          label: 'Schools' },
  { to: '/super-admin/profile', icon: UserCircle,      label: 'My Profile' },
];

const FEATURE_NAV_MAP = {
  '/admin/students':        'students',
  '/admin/subjects':        'subjects',
  '/admin/classes':         'classes',
  '/admin/attendance':      'attendance',
  '/admin/fees':            'fees',
  '/admin/grades':          'grades',
  '/admin/results':         'grades',
  '/admin/terms':           'terms',
  '/admin/communications':  'email',
  '/staff/attendance':      'attendance',
  '/staff/grades':          'grades',
  '/staff/subjects':        'subjects',
};

const NAV_SCHOOL_ADMIN = [
  { to: '/admin',                icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/students',       icon: Users,           label: 'Students' },
  { to: '/admin/staff',          icon: Users2,          label: 'Staff' },
  { to: '/admin/subjects',       icon: BookOpen,        label: 'Subjects' },
  { to: '/admin/classes',        icon: Layers,          label: 'Classes' },
  { to: '/admin/attendance',     icon: CheckSquare,     label: 'Attendance' },
  { to: '/admin/fees',           icon: Wallet,          label: 'Fees' },
  { to: '/admin/grades',         icon: NotebookPen,     label: 'Grades' },
  { to: '/admin/results',        icon: ClipboardCheck,  label: 'Publish Results' },
  { to: '/admin/terms',          icon: Calendar,        label: 'Terms' },
  { to: '/admin/communications', icon: Send,            label: 'Communications' },
  { to: '/admin/subscription',   icon: KeyRound,        label: 'Subscription' },
  { to: '/admin/profile',        icon: UserCircle,      label: 'My Profile' },
];

const NAV_STAFF = [
  { to: '/staff',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff/attendance',    icon: CheckSquare,     label: 'Mark Attendance' },
  { to: '/staff/grades',        icon: NotebookPen,     label: 'Grade Entry' },
  { to: '/staff/subjects',      icon: BookOpen,        label: 'My Subjects' },
  { to: '/staff/profile',       icon: UserCircle,      label: 'My Profile' },
];

function getNav(role, features = {}) {
  const base = role === 'SUPER_ADMIN' ? NAV_SUPER_ADMIN : role === 'SCHOOL_ADMIN' ? NAV_SCHOOL_ADMIN : NAV_STAFF;
  if (role === 'SUPER_ADMIN') return base;
  return base.map((item) => {
    const required = FEATURE_NAV_MAP[item.to];
    if (!required) return item;
    if (features[required] === false) {
      return { ...item, locked: true };
    }
    return item;
  });
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function DashboardLayout() {
  const { user, logout }         = useAuth();
  const navigate                  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const [helpOpen, setHelpOpen]   = useState(false);

  const nav = getNav(user?.role, user?.features);

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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden animate-fade-in"
             onClick={() => setMobile(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 flex flex-col h-full transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-16' : 'w-60'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <Logo size={36} className="flex-shrink-0 shadow-glow-blue rounded-xl" />
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="font-extrabold text-white text-base leading-none">Akademia</div>
              <div className="text-xs text-slate-400 mt-0.5">{roleLabel}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {nav.map((item, i) => {
            const Icon = item.locked ? Lock : item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.locked ? '#' : item.to}
                end={item.to.split('/').length <= 2}
                className={({ isActive }) => `nav-item group ${isActive ? 'active' : ''} ${item.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={(e) => { if (item.locked) { e.preventDefault(); toast.error(`${item.label} is not included in your current subscription. Contact the platform administrator.`); } else setMobile(false); }}
              >
                <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Icon className={ICON_SIZE} />
                </span>
                {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
              </NavLink>
            );
          })}
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
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl
                       text-slate-500 hover:text-white hover:bg-white/10
                       transition-all duration-200 text-sm"
          >
            {collapsed
              ? <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" />
              : <ChevronLeft  className="w-[18px] h-[18px] flex-shrink-0" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
          <button className="md:hidden text-slate-600 hover:text-slate-900 p-1" onClick={() => setMobile(!mobileOpen)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 min-w-0 flex flex-col">
            <BreadCrumb />
            {/* School name shown for admin and staff */}
            {user?.tenantName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 font-medium truncate">{user.tenantName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-slate-100 hover:bg-brand-50 hover:text-brand-700
                         text-slate-500 text-xs font-semibold transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </button>
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

        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <FirstTimeOverlay />
    </div>
  );
}

function BreadCrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const label = parts[parts.length - 1] || 'Dashboard';
  const readable = label.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  return <h1 className="text-lg font-bold text-slate-800 truncate">{readable}</h1>;
}
