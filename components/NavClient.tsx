// components/NavClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function NavClient() {
  const { profil, session, signOut } = useAuth();
  const router = useRouter();
  const [menuOffen, setMenuOffen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setMenuOffen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-semibold text-lg text-teal-600 hover:text-teal-700">
          🗺️ FamTrip
        </a>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <a href="/entdecken" className="hover:text-teal-600 transition-colors">Entdecken</a>
          <a href="/karte"     className="hover:text-teal-600 transition-colors">Karte</a>
          {session && <a href="/reise/neu" className="hover:text-teal-600 transition-colors">+ Reise</a>}
        </nav>

        {/* Auth-Bereich */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOffen(o => !o)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700">
                  {profil?.name?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">{profil?.name}</span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {menuOffen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <a href="/profil" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMenuOffen(false)}>
                    👤 Mein Profil
                  </a>
                  <a href="/reise/neu" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMenuOffen(false)}>
                    ➕ Neue Reise
                  </a>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/login"      className="text-sm text-gray-600 hover:text-teal-600 px-3 py-1.5 transition-colors">Anmelden</a>
              <a href="/registrieren" className="btn-primary text-sm">Registrieren</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
