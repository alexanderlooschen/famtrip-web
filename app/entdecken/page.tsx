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

const JAHRESZEIT_ICON: Record<string, string> = {
  'Frühling': '🌸', 'Sommer': '☀️', 'Herbst': '🍂', 'Winter': '❄️'
};

export default function EntdeckenPage() {
  const [reisen, setReisen]           = useState<ReiseUebersicht[]>([]);
  const [titelbilder, setTitelbilder] = useState<Record<string, string>>({});
  const [laden, setLaden]             = useState(true);
  const [suche, setSuche]             = useState('');
  const [preisstufe, setPreisstufe]   = useState<Preisstufe | undefined>();
  const [maxAlter, setMaxAlter]       = useState<number | undefined>();

  useEffect(() => {
    const ladeDaten = async () => {
      setLaden(true);
      let q = supabase.from('reisen_uebersicht').select('*')
        .order('bewertung_schnitt', { ascending: false });
      if (preisstufe) q = q.eq('preisstufe', preisstufe);
      if (maxAlter !== undefined) q = q.lte('kinder_alter_min', maxAlter);
      const { data } = await q;
      const reisenDaten = (data ?? []) as ReiseUebersicht[];
      setReisen(reisenDaten);

      // Titelbilder laden – erstes Foto jeder Reise
      if (reisenDaten.length > 0) {
        const ids = reisenDaten.map(r => r.id);
        const { data: fotos } = await supabase
          .from('fotos')
          .select('reise_id, url')
          .in('reise_id', ids)
          .is('etappe_id', null)
          .order('erstellt_am', { ascending: true });

        if (fotos) {
          const map: Record<string, string> = {};
          fotos.forEach((f: any) => {
            if (f.reise_id && !map[f.reise_id]) map[f.reise_id] = f.url;
          });
          setTitelbilder(map);
        }
      }
      setLaden(false);
    };
    ladeDaten();
  }, [preisstufe, maxAlter]);

  const gefiltert = reisen.filter(r =>
    suche.length < 2 ||
    r.titel.toLowerCase().includes(suche.toLowerCase()) ||
    (r.beschreibung ?? '').toLowerCase().includes(suche.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reisen entdecken</h1>
      <p className="text-gray-500 mb-8">Familienreisen der Community</p>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="🔍  Reise oder Ort suchen …"
          value={suche}
          onChange={e => setSuche(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {PREISSTUFEN.map(p => (
            <button key={p}
              onClick={() => setPreisstufe(prev => prev === p ? undefined : p)}
              className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                preisstufe === p
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}>{p}</button>
          ))}
        </div>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          value={maxAlter ?? ''}
          onChange={e => setMaxAlter(e.target.value ? Number(e.target.value) : undefined)}>
          {FILTER_ALTER.map(f => (
            <option key={f.label} value={f.wert ?? ''}>{f.label}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-400 mb-5">
        {laden ? 'Lädt …' : `${gefiltert.length} Reise${gefiltert.length !== 1 ? 'n' : ''} gefunden`}
      </p>

      {laden ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <SkeletonKarte key={i} />)}
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-lg">Keine Reisen gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gefiltert.map(r => (
            <ReiseKarte key={r.id} reise={r} titelbild={titelbilder[r.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReiseKarte({ reise, titelbild }: { reise: ReiseUebersicht; titelbild?: string }) {
  const preisstufeClass: Record<string, string> = {
    '€': 'preisstufe-e', '€€': 'preisstufe-ee', '€€€': 'preisstufe-eee',
  };
  const jahreszeitIcon = JAHRESZEIT_ICON[reise.jahreszeit ?? ''] ?? '🗺️';

  return (
    <a href={`/reise/${reise.id}`} className="card block group cursor-pointer overflow-hidden">
      {/* Titelbild oder Platzhalter */}
      <div className="h-44 relative overflow-hidden">
        {titelbild ? (
          <img
            src={titelbild}
            alt={reise.titel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-5xl">
            {jahreszeitIcon}
          </div>
        )}
        {/* Preisstufe-Badge */}
        <div className="absolute top-3 right-3">
          <span className={`${preisstufeClass[reise.preisstufe] ?? 'chip chip-teal'} shadow-sm`}>
            {reise.preisstufe}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug mb-1">
          {reise.titel}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          {new Date(reise.datum_von).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          {' · '}{reise.personen_anzahl} Personen
          {reise.kinder_alter_min !== null && ` · ab ${reise.kinder_alter_min} J.`}
        </p>
        {reise.beschreibung && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {reise.beschreibung}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-4">
          {(reise.alle_verkehrsmittel ?? []).slice(0, 4).map(v => (
            <span key={v} className="chip chip-teal">{VM_ICON[v] ?? '🚀'} {v}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">
              {reise.ersteller_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">{reise.ersteller_name}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{centZuEuro(reise.gesamtkosten_cent)}</p>
            {reise.bewertung_schnitt > 0 && (
              <p className="text-xs text-gray-400">⭐ {reise.bewertung_schnitt.toFixed(1)}</p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function SkeletonKarte() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-44 bg-gray-100" />
      <div className="p-5">
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
      </div>
    </div>
  );
}
