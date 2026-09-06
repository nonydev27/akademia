import { useState, useRef, useEffect } from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  id,
  className = '',
  shake = false,
  ...props
}) {
  const [focused, setFocused]   = useState(false);
  const inputRef                = useRef(null);

  // jQuery glow on focus
  useEffect(() => {
    const $ = window.$;
    if (!$ || !inputRef.current) return;
    const el = $(inputRef.current);
    const onFocus = () => {
      el.closest('.input-wrap').find('.input-label').addClass('text-brand-600');
    };
    const onBlur = () => {
      el.closest('.input-wrap').find('.input-label').removeClass('text-brand-600');
    };
    el.on('focus', onFocus).on('blur', onBlur);
    return () => el.off('focus', onFocus).off('blur', onBlur);
  }, []);

  return (
    <div className={`input-wrap flex flex-col gap-1 ${shake ? 'animate-shake' : ''}`}>
      {label && (
        <label
          className={`input-label label transition-colors duration-200`}
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type={type}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-0.5 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
