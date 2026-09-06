import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setVal(target); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setVal(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return val;
}

export default function StatCard({ icon, label, value, sub, color = 'blue', loading = false }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const animated     = useCountUp(isNaN(numericValue) ? 0 : numericValue);

  const colorMap = {
    blue:   'from-blue-500 to-indigo-600',
    green:  'from-emerald-500 to-teal-600',
    gold:   'from-amber-400 to-orange-500',
    red:    'from-red-500 to-rose-600',
    purple: 'from-violet-500 to-purple-600',
  };
  const grad = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="skeleton h-10 w-10 rounded-xl mb-3" />
        <div className="skeleton h-4 w-24 mb-2" />
        <div className="skeleton h-7 w-16" />
      </div>
    );
  }

  return (
    <div className="card p-5 animate-fade-in-up group cursor-default
                    hover:-translate-y-1 transition-all duration-300">
      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-11 h-11
                        rounded-xl bg-gradient-to-br ${grad} mb-4
                        shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <span className="text-xl">{icon}</span>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
        {typeof value === 'string' && value.startsWith('GHS')
          ? `GHS ${isNaN(numericValue) ? 0 : animated.toLocaleString()}`
          : typeof value === 'number'
          ? animated.toLocaleString()
          : value}
      </div>

      {/* Label */}
      <div className="text-sm text-slate-500 font-medium">{label}</div>

      {/* Sub */}
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
