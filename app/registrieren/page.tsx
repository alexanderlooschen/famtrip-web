// app/registrieren/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function RegistrierenPage() {
  const { signUp } = useAuth();
  const [name, setName]             = useState('');
  const [anzeigename, setAnzeigename] = useState('');
  const [email, setEmail]           = useState('');
  const [passwort, setPasswort]     = useState('');
  const [fehler, setFehler]         = useState('');
  const [erfolg, setErfolg]         = useState(false);
  const [laden, setLaden]           = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwort.length < 8) { setFehler('Passwort muss mindestens 8 Zeichen haben.'); return; }
    if (!anzeigename.trim()) { setFehler('Bitte einen Anzeigenamen wählen.'); return; }
    if (anzeigename.length < 3) { setFehler('Anzeigename muss mindestens 3 Zeichen haben.'); return; }
    setFehler('');
    setLaden(true);

    const { error } = await signUp(email, passwort, name);
    if (error) { setFehler(error); setLaden(false); return; }

    // Anzeigename direkt nach Registrierung setzen
    // (wird nach Email-Bestätigung aktiv – als Metadata mitgeben)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('users')
        .update({ anzeigename: anzeigename.trim() })
        .eq('id', session.user.id);
    }

    setLaden(false);
    setErfolg(true);
  };

  if (erfolg) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center max-w-sm">
          <span className="text-6xl">📬</span>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">Fast geschafft!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Wir haben eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet.
            Bitte klicke auf den Link darin, um dein Konto zu aktivieren.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-5 text-sm text-emerald-700">
            <p>Dein Anzeigename: <strong>{anzeigename}</strong></p>
            <p className="text-xs text-emerald-600 mt-1">So wirst du in der Community sichtbar sein.</p>
          </div>
          <a href="/login" className="btn-primary inline-block mt-6">Zur Anmeldung</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-white">
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

            {/* Anzeigename – öffentlich */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anzeigename <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text" required value={anzeigename}
                onChange={e => setAnzeigename(e.target.value)}
                placeholder="z. B. FamilieOsnabrück"
                className="eingabe"
              />
              <p className="text-xs text-gray-400 mt-1">
                🌍 Öffentlich sichtbar – erscheint bei deinen Reisen und Kommentaren
              </p>
            </div>

            {/* Name – privat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Echter Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Maria Mustermann"
                className="eingabe"
              />
              <p className="text-xs text-gray-400 mt-1">
                🔒 Privat – nur für dich sichtbar, nie öffentlich angezeigt
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                className="eingabe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort *</label>
              <input
                type="password" required value={passwort}
                onChange={e => setPasswort(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="eingabe"
              />
            </div>

            <button
              type="submit" disabled={laden}
              className="btn-primary w-full py-3 text-base">
              {laden ? 'Konto wird erstellt …' : 'Jetzt mitmachen'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Bereits registriert?{' '}
            <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Anmelden
            </a>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          Mit der Registrierung stimmst du zu, Reisedaten mit der Community zu teilen.
          Dein echter Name bleibt immer privat.
        </p>
      </div>
    </div>
  );
}
