import Link from 'next/link';
import React from 'react';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-finance-900 to-finance-800 text-finance-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full border-b border-finance-700/50 px-4 sm:px-8 py-4 flex items-center justify-between bg-finance-900/80 backdrop-blur-lg shadow-sm">
        <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tighter text-accent-400 select-none">
          24bits <span className="text-finance-100">Studio</span>
        </Link>
        <nav className="flex gap-4 sm:gap-8 text-sm sm:text-base font-medium text-finance-200">
          <Link href="/audio-converter" className="hover:text-accent-400 transition-colors">Converter</Link>
          <Link href="/lyrics-formatter" className="hover:text-accent-400 transition-colors">Formatter</Link>
          <Link href="/audio-analyzer" className="hover:text-accent-400 transition-colors">Analyzer</Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-finance-400 text-xs text-center py-6 opacity-60 border-t border-finance-700/30 mt-auto">
        © {new Date().getFullYear()} 24bits Studio. Tous droits réservés.
      </footer>
    </div>
  );
}
