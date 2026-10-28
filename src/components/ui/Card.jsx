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
      className={`ink-card relative bg-paper-card p-5 ${className}`}
      {...rest}
    >
      {tapeCls && (
        <span
          aria-hidden
          className={`card-accent ${tapeCls}`}
        />
      )}
      {children}
    </div>
  );
}
