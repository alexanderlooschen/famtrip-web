// components/Kommentare.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Kommentar {
  id: string;
  text: string;
  erstellt_am: string;
  ersteller_id: string;
  users: {
    anzeigename: string | null;
    name: string;
  };
}

interface Props {
  reiseId: string;
}

export default function Kommentare({ reiseId }: Props) {
  const { session } = useAuth();
  const [kommentare, setKommentare] = useState<Kommentar[]>([]);
  const [neuerText, setNeuerText] = useState('');
  const [laden, setLaden] = useState(true);
  const [senden, setSenden] = useState(false);

  useEffect(() => {
    ladeKommentare();
  }, [reiseId]);

  const ladeKommentare = async () => {
    const { data } = await supabase
      .from('kommentare')
      .select('*, users(anzeigename, name)')
      .eq('reise_id', reiseId)
      .order('erstellt_am', { ascending: true });
    setKommentare((data ?? []) as Kommentar[]);
    setLaden(false);
  };

  const kommentarSenden = async () => {
    if (!neuerText.trim() || !session) return;
    setSenden(true);

    const { data, error } = await supabase
      .from('kommentare')
      .insert({
        reise_id:    reiseId,
        ersteller_id: session.user.id,
        text:        neuerText.trim(),
      })
      .select('*, users(anzeigename, name)')
      .single();

    setSenden(false);
    if (!error && data) {
      setKommentare(prev => [...prev, data as Kommentar]);
      setNeuerText('');
    }
  };

  const kommentarLoeschen = async (id: string) => {
    await supabase.from('kommentare').delete().eq('id', id);
    setKommentare(prev => prev.filter(k => k.id !== id));
  };

  const zeitAnzeigen = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const anzeigename = (k: Kommentar) =>
    k.users?.anzeigename || k.users?.name?.split(' ')[0] || 'Anonym';

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        💬 Diskussion
        {kommentare.length > 0 && (
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({kommentare.length} {kommentare.length === 1 ? 'Kommentar' : 'Kommentare'})
          </span>
        )}
      </h2>

      {/* Kommentar-Liste */}
      {laden ? (
        <div className="space-y-3 mb-6">
          {[1,2].map(i => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : kommentare.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl mb-6 border border-gray-100">
          <p className="text-gray-400 text-sm">Noch keine Kommentare.</p>
          <p className="text-gray-400 text-xs mt-1">Sei der Erste und stelle eine Frage!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {kommentare.map(k => (
            <div key={k.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                    {anzeigename(k).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{anzeigename(k)}</p>
                    <p className="text-xs text-gray-400">{zeitAnzeigen(k.erstellt_am)}</p>
                  </div>
                </div>
                {session?.user?.id === k.ersteller_id && (
                  <button
                    onClick={() => kommentarLoeschen(k.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    Löschen
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed pl-10">{k.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Neuer Kommentar */}
      {session ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Kommentar oder Frage hinzufügen</p>
          <textarea
            value={neuerText}
            onChange={e => setNeuerText(e.target.value)}
            placeholder="Schreib einen Kommentar oder stelle eine Frage zur Reise..."
            rows={3}
            className="eingabe resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={kommentarSenden}
              disabled={senden || !neuerText.trim()}
              className="btn-primary px-6">
              {senden ? 'Wird gesendet...' : 'Kommentar senden'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Melde dich an um Kommentare zu schreiben.
          </p>
          <a href="/login" className="btn-primary text-sm inline-block">Anmelden</a>
        </div>
      )}
    </div>
  );
}
