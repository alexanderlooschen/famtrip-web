// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler]     = useState('');
  const [laden, setLaden]       = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler('');
    setLaden(true);
    const err = await signIn(email, passwort);
    setLaden(false);
    if (err) setFehler(err);
    else router.push('/profil');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-teal-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🗺️</span>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3">Willkommen zurück</h1>
          <p className="text-gray-500 text-sm mt-1">Melde dich bei FamTrip an</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {fehler && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              ⚠️ {fehler}
            </div>
          )}

          <form onSubmit={absenden} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                type="password" required value={passwort} onChange={e => setPasswort(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <button
              type="submit" disabled={laden}
              className="btn-primary w-full py-3 text-base"
            >
              {laden ? 'Anmelden …' : 'Anmelden'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Noch kein Konto?{' '}
            <a href="/registrieren" className="text-teal-600 hover:text-teal-700 font-medium">
              Jetzt registrieren
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
