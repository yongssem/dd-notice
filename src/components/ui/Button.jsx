const base =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-paper shadow-paper ' +
  'font-sans text-base font-semibold select-none transition-transform ' +
  'active:translate-y-[1px] active:shadow-none';

const variants = {
  primary:
    'bg-ink-accent text-paper-card border border-ink-accent hover:brightness-105',
  secondary:
    'bg-paper-card text-ink-primary border border-paper-line hover:bg-paper-bg',
};

export default function Button({
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  onClick,
  type = 'button',
  ...rest
}) {
  const disabledCls = disabled ? 'opacity-50 pointer-events-none' : '';
  const v = variants[variant] ?? variants.primary;
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={`${base} ${v} ${disabledCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
