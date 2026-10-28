const base =
  'ink-button inline-flex items-center justify-center gap-2 px-4 py-2 ' +
  'font-sans text-base select-none';

const variants = {
  primary:
    'ink-button-primary bg-ink-accent text-white',
  secondary:
    'ink-button-secondary bg-paper-card text-ink-primary',
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
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={`${base} ${v} ${disabledCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
