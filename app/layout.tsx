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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <NavClient />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-200 mt-20 py-10 text-center text-sm text-gray-400">
            <p>© 2025 FamTrip · <a href="https://famtrip.looschen.net" className="hover:text-teal-600">famtrip.looschen.net</a></p>
            <p className="mt-1">Community-Plattform für selbstorganisierte Familienreisen</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
