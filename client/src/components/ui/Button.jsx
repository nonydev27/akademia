import { useEffect, useRef } from 'react';

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
  const btnRef = useRef(null);

  // jQuery ripple effect
  useEffect(() => {
    const $ = window.$;
    if (!$ || !btnRef.current) return;
    const el = $(btnRef.current);
    const handler = function (e) {
      const offset = el.offset();
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;
      const ripple = $('<span class="ripple"></span>').css({
        left: x - 20, top: y - 20, width: 40, height: 40,
      });
      el.append(ripple);
      setTimeout(() => ripple.remove(), 700);
    };
    el.on('click', handler);
    return () => el.off('click', handler);
  }, []);

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
      ref={btnRef}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`ripple-container ${variantMap[variant] || 'btn-primary'} ${sizeMap[size] || ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
