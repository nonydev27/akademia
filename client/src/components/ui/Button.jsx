import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = '',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    const ripple = {
      id,
      x: e.clientX - rect.left - 20,
      y: e.clientY - rect.top - 20,
    };
    setRipples((r) => [...r, ripple]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
    onClick?.(e);
  };

  const variantMap = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
    accent:    'btn-accent',
    outline:   'btn-outline',
  };
  const sizeMap = { sm: 'btn-sm', lg: 'btn-lg', xl: 'btn-xl', '': '' };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`ripple-container ${variantMap[variant] || 'btn-primary'} ${sizeMap[size] || ''} ${className}`}
      {...props}
    >
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: 40, height: 40 }} />
      ))}
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
}
