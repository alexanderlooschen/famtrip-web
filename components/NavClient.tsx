// components/NavClient.tsx
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function NavClient() {
  const { profil, session, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOffen, setMenuOffen] = useState(false);
  const [mobileOffen, setMobileOffen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setMenuOffen(false);
  };

  const navLinks = [
    { href: '/entdecken', label: 'Entdecken' },
    { href: '/karte', label: 'Karte' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl text-emerald-600 hover:text-emerald-700 transition-colors">
          🗺️ <span>FamTrip</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <a href="/reise/neu"
                className="hidden sm:flex items-center gap-1 btn-primary text-sm">
                + Reise
              </a>
              <div className="relative">
                <button onClick={() => setMenuOffen(o => !o)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 border-2 border-emerald-200">
                    {profil?.name?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block font-medium">{profil?.name?.split(' ')[0]}</span>
                  <span className="text-gray-400 text-xs">▾</span>
                </button>
                {menuOffen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-sm font-medium text-gray-900">{profil?.name}</p>
                      <p className="text-xs text-gray-400">{profil?.wohnort ?? 'Kein Wohnort'}</p>
                    </div>
                    <a href="/profil" onClick={() => setMenuOffen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      👤 Mein Profil
                    </a>
                    <a href="/reise/neu" onClick={() => setMenuOffen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      ➕ Neue Reise
                    </a>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a href="/login" className="text-sm text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-xl transition-colors font-medium">
                Anmelden
              </a>
              <a href="/registrieren" className="btn-primary text-sm hidden sm:block">
                Registrieren
              </a>
            </>
          )}

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileOffen(o => !o)}
            className="sm:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-600">
            {mobileOffen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOffen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              {l.label}
            </a>
          ))}
          {session ? (
            <a href="/reise/neu" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50">
              + Neue Reise
            </a>
          ) : (
            <a href="/registrieren" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50">
              Kostenlos registrieren
            </a>
          )}
        </div>
      )}
    </header>
  );
}
