const tapeColors = {
  yellow: 'bg-tape-yellow',
  mint: 'bg-tape-mint',
  coral: 'bg-tape-coral',
};

export default function Card({
  tape,
  className = '',
  children,
  ...rest
}) {
  const tapeCls = tape ? tapeColors[tape] : null;
  return (
    <div
      className={`relative bg-paper-card border border-paper-line rounded-paper shadow-paper p-5 ${className}`}
      {...rest}
    >
      {tapeCls && (
        <span
          aria-hidden
          className={`absolute -top-2 left-6 h-4 w-20 ${tapeCls} opacity-85 -rotate-3 rounded-sm shadow-sm`}
        />
      )}
      {children}
    </div>
  );
}
