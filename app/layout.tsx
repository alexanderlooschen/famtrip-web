// app/layout.tsx
import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import NavClient from '../components/NavClient';
import './globals.css';

export const metadata: Metadata = {
  title: 'FamTrip – Familienreisen dokumentieren & teilen',
  description: 'Entdecke und teile selbstorganisierte Familienreisen mit Kindern.',
  metadataBase: new URL('https://famtrip.looschen.net'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <NavClient />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t border-gray-100 mt-20">
            <div className="max-w-5xl mx-auto px-6 py-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  🗺️ FamTrip
                </div>
                <nav className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <a href="/entdecken" className="hover:text-emerald-600 transition-colors">Entdecken</a>
                  <a href="/karte" className="hover:text-emerald-600 transition-colors">Karte</a>
                  <a href="/impressum" className="hover:text-emerald-600 transition-colors">Impressum</a>
                  <a href="/datenschutz" className="hover:text-emerald-600 transition-colors">Datenschutz</a>
                </nav>
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} FamTrip · famtrip.looschen.net
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
