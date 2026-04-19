import Footer from './Footer.jsx';

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper-bg text-ink-primary">
      <header className="px-6 pt-10 pb-6 max-w-3xl w-full mx-auto">
        {title && (
          <h1 className="font-hand text-4xl text-ink-primary leading-none">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-2 text-sm text-ink-secondary">{subtitle}</p>
        )}
      </header>
      <main className="flex-1 px-6 pb-10 max-w-3xl w-full mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
