import { useState, useRef, useEffect, cloneElement, isValidElement } from 'react';
import { Info } from 'lucide-react';

/**
 * Tooltip — shows a help tip on hover/focus.
 *
 * Two usage modes:
 *
 * 1. Wrap any element — the tooltip attaches to whatever you wrap:
 *      <Tooltip tip="CA score is 30% of the aggregate">
 *        <input ... />
 *      </Tooltip>
 *
 * 2. Standalone icon trigger (no children) — renders an Info icon button:
 *      <Tooltip tip="This locks the grade sheet permanently" />
 *
 * Props:
 *   tip        {string}                    — tooltip text (required)
 *   position   {'top'|'bottom'|'left'|'right'} — default: 'top'
 *   delay      {number}                    — ms before showing, default 220
 *   iconSize   {number}                    — icon px size when standalone, default 15
 *   iconClass  {string}                    — extra classes on the standalone icon
 *   maxWidth   {string}                    — CSS max-width of the bubble, default '220px'
 */
export default function Tooltip({
  tip,
  children,
  position = 'top',
  delay    = 220,
  iconSize = 15,
  iconClass = '',
  maxWidth  = '220px',
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  function show() {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }
  function hide() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!tip) return children ?? null;

  // ── Position maps ──────────────────────────────────────────────────────────
  const bubblePos = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full   left-1/2 -translate-x-1/2 mt-2.5',
    left:   'right-full top-1/2  -translate-y-1/2  mr-2.5',
    right:  'left-full  top-1/2  -translate-y-1/2  ml-2.5',
  };

  // Caret (triangle) pointing back toward the anchor
  const caretPos = {
    top: `absolute top-full left-1/2 -translate-x-1/2
            border-l-[6px] border-l-transparent
            border-r-[6px] border-r-transparent
            border-t-[6px] border-t-slate-800`,
    bottom: `absolute bottom-full left-1/2 -translate-x-1/2
               border-l-[6px] border-l-transparent
               border-r-[6px] border-r-transparent
               border-b-[6px] border-b-slate-800`,
    left: `absolute left-full top-1/2 -translate-y-1/2
             border-t-[6px] border-t-transparent
             border-b-[6px] border-b-transparent
             border-l-[6px] border-l-slate-800`,
    right: `absolute right-full top-1/2 -translate-y-1/2
              border-t-[6px] border-t-transparent
              border-b-[6px] border-b-transparent
              border-r-[6px] border-r-slate-800`,
  };

  const bubble = visible ? (
    <span
      role="tooltip"
      className={`absolute z-50 pointer-events-none ${bubblePos[position]}
                  px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium
                  shadow-2xl leading-snug whitespace-normal animate-fade-in`}
      style={{ maxWidth, animationDuration: '0.1s' }}
    >
      {tip}
      <span className={caretPos[position]} />
    </span>
  ) : null;

  // ── Mode 1: wrap a child element ───────────────────────────────────────────
  if (children) {
    // If child is a React element we can inject handlers; otherwise wrap in a span
    if (isValidElement(children)) {
      return (
        <span className="relative inline-flex items-center">
          {cloneElement(children, {
            onMouseEnter: show,
            onMouseLeave: hide,
            onFocus:      show,
            onBlur:       hide,
          })}
          {bubble}
        </span>
      );
    }

    return (
      <span
        className="relative inline-block"
        onMouseEnter={show} onMouseLeave={hide}
        onFocus={show}      onBlur={hide}
      >
        {children}
        {bubble}
      </span>
    );
  }

  // ── Mode 2: standalone icon trigger ───────────────────────────────────────
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show} onMouseLeave={hide}
      onFocus={show}      onBlur={hide}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label={tip}
        className={`inline-flex items-center justify-center rounded-full
                    text-slate-400 hover:text-brand-600 transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                    ${iconClass}`}
      >
        <Info width={iconSize} height={iconSize} strokeWidth={2} />
      </button>
      {bubble}
    </span>
  );
}
