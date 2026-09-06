import { useState } from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  id,
  className = '',
  shake = false,
  onFocus,
  onBlur,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`input-wrap flex flex-col gap-1 ${shake ? 'animate-shake' : ''}`}>
      {label && (
        <label
          className={`input-label label transition-colors duration-200 ${focused ? 'text-brand-600' : ''}`}
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-0.5 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
