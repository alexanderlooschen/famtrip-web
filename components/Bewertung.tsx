// components/Bewertung.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BewertungData {
  id: string;
  sterne: number;
  kommentar: string | null;
  erstellt_am: string;
  nutzer_id: string;
  users: { anzeigename: string | null; name: string; };
}

interface Props {
  reiseId: string;
  erstellerId: string;
  onBewertungChange?: (schnitt: number, anzahl: number) => void;
}

export default function Bewertung({ reiseId, erstellerId, onBewertungChange }: Props) {
  const { session } = useAuth();
  const [bewertungen, setBewertungen] = useState<BewertungData[]>([]);
  const [eigeneBewertung, setEigeneBewertung] = useState<BewertungData | null>(null);
  const [hover, setHover] = useState(0);
  const [ausgewaehlt, setAusgewaehlt] = useState(0);
  const [kommentar, setKommentar] = useState('');
  const [laden, setLaden] = useState(true);
  const [senden, setSenden] = useState(false);
  const [formOffen, setFormOffen] = useState(false);

  const istErsteller = session?.user?.id === erstellerId;

  useEffect(() => {
    ladeBewertungen();
  }, [reiseId]);

  const ladeBewertungen = async () => {
    const { data } = await supabase
      .from('bewertungen')
      .select('*, users(anzeigename, name)')
      .eq('reise_id', reiseId)
      .order('erstellt_am', { ascending: false });

    if (data) {
      setBewertungen(data as BewertungData[]);
      // Eigene Bewertung finden
      if (session) {
        const eigene = (data as BewertungData[]).find(b => b.nutzer_id === session.user.id);
        if (eigene) {
          setEigeneBewertung(eigene);
          setAusgewaehlt(eigene.sterne);
          setKommentar(eigene.kommentar ?? '');
        }
      }
      // Schnitt berechnen und nach oben melden
      if (data.length > 0 && onBewertungChange) {
        const schnitt = data.reduce((s, b) => s + (b as any).sterne, 0) / data.length;
        onBewertungChange(Math.round(schnitt * 10) / 10, data.length);
      }
    }
    setLaden(false);
  };

  const bewertungSpeichern = async () => {
    if (!session || ausgewaehlt === 0) return;
    setSenden(true);

    if (eigeneBewertung) {
      // Update
      await supabase.from('bewertungen')
        .update({ sterne: ausgewaehlt, kommentar: kommentar || null })
        .eq('id', eigeneBewertung.id);
    } else {
      // Insert
      await supabase.from('bewertungen').insert({
        reise_id:    reiseId,
        nutzer_id:   session.user.id,
        sterne:      ausgewaehlt,
        kommentar:   kommentar || null,
      });
    }

    setSenden(false);
    setFormOffen(false);
    ladeBewertungen();
  };

  const bewertungLoeschen = async () => {
    if (!eigeneBewertung) return;
    await supabase.from('bewertungen').delete().eq('id', eigeneBewertung.id);
    setEigeneBewertung(null);
    setAusgewaehlt(0);
    setKommentar('');
    ladeBewertungen();
  };

  const anzeigename = (b: BewertungData) =>
    b.users?.anzeigename || b.users?.name?.split(' ')[0] || 'Anonym';

  const zeitAnzeigen = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

  const schnitt = bewertungen.length > 0
    ? bewertungen.reduce((s, b) => s + b.sterne, 0) / bewertungen.length
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">
          ⭐ Bewertungen
          {bewertungen.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({schnitt.toFixed(1)} von {bewertungen.length} {bewertungen.length === 1 ? 'Bewertung' : 'Bewertungen'})
            </span>
          )}
        </h2>

        {/* Bewertung-Button – nur für eingeloggte Nicht-Ersteller */}
        {session && !istErsteller && (
          <button
            onClick={() => setFormOffen(o => !o)}
            className={eigeneBewertung ? 'btn-ghost text-sm' : 'btn-primary text-sm'}>
            {eigeneBewertung ? '✏️ Bewertung ändern' : '⭐ Bewertung abgeben'}
          </button>
        )}
      </div>

      {/* Bewertungs-Formular */}
      {formOffen && session && !istErsteller && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {eigeneBewertung ? 'Bewertung bearbeiten' : 'Wie war diese Reise für euch?'}
          </p>

          {/* Sterne */}
          <div className="flex gap-1 mb-4">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setAusgewaehlt(s)}
                className="text-3xl transition-transform hover:scale-110">
                <span className={(hover || ausgewaehlt) >= s ? 'text-yellow-400' : 'text-gray-200'}>
                  ★
                </span>
              </button>
            ))}
            {ausgewaehlt > 0 && (
              <span className="text-sm text-gray-500 self-center ml-2">
                {['','Enttäuschend','Verbesserungswürdig','In Ordnung','Gut','Ausgezeichnet!'][ausgewaehlt]}
              </span>
            )}
          </div>

          {/* Kommentar */}
          <textarea
            value={kommentar}
            onChange={e => setKommentar(e.target.value)}
            placeholder="Optionaler Kommentar – was war besonders gut oder verbesserungswürdig?"
            rows={3}
            className="eingabe resize-none mb-3"
          />

          <div className="flex gap-3 justify-between">
            <div className="flex gap-2">
              <button
                onClick={bewertungSpeichern}
                disabled={senden || ausgewaehlt === 0}
                className="btn-primary px-5">
                {senden ? 'Speichern...' : 'Bewertung speichern'}
              </button>
              <button onClick={() => setFormOffen(false)} className="btn-ghost">
                Abbrechen
              </button>
            </div>
            {eigeneBewertung && (
              <button onClick={bewertungLoeschen} className="text-sm text-red-400 hover:text-red-600">
                Bewertung löschen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nicht eingeloggt */}
      {!session && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-5 text-center">
          <p className="text-sm text-gray-500 mb-2">Melde dich an um eine Bewertung abzugeben.</p>
          <a href="/login" className="btn-primary text-sm inline-block">Anmelden</a>
        </div>
      )}

      {/* Bewertungs-Liste */}
      {laden ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : bewertungen.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-400 text-sm">Noch keine Bewertungen.</p>
          <p className="text-gray-400 text-xs mt-1">Sei der Erste!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bewertungen.map(b => (
            <div key={b.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                b.nutzer_id === session?.user?.id ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
              }`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    {anzeigename(b).slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{anzeigename(b)}</p>
                    <p className="text-xs text-gray-400">{zeitAnzeigen(b.erstellt_am)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-lg ${b.sterne >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
              </div>
              {b.kommentar && (
                <p className="text-sm text-gray-600 leading-relaxed pl-10">{b.kommentar}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
