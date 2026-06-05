// components/ReiseBearbeitenClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase, Reise, Etappe } from '../lib/supabase';

const MONATE = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember'
];
const JAHRE = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
const UNTERKUNFT_TYPEN = [
  'Hotel','Ferienwohnung','Camping','Zelt','Jugendherberge',
  'Hostel','Bauernhof','Verwandte','Sonstiges'
];
const VERKEHRSMITTEL = ['Auto','Bahn','Fahrrad','Fähre','Flugzeug','Bus','Fuß','Sonstiges'];
const JAHRESZEITEN = ['Frühling','Sommer','Herbst','Winter'];

export default function ReiseBearbeitenClient() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reiseId = searchParams.get('id');

  const [reise, setReise] = useState<Reise | null>(null);
  const [etappen, setEtappen] = useState<Etappe[]>([]);
  const [laden, setLaden] = useState(true);
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Basisdaten
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [gesamtkommentar, setGesamtkommentar] = useState('');
  const [monat, setMonat] = useState('');
  const [jahr, setJahr] = useState(String(new Date().getFullYear()));
  const [personen, setPersonen] = useState('2');
  const [kinderMin, setKinderMin] = useState('');
  const [kinderMax, setKinderMax] = useState('');
  const [jahreszeit, setJahreszeit] = useState('');

  useEffect(() => {
    if (!reiseId) return;
    Promise.all([
      supabase.from('reisen').select('*').eq('id', reiseId).single(),
      supabase.from('etappen').select('*').eq('reise_id', reiseId).order('reihenfolge'),
    ]).then(([r, e]) => {
      if (r.data) {
        const d = r.data as Reise;
        setReise(d);
        setTitel(d.titel);
        setBeschreibung(d.beschreibung ?? '');
        setGesamtkommentar((d as any).gesamtkommentar ?? '');
        setPersonen(String(d.personen_anzahl));
        setKinderMin(d.kinder_alter_min !== null ? String(d.kinder_alter_min) : '');
        setKinderMax(d.kinder_alter_max !== null ? String(d.kinder_alter_max) : '');
        setJahreszeit(d.jahreszeit ?? '');
        // Monat/Jahr aus datum_von extrahieren
        if (d.datum_von) {
          const dt = new Date(d.datum_von);
          setMonat(String(dt.getMonth() + 1));
          setJahr(String(dt.getFullYear()));
        }
      }
      if (e.data) setEtappen(e.data as Etappe[]);
      setLaden(false);
    });
  }, [reiseId]);

  const basisSpeichern = async () => {
    if (!titel) { setFehler('Bitte einen Titel eingeben.'); return; }
    setFehler(''); setSpeichern(true);

    // Datum aus Monat/Jahr berechnen
    const monatNum = parseInt(monat) || 1;
    const jahrNum = parseInt(jahr);
    const datumVon = `${jahrNum}-${String(monatNum).padStart(2,'0')}-01`;
    const letzterTag = new Date(jahrNum, monatNum, 0).getDate();
    const datumBis = `${jahrNum}-${String(monatNum).padStart(2,'0')}-${letzterTag}`;

    const { error } = await supabase.from('reisen').update({
      titel,
      beschreibung: beschreibung || null,
      gesamtkommentar: gesamtkommentar || null,
      datum_von: datumVon,
      datum_bis: datumBis,
      personen_anzahl: parseInt(personen) || 2,
      kinder_alter_min: kinderMin ? parseInt(kinderMin) : null,
      kinder_alter_max: kinderMax ? parseInt(kinderMax) : null,
      jahreszeit: jahreszeit || null,
    }).eq('id', reiseId);

    setSpeichern(false);
    if (error) { setFehler(error.message); return; }
    setErfolg('Basisdaten gespeichert!');
    setTimeout(() => setErfolg(''), 3000);
  };

  const etappeLoeschen = async (etappeId: string) => {
    if (!confirm('Etappe wirklich löschen?')) return;
    await supabase.from('etappen').delete().eq('id', etappeId);
    setEtappen(prev => prev.filter(e => e.id !== etappeId));
  };

  if (laden) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-3/4" />
    </div>
  );

  if (!session || (reise && reise.ersteller_id !== session.user.id)) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-semibold mt-4">Kein Zugriff</h2>
        <p className="text-gray-500 mt-2">Nur der Ersteller kann diese Reise bearbeiten.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <a href="/profil" className="hover:text-emerald-600">Profil</a>
        <span>›</span>
        <a href={`/reise/${reiseId}`} className="hover:text-emerald-600">{reise?.titel}</a>
        <span>›</span>
        <span className="text-gray-600">Bearbeiten</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Reise bearbeiten</h1>

      {fehler && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{fehler}</div>
      )}
      {erfolg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4">✅ {erfolg}</div>
      )}

      {/* Basisdaten */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Basisdaten</h2>
        <div className="space-y-4">
          <Feld label="Titel *">
            <input value={titel} onChange={e => setTitel(e.target.value)} className="eingabe" />
          </Feld>
          <Feld label="Kurzbeschreibung">
            <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
              rows={2} className="eingabe resize-none" />
          </Feld>
          <Feld label="Gesamtfazit">
            <textarea value={gesamtkommentar} onChange={e => setGesamtkommentar(e.target.value)}
              rows={3} className="eingabe resize-none" />
          </Feld>

          {/* Monat & Jahr statt exaktes Datum */}
          <div className="grid grid-cols-2 gap-4">
            <Feld label="Reisemonat">
              <select value={monat} onChange={e => setMonat(e.target.value)} className="eingabe">
                <option value="">-- Monat --</option>
                {MONATE.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </Feld>
            <Feld label="Jahr">
              <select value={jahr} onChange={e => setJahr(e.target.value)} className="eingabe">
                {JAHRE.map(j => <option key={j}>{j}</option>)}
              </select>
            </Feld>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Feld label="Personen">
              <input type="number" min="1" value={personen} onChange={e => setPersonen(e.target.value)} className="eingabe" />
            </Feld>
            <Feld label="Kinder ab (J.)">
              <input type="number" min="0" value={kinderMin} onChange={e => setKinderMin(e.target.value)} placeholder="0" className="eingabe" />
            </Feld>
            <Feld label="Kinder bis (J.)">
              <input type="number" min="0" value={kinderMax} onChange={e => setKinderMax(e.target.value)} placeholder="12" className="eingabe" />
            </Feld>
          </div>

          <Feld label="Jahreszeit">
            <div className="flex gap-2 flex-wrap">
              {JAHRESZEITEN.map(j => (
                <button key={j} type="button"
                  onClick={() => setJahreszeit(prev => prev === j ? '' : j)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                    jahreszeit === j ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}>{j}</button>
              ))}
            </div>
          </Feld>

          <button onClick={basisSpeichern} disabled={speichern} className="btn-primary w-full py-3">
            {speichern ? 'Speichern ...' : 'Basisdaten speichern'}
          </button>
        </div>
      </div>

      {/* Etappen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Etappen ({etappen.length})</h2>
          <a href={`/etappe/neu?reise_id=${reiseId}`}
            className="btn-primary text-sm px-4 py-2">
            + Etappe hinzufügen
          </a>
        </div>

        {etappen.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Noch keine Etappen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {etappen.map((e, idx) => (
              <div key={e.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{e.titel}</p>
                  <p className="text-xs text-gray-400">{e.ort} · {e.verkehrsmittel.join(', ')}</p>
                  {e.unterkunft_name && (
                    <p className="text-xs text-gray-400">{e.unterkunft_typ}: {e.unterkunft_name}</p>
                  )}
                </div>
                <button onClick={() => etappeLoeschen(e.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                  Löschen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <a href={`/reise/${reiseId}`} className="btn-ghost flex-1 text-center py-3">
          Zur Reise
        </a>
        <a href="/profil" className="btn-ghost flex-1 text-center py-3">
          Zum Profil
        </a>
      </div>
    </div>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
