// app/entdecken/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase, ReiseUebersicht, centZuEuro, dauerTage, Preisstufe } from '../../lib/supabase';

const VM_ICON: Record<string, string> = {
  Auto: '🚗', Bahn: '🚂', Fahrrad: '🚲', Fähre: '⛴️',
  Flugzeug: '✈️', Bus: '🚌', Fuß: '🚶', Sonstiges: '🚀',
};

const PREISSTUFEN: Preisstufe[] = ['€', '€€', '€€€'];
const FILTER_ALTER = [
  { label: 'Alle Alter', wert: undefined },
  { label: 'Kleinkind (0–3)', wert: 3 },
  { label: 'Kindergarten (4–6)', wert: 6 },
  { label: 'Grundschule (7–12)', wert: 12 },
  { label: 'Teenager', wert: 16 },
];

export default function EntdeckenPage() {
  const [reisen, setReisen] = useState<ReiseUebersicht[]>([]);
  const [laden, setLaden] = useState(true);
  const [suche, setSuche] = useState('');
  const [preisstufe, setPreisstufe] = useState<Preisstufe | undefined>();
  const [maxAlter, setMaxAlter] = useState<number | undefined>();

  useEffect(() => {
    const laden = async () => {
      setLaden(true);
      let q = supabase.from('reisen_uebersicht').select('*').order('bewertung_schnitt', { ascending: false });
      if (preisstufe) q = q.eq('preisstufe', preisstufe);
      if (maxAlter !== undefined) q = q.lte('kinder_alter_min', maxAlter);
      const { data } = await q;
      setReisen((data ?? []) as ReiseUebersicht[]);
      setLaden(false);
    };
    laden();
  }, [preisstufe, maxAlter]);

  const gefiltert = reisen.filter(r =>
    suche.length < 2 ||
    r.titel.toLowerCase().includes(suche.toLowerCase()) ||
    (r.beschreibung ?? '').toLowerCase().includes(suche.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reisen entdecken</h1>
      <p className="text-gray-500 mb-8">Familienreisen der Community – gefiltert nach deinen Bedürfnissen</p>

      {/* Filter-Leiste */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="🔍  Reise oder Ort suchen …"
          value={suche}
          onChange={e => setSuche(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {PREISSTUFEN.map(p => (
            <button
              key={p}
              onClick={() => setPreisstufe(prev => prev === p ? undefined : p)}
              className={`chip border text-sm px-4 py-2 rounded-xl transition-all ${
                preisstufe === p
                  ? 'bg-teal-400 text-white border-teal-400'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-300"
          value={maxAlter ?? ''}
          onChange={e => setMaxAlter(e.target.value ? Number(e.target.value) : undefined)}
        >
          {FILTER_ALTER.map(f => (
            <option key={f.label} value={f.wert ?? ''}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Ergebnis-Anzahl */}
      <p className="text-sm text-gray-400 mb-5">
        {laden ? 'Lädt …' : `${gefiltert.length} Reise${gefiltert.length !== 1 ? 'n' : ''} gefunden`}
      </p>

      {/* Reise-Grid */}
      {laden ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <SkeletonKarte key={i} />)}
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-lg">Keine Reisen gefunden.</p>
          <p className="text-sm mt-1">Probiere andere Filtereinstellungen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gefiltert.map(r => <ReiseKarte key={r.id} reise={r} />)}
        </div>
      )}
    </div>
  );
}

// ── Reise-Karte ───────────────────────────────────────────────
function ReiseKarte({ reise }: { reise: ReiseUebersicht }) {
  const dauer = dauerTage(reise.datum_von, reise.datum_bis);
  const preisstufeClass: Record<string, string> = {
    '€': 'preisstufe-e', '€€': 'preisstufe-ee', '€€€': 'preisstufe-eee',
  };

  return (
    <a href={`/reise/${reise.id}`} className="card p-5 block group cursor-pointer">
      {/* Kartenbild-Platzhalter */}
      <div className="h-40 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl mb-4 flex items-center justify-center text-5xl border border-teal-100">
        {reise.jahreszeit === 'Sommer' ? '☀️' : reise.jahreszeit === 'Winter' ? '❄️' : reise.jahreszeit === 'Herbst' ? '🍂' : '🌸'}
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors leading-snug">
          {reise.titel}
        </h3>
        <span className={preisstufeClass[reise.preisstufe] ?? 'chip chip-teal'}>
          {reise.preisstufe}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {reise.datum_von.slice(0, 4)} · {dauer} Tage · {reise.personen_anzahl} Personen
        {reise.kinder_alter_min !== null && ` · ab ${reise.kinder_alter_min} J.`}
      </p>

      {reise.beschreibung && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {reise.beschreibung}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-4">
        {(reise.alle_verkehrsmittel ?? []).slice(0, 4).map(v => (
          <span key={v} className="chip chip-teal text-xs">{VM_ICON[v] ?? '🚀'} {v}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700">
            {reise.ersteller_name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-gray-400">{reise.ersteller_name}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{centZuEuro(reise.gesamtkosten_cent)}</p>
          <p className="text-xs text-gray-400">⭐ {reise.bewertung_schnitt.toFixed(1)} · {reise.tipp_anzahl} Tipps</p>
        </div>
      </div>
    </a>
  );
}

function SkeletonKarte() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-40 bg-gray-100 rounded-xl mb-4" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
    </div>
  );
}
