import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import ProtectedRoute    from './routes/ProtectedRoute';
import DashboardLayout   from './layouts/DashboardLayout';
import Login             from './pages/Auth/Login';
import ForgotPassword   from './pages/Auth/ForgotPassword';
import ResetPassword    from './pages/Auth/ResetPassword';
import NotFound         from './pages/NotFound';

// Super Admin
import TenantsDashboard  from './pages/SuperAdmin/TenantsDashboard';
import TenantDetail      from './pages/SuperAdmin/TenantDetail';
import SuperAdminProfile from './pages/SchoolAdmin/Profile';

// School Admin
import AdminDashboard    from './pages/SchoolAdmin/AdminDashboard';
import Students          from './pages/SchoolAdmin/Students';
import AdminAttendance   from './pages/SchoolAdmin/Attendance';
import Fees              from './pages/SchoolAdmin/Fees';
import Grades          from './pages/SchoolAdmin/Grades';
import PublishResults  from './pages/SchoolAdmin/PublishResults';
import Terms           from './pages/SchoolAdmin/Terms';
import Communications    from './pages/SchoolAdmin/Communications';
import Subscription      from './pages/SchoolAdmin/Subscription';
import StaffManagement   from './pages/SchoolAdmin/StaffManagement';
import Subjects          from './pages/SchoolAdmin/Subjects';
import Classes           from './pages/SchoolAdmin/Classes';
import AdminProfile      from './pages/SchoolAdmin/Profile';

// Staff
import StaffDashboard    from './pages/Staff/StaffDashboard';
import StaffAttendance   from './pages/Staff/Attendance';
import GradeEntry        from './pages/Staff/GradeEntry';
import MySubjects        from './pages/Staff/MySubjects';
import StaffProfile      from './pages/Staff/Profile';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)                        return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN')  return <Navigate to="/super-admin" replace />;
  if (user.role === 'SCHOOL_ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'STAFF')        return <Navigate to="/staff" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Super Admin */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/super-admin"             element={<TenantsDashboard />} />
          <Route path="/super-admin/schools"     element={<TenantsDashboard />} />
          <Route path="/super-admin/schools/:id" element={<TenantDetail />} />
          <Route path="/super-admin/profile"     element={<SuperAdminProfile />} />
        </Route>
      </Route>

      {/* School Admin */}
      <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin"                element={<AdminDashboard />} />
          <Route path="/admin/students"       element={<Students />} />
          <Route path="/admin/staff"          element={<StaffManagement />} />
          <Route path="/admin/subjects"       element={<Subjects />} />
          <Route path="/admin/classes"        element={<Classes />} />
          <Route path="/admin/attendance"     element={<AdminAttendance />} />
          <Route path="/admin/fees"           element={<Fees />} />
          <Route path="/admin/grades"         element={<Grades />} />
          <Route path="/admin/results"        element={<PublishResults />} />
          <Route path="/admin/terms"          element={<Terms />} />
          <Route path="/admin/communications" element={<Communications />} />
          <Route path="/admin/subscription"   element={<Subscription />} />
          <Route path="/admin/profile"        element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Staff */}
      <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/staff"            element={<StaffDashboard />} />
          <Route path="/staff/attendance" element={<StaffAttendance />} />
          <Route path="/staff/grades"     element={<GradeEntry />} />
          <Route path="/staff/subjects"   element={<MySubjects />} />
          <Route path="/staff/profile"    element={<StaffProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
