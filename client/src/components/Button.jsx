/**
 * Button — reusable button component
 *
 * Variants:  primary | secondary | outline | indigo-outline | ghost | raw (no variant classes)
 * Sizes:     sm (h-9) | md (h-12, default) | lg (h-14) | raw (no size/structural classes)
 * Props:     loading, fullWidth, icon (before), iconAfter (after)
 *
 * Use size="raw" variant="raw" for fully-custom buttons (nav items, toggles, accordions)
 * — only rounded-2xl, focus ring, and disabled states are enforced.
 */
export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  icon,
  iconAfter,
  children,
  className = '',
  disabled,
  type      = 'button',
  ...props
}) {
  // Always applied — border-radius, focus, disabled
  const always = [
    'rounded-2xl transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  // Only applied when size !== 'raw'
  const structural = size !== 'raw' ? [
    'inline-flex items-center justify-center gap-2',
    'font-semibold whitespace-nowrap select-none shrink-0',
    fullWidth ? 'w-full' : '',
  ].filter(Boolean).join(' ') : '';

  const sizes = {
    sm:   'h-9 px-3.5 text-xs',
    md:   'h-12 px-5 text-sm',
    lg:   'h-14 px-7 text-base',
    icon: 'h-12 w-12',
    raw:  '',
  };

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white',
    secondary:
      'bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 active:bg-gray-800 dark:active:bg-gray-200 text-white dark:text-gray-900',
    outline:
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    'indigo-outline':
      'bg-transparent border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    ghost:
      'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
    raw: '',
  };

  const spinner = (
    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        always,
        structural,
        sizes[size] ?? '',
        variants[variant] ?? '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <>{spinner}{children}</>
      ) : (
        <>{icon}{children}{iconAfter}</>
      )}
    </button>
  );
}
