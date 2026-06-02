// app/registrieren/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RegistrierenPage() {
  const { signUp } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler]     = useState('');
  const [erfolg, setErfolg]     = useState(false);
  const [laden, setLaden]       = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwort.length < 8) { setFehler('Passwort muss mindestens 8 Zeichen haben.'); return; }
    setFehler('');
    setLaden(true);
    const err = await signUp(email, passwort, name);
    setLaden(false);
    if (err) setFehler(err);
    else setErfolg(true);
  };

  if (erfolg) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-teal-50 to-white">
        <div className="text-center max-w-sm">
          <span className="text-6xl">📬</span>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">Fast geschafft!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Wir haben eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet.
            Bitte klicke auf den Link darin, um dein Konto zu aktivieren.
          </p>
          <a href="/login" className="btn-primary inline-block mt-6">Zur Anmeldung</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-teal-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🗺️</span>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3">Konto erstellen</h1>
          <p className="text-gray-500 text-sm mt-1">Werde Teil der FamTrip-Community</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {fehler && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              ⚠️ {fehler}
            </div>
          )}

          <form onSubmit={absenden} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Maria Mustermann"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
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
                placeholder="Mindestens 8 Zeichen"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <button
              type="submit" disabled={laden}
              className="btn-primary w-full py-3 text-base"
            >
              {laden ? 'Konto wird erstellt …' : 'Jetzt mitmachen'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Bereits registriert?{' '}
            <a href="/login" className="text-teal-600 hover:text-teal-700 font-medium">Anmelden</a>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Mit der Registrierung stimmst du zu, Reisedaten mit der Community zu teilen.
        </p>
      </div>
    </div>
  );
}
