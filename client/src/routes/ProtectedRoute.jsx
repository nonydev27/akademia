import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

function getRoleDashboard(role) {
  if (role === 'SUPER_ADMIN')  return '/super-admin';
  if (role === 'SCHOOL_ADMIN') return '/admin';
  if (role === 'STAFF')        return '/staff';
  return '/login';
}

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // While session is being restored, show a minimal loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="flex flex-col items-center gap-4">
          <Logo size={48} className="animate-bounce-soft rounded-2xl" />
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → login
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return <Outlet />;
}
