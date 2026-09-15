import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  Users, Wallet, NotebookPen, Send,
} from 'lucide-react';

// Floating particles data (left panel only)
const PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  size: 4 + Math.random() * 20,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#3b82f6' : '#a78bfa',
}));

const FEATURES = [
  { Icon: Users,       label: 'Students & Attendance', sub: 'One roster across Primary, JHS and SHS' },
  { Icon: Wallet,      label: 'Fees & Result Intercept', sub: 'Report cards withheld automatically until fees clear' },
  { Icon: NotebookPen, label: 'Grading & Report Cards', sub: 'CA + exam aggregation, finalized once and locked' },
  { Icon: Send,        label: 'Parent Communications', sub: 'Email and SMS notices sent the moment results publish' },
];

function getRoleDashboard(role) {
  if (role === 'SUPER_ADMIN')  return '/super-admin';
  if (role === 'SCHOOL_ADMIN') return '/admin';
  if (role === 'STAFF')        return '/staff';
  return '/login';
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate         = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPass]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [slowServer, setSlow]   = useState(false);
  const [shake, setShake]       = useState(false);
  const [showPass, setShow]     = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    if (user) navigate(getRoleDashboard(user.role), { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      setShake(true); setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    setSlow(false);
    // If the server takes more than 5 s, show a "waking up" hint
    const slowTimer = setTimeout(() => setSlow(true), 5000);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}!`);
      setTimeout(() => navigate(getRoleDashboard(u.role), { replace: true }), 500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      toast.error(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left: brand / marketing panel (hidden on small screens) ── */}
      <div
        className="hidden lg:flex lg:w-[55%] xl:w-3/5 relative overflow-hidden flex-col justify-between p-12 xl:p-16"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e3a5f 80%, #172554 100%)' }}
      >
        <div className="particles-bg">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                width: p.size, height: p.size, left: `${p.x}%`, background: p.color,
                animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full opacity-10 animate-float"
             style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 animate-float-delay"
             style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <Logo size={48} showText={true} dark={true} />
        </div>

        {/* Headline + features */}
        <div className="relative z-10 max-w-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Run your whole school<br />from one clean system.
          </h1>
          <p className="text-slate-400 text-base mb-10">
            Attendance, fees, grading, and result publishing for Primary, JHS and SHS.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ Icon, label, sub }, i) => (
              <div key={label} className="flex items-start gap-4 animate-fade-in-up"
                   style={{ animationDelay: `${180 + i * 90}ms` }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/10
                                flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-slate-400 text-sm">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-600">
          Akademia 1.0 · Multi-tenant School Management
        </p>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 bg-white">
        <div className={`w-full max-w-sm transition-all duration-700
                         ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                         ${shake ? 'animate-shake' : ''}`}>

          {/* Mobile-only brand */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Logo size={40} showText={true} dark={false} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
             <p className="text-slate-500 text-sm mt-1">Sign in to your school's dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-10"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-10 pr-11"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>

            {slowServer && (
              <p className="text-xs text-center text-amber-600 mt-2 animate-pulse">
                ⏳ Server is waking up — this can take up to 30 seconds on the first sign-in…
              </p>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p
              style={{ color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'none' }}
              onMouseOver={(e) => { e.target.style.textDecoration = 'underline'; }}
              onMouseOut={(e) => { e.target.style.textDecoration = 'none'; }}
              onClick={() => { window.location.href = '/forgot-password'; }}
            >
              Forgot your password?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
