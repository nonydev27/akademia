import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentsApi }     from '../../api/students';
import { feesApi }         from '../../api/fees';
import { subscriptionsApi } from '../../api/subscriptions';
import StatCard    from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import {
  AlertTriangle, Users, Wallet, BarChart3, CalendarDays,
  UserPlus, ClipboardCheck, CheckSquare, PartyPopper, ArrowRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [stats, setStats]       = useState({ students: 0, outstanding: 0, overdueCount: 0 });
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [studRes, outRes, subRes] = await Promise.allSettled([
          studentsApi.list({ pageSize: 1 }),
          feesApi.outstanding(),
          subscriptionsApi.status(),
        ]);

        const total = studRes.status === 'fulfilled' ? studRes.value.data.total : 0;
        const outData = outRes.status === 'fulfilled' ? outRes.value.data.students : [];
        const outstanding = outData.reduce((s, o) => s + o.balance, 0);
        setStats({ students: total, outstanding, overdueCount: outData.length });
        if (subRes.status === 'fulfilled') setSubStatus(subRes.value.data);
      } catch {/* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const daysLeft = subStatus?.daysRemaining;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-6 bg-gradient-to-r from-brand-800 to-brand-900 text-white animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">
              Good day, {user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-brand-200 text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {subStatus && (
            <div className={`px-4 py-2 rounded-xl text-sm font-semibold
              ${subStatus.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-200' :
                subStatus.status === 'EXPIRED_IN_GRACE' ? 'bg-amber-500/20 text-amber-200 animate-pulse-slow' :
                'bg-red-500/20 text-red-200'}`}>
              <StatusBadge status={subStatus.status} />
              {daysLeft != null && daysLeft > 0 && (
                <span className="ml-2 opacity-80">{daysLeft}d left</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Grace Warning */}
      {subStatus?.status === 'EXPIRED_IN_GRACE' && (
        <div className="sub-warning animate-fade-in-down">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <strong>Your subscription is in grace period.</strong>{' '}
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining before access is locked.
            <button className="ml-2 underline font-bold hover:text-amber-900 inline-flex items-center gap-1"
                    onClick={() => navigate('/admin/subscription')}>Renew now <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={<Users />} label="Total Students"     value={stats.students}     color="blue"   loading={loading} />
        <StatCard icon={<Wallet />} label="Outstanding Fees (GHS)" value={`GHS ${stats.outstanding.toFixed(0)}`} color="red" loading={loading} />
        <StatCard icon={<BarChart3 />} label="Students with Balance" value={stats.overdueCount}  color="gold"   loading={loading} />
        <StatCard icon={<CalendarDays />} label="Today's Date"
          value={new Date().getDate()} sub={new Date().toLocaleString('default',{month:'long',year:'numeric'})}
          color="purple" loading={loading} />
      </div>

      {/* Quick Actions */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <UserPlus className="w-6 h-6" />,      label: 'Add Student',       to: '/admin/students',  variant: 'primary' },
            { icon: <Wallet className="w-6 h-6" />,        label: 'Record Payment',     to: '/admin/fees',       variant: 'accent' },
            { icon: <ClipboardCheck className="w-6 h-6" />,label: 'Publish Results',    to: '/admin/results',    variant: 'secondary' },
            { icon: <CheckSquare className="w-6 h-6" />,   label: 'View Attendance',    to: '/admin/attendance', variant: 'secondary' },
          ].map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl text-sm font-semibold
                          transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95
                          ${a.variant === 'primary' ? 'bg-brand-800 text-white hover:bg-brand-700' :
                            a.variant === 'accent'  ? 'bg-accent-500 text-white hover:bg-accent-600' :
                            'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outstanding Fees Preview */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Students with Outstanding Fees</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/fees')}>View All <ArrowRight className="w-3.5 h-3.5" /></Button>
        </div>
        <OutstandingPreview />
      </div>
    </div>
  );
}

function OutstandingPreview() {
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi.outstanding()
      .then((r) => setData(r.data.students.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-2 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
    </div>
  );

  if (!data.length) return (
    <div className="flex flex-col items-center py-8 text-slate-400">
      <PartyPopper className="w-10 h-10 mb-3" />
      <p className="text-sm">All fees are cleared!</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.student.id}
             className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50
                        hover:bg-slate-100 transition-colors duration-150"
             style={{ animationDelay: `${i * 50}ms` }}>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{item.student.fullName}</div>
            <div className="text-xs text-slate-400">{item.student.admissionNumber}</div>
          </div>
          <span className="font-bold text-red-600 text-sm">GHS {item.balance.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
