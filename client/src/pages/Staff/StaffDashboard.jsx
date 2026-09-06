import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const actions = [
    {
      icon: '✅',
      label: 'Mark Attendance',
      sub: 'Record today\'s class attendance',
      to: '/staff/attendance',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: '📝',
      label: 'Enter Grades',
      sub: 'Submit CA and exam scores',
      to: '/staff/grades',
      gradient: 'from-brand-600 to-indigo-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-6 bg-gradient-to-r from-brand-800 to-indigo-900 text-white animate-fade-in">
        <h1 className="text-2xl font-extrabold mb-1">
          Welcome, {user?.fullName?.split(' ')[0]} 📚
        </h1>
        <p className="text-brand-200 text-sm">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid sm:grid-cols-2 gap-5 stagger-children">
        {actions.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`card p-8 text-left hover:-translate-y-2 hover:shadow-xl
                        transition-all duration-300 active:scale-95 cursor-pointer
                        bg-gradient-to-br ${a.gradient} text-white border-0 animate-fade-in-up`}
          >
            <div className="text-5xl mb-4 animate-bounce-soft">{a.icon}</div>
            <h2 className="text-xl font-extrabold mb-1">{a.label}</h2>
            <p className="text-white/70 text-sm">{a.sub}</p>
            <div className="mt-4 text-sm font-semibold opacity-80 flex items-center gap-1">
              Go now →
            </div>
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="font-bold text-slate-800 mb-3">💡 Quick Tips</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-brand-500 font-bold mt-0.5">→</span>
            Use keyboard shortcut <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">P</kbd>,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">A</kbd>,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">T</kbd> on attendance rows.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-500 font-bold mt-0.5">→</span>
            Grades are auto-aggregated: CA (30%) + Exam (70%).
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-500 font-bold mt-0.5">→</span>
            Finalized grades cannot be edited. Review carefully before finalizing.
          </li>
        </ul>
      </div>
    </div>
  );
}
