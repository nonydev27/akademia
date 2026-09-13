import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function NotFound() {
  const [count, setCount] = useState(404);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => (c > 0 ? c - 1 : 404));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 overflow-hidden">
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="relative">
          <div className="text-[8rem] sm:text-[10rem] font-black leading-none select-none"
               style={{
                 background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #60a5fa)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 animation: 'countPulse 1s ease-in-out infinite alternate',
               }}>
            {count}
          </div>
          <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
            <span className="text-lg sm:text-xl">🔍</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Page not found
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            We looked everywhere but this page took a day off.
            Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="pt-4">
          <Logo size={36} className="opacity-40 mx-auto" />
        </div>
      </div>

      <style>{`
        @keyframes countPulse {
          from { transform: scale(1); opacity: 1; }
          to   { transform: scale(1.04); opacity: 0.85; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
