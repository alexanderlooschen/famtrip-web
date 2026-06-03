// components/KarteClient.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase, ReiseUebersicht, Etappe, centZuEuro, dauerTage } from '../lib/supabase';

const AlleReisenKarte = dynamic(() => import('./AlleReisenKarte'), { ssr: false });
const ReiseKarte      = dynamic(() => import('./ReiseKarte'),      { ssr: false });

type Modus = 'alle' | 'route';

export default function KarteClient() {
  const [modus, setModus]                       = useState<Modus>('alle');
  const [reisen, setReisen]                     = useState<ReiseUebersicht[]>([]);
  const [ausgewaehlteReise, setAusgewaehlteReise] = useState<ReiseUebersicht | null>(null);
  const [etappen, setEtappen]                   = useState<Etappe[]>([]);
  const [aktiveEtappe, setAktiveEtappe]         = useState<Etappe | null>(null);
  const [laden, setLaden]                       = useState(true);

  useEffect(() => {
    supabase.from('reisen_uebersicht').select('*').order('bewertung_schnitt', { ascending: false })
      .then(({ data }) => { setReisen((data ?? []) as ReiseUebersicht[]); setLaden(false); });
  }, []);

  const reiseWaehlen = async (reise: ReiseUebersicht) => {
    setAusgewaehlteReise(reise);
    setModus('route');
    setAktiveEtappe(null);
    const { data } = await supabase.from('etappen').select('*').eq('reise_id', reise.id).order('reihenfolge');
    setEtappen((data ?? []) as Etappe[]);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Modus-Leiste */}
      <div className="bg-white border-b border-gray-100 flex items-center gap-1 px-4 py-2 flex-shrink-0">
        <button onClick={() => { setModus('alle'); setAusgewaehlteReise(null); setEtappen([]); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            modus === 'alle' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          Alle Reisen
        </button>
        <button onClick={() => setModus('route')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            modus === 'route' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          Reiseroute
        </button>
        {ausgewaehlteReise && modus === 'route' && (
          <span className="ml-2 text-sm text-gray-500">
            — <span className="font-medium text-gray-700">{ausgewaehlteReise.titel}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Karte */}
        <div className="flex-1 relative">
          {modus === 'alle' ? (
            <AlleReisenKarte reisen={reisen} onReiseClick={reiseWaehlen} />
          ) : (
            <ReiseKarte etappen={etappen} aktiveEtappe={aktiveEtappe} onEtappeClick={setAktiveEtappe} />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto flex-shrink-0 hidden lg:block">

          {/* Modus: Alle Reisen – Liste */}
          {modus === 'alle' && (
            <div className="p-4">
              <h2 className="font-semibold text-gray-900 mb-3">
                {laden ? 'Lädt...' : `${reisen.length} Reisen`}
              </h2>
              <div className="space-y-2">
                {reisen.map(r => (
                  <button key={r.id} onClick={() => reiseWaehlen(r)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 leading-snug">
                        {r.titel}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                        r.preisstufe === '€' ? 'bg-green-50 text-green-700' :
                        r.preisstufe === '€€' ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700'
                      }`}>{r.preisstufe}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {dauerTage(r.datum_von, r.datum_bis)} Tage
                      {r.kinder_alter_min !== null && ` · ab ${r.kinder_alter_min} J.`}
                      {' · '}{centZuEuro(r.gesamtkosten_cent)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modus: Route – Etappen-Liste */}
          {modus === 'route' && (
            <div className="p-4">
              {!ausgewaehlteReise ? (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Reise auswählen</h2>
                  <div className="space-y-2">
                    {reisen.map(r => (
                      <button key={r.id} onClick={() => reiseWaehlen(r)}
                        className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-sm font-medium text-gray-700">
                        {r.titel}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 text-sm leading-snug">{ausgewaehlteReise.titel}</h2>
                    <a href={`/reise/${ausgewaehlteReise.id}`}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex-shrink-0 ml-2">
                      Details →
                    </a>
                  </div>

                  {/* Etappen */}
                  <div className="space-y-2">
                    {etappen.map((e, idx) => (
                      <button key={e.id} onClick={() => setAktiveEtappe(prev => prev?.id === e.id ? null : e)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          aktiveEtappe?.id === e.id
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-100 hover:border-emerald-200'
                        }`}>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{e.titel}</p>
                            <p className="text-xs text-gray-400">{e.ort}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {e.verkehrsmittel.slice(0, 2).map(v => (
                                <span key={v} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{v}</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">
                            {centZuEuro(e.kosten_gesamt_cent)}
                          </span>
                        </div>

                        {/* Tipp aufklappen */}
                        {aktiveEtappe?.id === e.id && e.tipps && (
                          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                            Tipp: {e.tipps}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => { setAusgewaehlteReise(null); setEtappen([]); setAktiveEtappe(null); }}
                    className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← andere Reise wählen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
