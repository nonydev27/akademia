import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Floating particles data
const PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  size: 4 + Math.random() * 20,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#3b82f6' : '#a78bfa',
}));

function getRoleDashboard(role) {
  if (role === 'SUPER_ADMIN')  return '/super-admin';
  if (role === 'SCHOOL_ADMIN') return '/admin';
  if (role === 'STAFF')        return '/staff';
  return '/login';
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate         = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);
  const [showPass, setShow]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef(null);

  // Stagger entrance
  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate(getRoleDashboard(user.role), { replace: true });
  }, [user, navigate]);

  // jQuery: floating label enhancement
  useEffect(() => {
    const $ = window.$;
    if (!$) return;
    $('.login-input').on('focus', function () {
      $(this).parent().find('.field-line').css({ width: '100%', transition: 'width 0.3s ease' });
    }).on('blur', function () {
      if (!$(this).val()) {
        $(this).parent().find('.field-line').css({ width: '0%' });
      }
    });
    return () => $('.login-input').off('focus blur');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      setShake(true); setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}! 👋`);
      // Brief success animation before redirect
      setTimeout(() => navigate(getRoleDashboard(u.role), { replace: true }), 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      // jQuery shake
      const $ = window.$;
      if ($) {
        $(formRef.current).css({ animation: 'none' });
        setTimeout(() => $(formRef.current).css({ animation: 'shake 0.5s ease-in-out' }), 10);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e3a5f 80%, #172554 100%)' }}>

      {/* ── Animated Particles ── */}
      <div className="particles-bg">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width:  p.size,
              height: p.size,
              left:   `${p.x}%`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay:    `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Glow orbs ── */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full opacity-10 animate-float"
           style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 animate-float-delay"
           style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 animate-spin-slow"
           style={{ background: 'conic-gradient(from 0deg, #3b82f6, #a78bfa, #f59e0b, #3b82f6)' }} />

      {/* ── Login Card ── */}
      <div
        ref={formRef}
        className={`relative z-10 w-full max-w-md mx-4 glass-panel p-8 sm:p-10
                    transition-all duration-700
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    ${shake ? 'animate-shake' : ''}`}
      >
        {/* Logo */}
        <div className={`text-center mb-8 transition-all duration-700 delay-100
                         ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                          bg-gradient-to-br from-brand-600 to-brand-800
                          shadow-glow-blue animate-glow">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
            Akademia
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">
            Simplifying School Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className={`transition-all duration-700 delay-200
                           ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">✉️</span>
              <input
                className="login-input w-full bg-white/10 border border-white/10 text-white
                           rounded-xl px-4 py-3 pl-10 text-sm placeholder-slate-500
                           focus:outline-none focus:border-brand-400 focus:bg-white/15
                           transition-all duration-300"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className="field-line absolute bottom-0 left-0 h-0.5 bg-brand-400 rounded w-0" />
            </div>
          </div>

          {/* Password */}
          <div className={`transition-all duration-700 delay-300
                           ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔒</span>
              <input
                className="login-input w-full bg-white/10 border border-white/10 text-white
                           rounded-xl px-4 py-3 pl-10 pr-12 text-sm placeholder-slate-500
                           focus:outline-none focus:border-brand-400 focus:bg-white/15
                           transition-all duration-300"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white
                           transition-colors duration-200 text-sm"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
              <div className="field-line absolute bottom-0 left-0 h-0.5 bg-brand-400 rounded w-0" />
            </div>
          </div>

          {/* Submit */}
          <div className={`transition-all duration-700 delay-[400ms]
                           ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              type="submit"
              disabled={loading}
              className="ripple-container w-full py-3.5 rounded-xl font-bold text-sm
                         bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700
                         bg-[length:200%_100%] text-white
                         hover:bg-right-center hover:shadow-glow-blue
                         active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-300 shadow-lg
                         flex items-center justify-center gap-2"
              style={{ backgroundPosition: loading ? 'right' : 'left' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In →</>
              )}
            </button>
          </div>
        </form>

        {/* Demo hints */}
        <div className={`mt-8 pt-6 border-t border-white/10 text-center transition-all duration-700 delay-500
                         ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-widest">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Super Admin', email: 'superadmin@akademia.app', pass: 'ChangeMe123!' },
              { label: 'School Admin', email: 'admin@demoschool.app', pass: 'Admin123!' },
              { label: 'Teacher',     email: 'teacher@demoschool.app', pass: 'Staff123!' },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => { setEmail(d.email); setPass(d.pass); }}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/10
                           text-slate-400 hover:text-white text-xs
                           transition-all duration-200 active:scale-95"
              >
                <span className="text-base">{d.label === 'Super Admin' ? '🛡️' : d.label === 'School Admin' ? '🏫' : '📚'}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Akademia v1.0 · Multi-tenant School Management
        </p>
      </div>
    </div>
  );
}
