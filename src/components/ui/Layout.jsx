import Footer from './Footer.jsx';

export default function Layout({ title, subtitle, children, wide = false, actions }) {
  return (
    <div className={`app-shell min-h-screen flex flex-col bg-paper-bg text-ink-primary ${wide ? 'app-shell-wide' : ''}`}>
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none"><path d="M7 9h18v18H7zM11 5v8M21 5v8M7 15h18M11 20h4M11 24h9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            {title && <h1 className="app-title">{title}</h1>}
            {subtitle && <p className="app-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </header>
      <main className="app-main flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
