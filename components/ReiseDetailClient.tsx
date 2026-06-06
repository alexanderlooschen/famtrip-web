// components/ReiseDetailClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase, Reise, Etappe, centZuEuro, datumDE, dauerTage } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ReiseKarte = dynamic(() => import('./ReiseKarte'), { ssr: false });

type KostenSicht = 'gesamt' | 'pro_person' | 'pro_tag';

export default function ReiseDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [reise, setReise] = useState<Reise | null>(null);
  const [etappen, setEtappen] = useState<Etappe[]>([]);
  const [laden, setLaden] = useState(true);
  const [kostenSicht, setKostenSicht] = useState<KostenSicht>('gesamt');
  const [aktiveEtappe, setAktiveEtappe] = useState<Etappe | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('reisen').select('*').eq('id', id).single(),
      supabase.from('etappen').select('*').eq('reise_id', id).order('reihenfolge'),
    ]).then(([r, e]) => {
      if (r.data) setReise(r.data as Reise);
      if (e.data) setEtappen(e.data as Etappe[]);
      setLaden(false);
    });
  }, [id]);

  if (laden) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-96 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!reise) return (
    <p className="p-10 text-center text-gray-400">Reise nicht gefunden.</p>
  );

  const dauer = dauerTage(reise.datum_von, reise.datum_bis);
  const istErsteller = session?.user?.id === reise.ersteller_id;

  const kostenWert = (cent: number) => {
    if (kostenSicht === 'pro_person') return centZuEuro(Math.round(cent / reise.personen_anzahl));
    if (kostenSicht === 'pro_tag')    return centZuEuro(Math.round(cent / Math.max(dauer, 1)));
    return centZuEuro(cent);
  };

  const summe = (key: keyof Etappe) =>
    etappen.reduce((acc, e) => acc + ((e[key] as number) ?? 0), 0);

  const kostenKategorien = [
    { icon: '🏨', label: 'Unterkunft',   cent: summe('kosten_unterkunft_cent') },
    { icon: '🚗', label: 'Transport',    cent: summe('kosten_transport_cent') },
    { icon: '🍽️', label: 'Verpflegung',  cent: summe('kosten_verpflegung_cent') },
    { icon: '🎟️', label: 'Aktivitäten',  cent: summe('kosten_aktivitaeten_cent') },
    { icon: '📦', label: 'Sonstiges',    cent: summe('kosten_sonstiges_cent') },
  ];

  // Reisemonat aus datum_von
  const reisemonat = new Date(reise.datum_von).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Breadcrumb + Bearbeiten */}
      <div className="flex items-center justify-between mb-6">
        <nav className="text-sm text-gray-400 flex items-center gap-2">
          <a href="/entdecken" className="hover:text-emerald-600">Entdecken</a>
          <span>›</span>
          <span className="text-gray-600">{reise.titel}</span>
        </nav>
        {istErsteller && (
          <a href={`/reise/bearbeiten?id=${reise.id}`}
            className="btn-ghost text-sm flex items-center gap-1.5">
            ✏️ Bearbeiten
          </a>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-semibold text-gray-900 flex-1">{reise.titel}</h1>
          <span className={`chip text-sm px-3 py-1 ${
            reise.preisstufe === '€' ? 'preisstufe-e' :
            reise.preisstufe === '€€' ? 'preisstufe-ee' : 'preisstufe-eee'
          }`}>{reise.preisstufe}</span>
        </div>
        {reise.beschreibung && (
          <p className="text-gray-500 leading-relaxed mb-4 text-lg">{reise.beschreibung}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-teal">📅 {reisemonat}</span>
          <span className="chip chip-teal">👨‍👩‍👧 {reise.personen_anzahl} Personen</span>
          {reise.kinder_alter_min !== null && (
            <span className="chip chip-green">👶 Kinder ab {reise.kinder_alter_min} J.{reise.kinder_alter_max ? ` bis ${reise.kinder_alter_max} J.` : ''}</span>
          )}
          {reise.jahreszeit && (
            <span className="chip chip-amber">🌤️ {reise.jahreszeit}</span>
          )}
          {!reise.veroeffentlicht && (
            <span className="chip bg-gray-100 text-gray-500 border border-gray-200">Entwurf</span>
          )}
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { wert: `${dauer}`, label: 'Tage' },
          { wert: `${etappen.length}`, label: 'Etappen' },
          { wert: `${reise.bewertung_schnitt?.toFixed(1) ?? '–'} ⭐`, label: 'Bewertung' },
          { wert: centZuEuro(reise.gesamtkosten_cent), label: 'Gesamtkosten', gruen: true },
        ].map(k => (
          <div key={k.label} className="card p-4 text-center">
            <p className={`text-xl font-semibold ${k.gruen ? 'text-emerald-500' : 'text-gray-900'}`}>{k.wert}</p>
            <p className="text-xs text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Karte */}
          <div className="card overflow-hidden">
            <div className="h-72 sm:h-96">
              <ReiseKarte etappen={etappen} aktiveEtappe={aktiveEtappe} onEtappeClick={setAktiveEtappe} />
            </div>
          </div>

          {/* Gesamtkommentar */}
          {(reise as any).gesamtkommentar && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <h3 className="font-semibold text-emerald-900 mb-2">Fazit der Reise</h3>
              <p className="text-emerald-800 text-sm leading-relaxed">{(reise as any).gesamtkommentar}</p>
            </div>
          )}

          {/* Etappenverlauf */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reiseverlauf</h2>
            <div className="space-y-3">
              {etappen.map((e, idx) => (
                <EtappeKarte
                  key={e.id} etappe={e} nummer={idx + 1}
                  aktiv={aktiveEtappe?.id === e.id}
                  onClick={() => setAktiveEtappe(prev => prev?.id === e.id ? null : e)}
                />
              ))}
            </div>
            <a href={`/etappe/neu?reise_id=${reise.id}`}
              className="mt-4 block border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl p-4 text-center text-sm text-emerald-500 hover:text-emerald-700 transition-colors">
              + Etappe ergänzen
            </a>
          </div>
        </div>

        {/* Sidebar Kosten */}
        <div>
          <div className="card p-5 sticky top-20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kostenübersicht</h2>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4 text-xs">
              {(['gesamt', 'pro_person', 'pro_tag'] as KostenSicht[]).map(s => (
                <button key={s} onClick={() => setKostenSicht(s)}
                  className={`flex-1 py-2 transition-colors ${
                    kostenSicht === s ? 'bg-emerald-500 text-white font-medium' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {s === 'gesamt' ? 'Gesamt' : s === 'pro_person' ? 'Person' : 'Tag'}
                </button>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              {kostenKategorien.map(k => (
                <div key={k.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                  <span className="text-gray-500">{k.icon} {k.label}</span>
                  <span className="font-medium text-gray-800">{kostenWert(k.cent)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 mb-5">
              <span className="font-semibold text-gray-900">Gesamt</span>
              <span className="text-lg font-bold text-emerald-500">{kostenWert(reise.gesamtkosten_cent)}</span>
            </div>

            {istErsteller && (
              <a href={`/reise/bearbeiten?id=${reise.id}`}
                className="btn-ghost w-full text-center block mb-3 text-sm">
                ✏️ Reise bearbeiten
              </a>
            )}
            <a href={`/etappe/neu?reise_id=${reise.id}`}
              className="btn-primary w-full text-center block">
              + Etappe hinzufügen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Etappen-Karte mit allen Details ──────────────────────────
const VM_ICON: Record<string, string> = {
  Auto: '🚗', Bahn: '🚂', Fahrrad: '🚲', Fähre: '⛴️',
  Flugzeug: '✈️', Bus: '🚌', Fuß: '🚶', Sonstiges: '🚀',
};

const UNTERKUNFT_ICON: Record<string, string> = {
  Hotel: '🏨', Ferienwohnung: '🏠', Camping: '🏕️', Zelt: '⛺',
  Jugendherberge: '🏫', Hostel: '🛏️', Bauernhof: '🐄',
  Verwandte: '👨‍👩‍👧', Sonstiges: '🏠',
};

function EtappeKarte({ etappe, nummer, aktiv, onClick }: {
  etappe: Etappe; nummer: number; aktiv: boolean; onClick: () => void;
}) {
  const dauer = dauerTage(etappe.datum_von, etappe.datum_bis);
  const gesamtCent = etappe.kosten_gesamt_cent;

  return (
    <button onClick={onClick}
      className={`w-full text-left card p-4 transition-all ${aktiv ? 'ring-2 ring-emerald-400' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {nummer}
        </div>
        <div className="flex-1 min-w-0">
          {/* Titel + Kosten */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <p className="font-semibold text-gray-900">{etappe.titel}</p>
            {gesamtCent > 0 && (
              <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                {centZuEuro(gesamtCent)}
              </span>
            )}
          </div>

          {/* Ort + Dauer */}
          <p className="text-xs text-gray-400 mb-2">
            📍 {etappe.ort}
            {dauer > 0 && ` · ${dauer} ${dauer === 1 ? 'Tag' : 'Tage'}`}
          </p>

          {/* Verkehrsmittel */}
          <div className="flex flex-wrap gap-1 mb-2">
            {etappe.verkehrsmittel.map(v => (
              <span key={v} className="chip chip-teal text-xs">{VM_ICON[v] ?? '🚀'} {v}</span>
            ))}
          </div>

          {/* Unterkunft */}
          {etappe.unterkunft_typ && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{UNTERKUNFT_ICON[etappe.unterkunft_typ] ?? '🏠'}</span>
              <span className="text-xs text-gray-600">
                {etappe.unterkunft_typ}
                {etappe.unterkunft_name && `: ${etappe.unterkunft_name}`}
              </span>
              {etappe.kinderwagen_geeignet === true && (
                <span className="text-xs text-emerald-600 ml-1">✅ Kinderwagen</span>
              )}
              {etappe.kinderwagen_geeignet === false && (
                <span className="text-xs text-gray-400 ml-1">❌ Kein Kinderwagen</span>
              )}
            </div>
          )}

          {/* Aufgeklappte Details */}
          {aktiv && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">

              {/* Kostenaufschlüsselung */}
              {gesamtCent > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['🏨', 'Unterkunft', etappe.kosten_unterkunft_cent],
                    ['🚗', 'Transport',  etappe.kosten_transport_cent],
                    ['🍽️', 'Verpflegung', etappe.kosten_verpflegung_cent],
                    ['🎟️', 'Aktivitäten', etappe.kosten_aktivitaeten_cent],
                  ].filter(([,,c]) => (c as number) > 0).map(([icon, label, cent]) => (
                    <div key={label as string} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400">{icon as string} {label as string}</p>
                      <p className="text-sm font-medium text-gray-700">{centZuEuro(cent as number)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tipps */}
              {etappe.tipps && (
                <div className="bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
                  <p className="text-xs font-medium text-amber-700 mb-1">💡 Tipps</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{etappe.tipps}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
