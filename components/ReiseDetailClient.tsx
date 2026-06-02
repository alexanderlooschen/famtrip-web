// components/ReiseDetailClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase, Reise, Etappe, centZuEuro, datumDE, dauerTage } from '../lib/supabase';

const ReiseKarte = dynamic(() => import('./ReiseKarte'), { ssr: false });

type KostenSicht = 'gesamt' | 'pro_person' | 'pro_tag';

const VM_ICON: Record<string, string> = {
  Auto: 'Auto', Bahn: 'Bahn', Fahrrad: 'Rad', Faehre: 'Faehre',
  Flugzeug: 'Flug', Bus: 'Bus', Fuss: 'Fuss', Sonstiges: '?',
};

export default function ReiseDetailClient() {
  const { id } = useParams<{ id: string }>();
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

  if (!reise) return <p className="p-10 text-center text-gray-400">Reise nicht gefunden.</p>;

  const dauer = dauerTage(reise.datum_von, reise.datum_bis);

  const kostenWert = (cent: number) => {
    if (kostenSicht === 'pro_person') return centZuEuro(Math.round(cent / reise.personen_anzahl));
    if (kostenSicht === 'pro_tag')    return centZuEuro(Math.round(cent / dauer));
    return centZuEuro(cent);
  };

  const summe = (key: keyof Etappe) =>
    etappen.reduce((acc, e) => acc + ((e[key] as number) ?? 0), 0);

  const kostenKategorien = [
    { icon: '[U]', label: 'Unterkunft',  cent: summe('kosten_unterkunft_cent') },
    { icon: '[T]', label: 'Transport',   cent: summe('kosten_transport_cent') },
    { icon: '[V]', label: 'Verpflegung', cent: summe('kosten_verpflegung_cent') },
    { icon: '[A]', label: 'Aktivitaeten', cent: summe('kosten_aktivitaeten_cent') },
    { icon: '[S]', label: 'Sonstiges',   cent: summe('kosten_sonstiges_cent') },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <a href="/entdecken" className="hover:text-teal-600">Entdecken</a>
        <span>&gt;</span>
        <span className="text-gray-600">{reise.titel}</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-semibold text-gray-900 flex-1">{reise.titel}</h1>
          <span className={`chip text-sm px-3 py-1 ${
            reise.preisstufe === '€' ? 'preisstufe-e' :
            reise.preisstufe === '€€' ? 'preisstufe-ee' : 'preisstufe-eee'
          }`}>{reise.preisstufe}</span>
        </div>
        {reise.beschreibung && (
          <p className="text-gray-500 leading-relaxed mb-4">{reise.beschreibung}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-teal">Zeitraum: {datumDE(reise.datum_von)} - {datumDE(reise.datum_bis)}</span>
          <span className="chip chip-teal">{reise.personen_anzahl} Personen</span>
          {reise.kinder_alter_min !== null && (
            <span className="chip chip-green">Kinder ab {reise.kinder_alter_min} J.</span>
          )}
          {reise.jahreszeit && (
            <span className="chip chip-amber">{reise.jahreszeit}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { wert: `${dauer}`, label: 'Tage' },
          { wert: `${etappen.length}`, label: 'Etappen' },
          { wert: `${reise.bewertung_schnitt.toFixed(1)}`, label: 'Bewertung' },
          { wert: centZuEuro(reise.gesamtkosten_cent), label: 'Kosten', gruen: true },
        ].map(k => (
          <div key={k.label} className="card p-4 text-center">
            <p className={`text-xl font-semibold ${k.gruen ? 'text-teal-500' : 'text-gray-900'}`}>{k.wert}</p>
            <p className="text-xs text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card overflow-hidden">
            <div className="h-72 sm:h-96">
              <ReiseKarte etappen={etappen} aktiveEtappe={aktiveEtappe} onEtappeClick={setAktiveEtappe} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reiseverlauf</h2>
            <div className="space-y-3">
              {etappen.map((e, idx) => (
                <EtappeZeile key={e.id} etappe={e} nummer={idx + 1}
                  aktiv={aktiveEtappe?.id === e.id}
                  onClick={() => setAktiveEtappe(prev => prev?.id === e.id ? null : e)}
                />
              ))}
            </div>
            <a href={`/etappe/neu?reise_id=${reise.id}`}
              className="mt-4 block border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-xl p-4 text-center text-sm text-teal-500 hover:text-teal-700 transition-colors">
              + Etappe ergaenzen
            </a>
          </div>
        </div>

        <div>
          <div className="card p-5 sticky top-20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kostenuebersicht</h2>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4 text-xs">
              {(['gesamt', 'pro_person', 'pro_tag'] as KostenSicht[]).map(s => (
                <button key={s} onClick={() => setKostenSicht(s)}
                  className={`flex-1 py-2 transition-colors ${
                    kostenSicht === s ? 'bg-teal-400 text-white font-medium' : 'text-gray-500 hover:bg-gray-50'
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
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-gray-900">Gesamt</span>
              <span className="text-lg font-bold text-teal-500">{kostenWert(reise.gesamtkosten_cent)}</span>
            </div>
            <a href={`/etappe/neu?reise_id=${reise.id}`} className="btn-primary w-full text-center mt-4 block">
              Etappe hinzufuegen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function EtappeZeile({ etappe, nummer, aktiv, onClick }: {
  etappe: Etappe; nummer: number; aktiv: boolean; onClick: () => void;
}) {
  const dauer = dauerTage(etappe.datum_von, etappe.datum_bis);
  return (
    <button onClick={onClick}
      className={`w-full text-left card p-4 transition-all ${aktiv ? 'ring-2 ring-teal-400' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-teal-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {nummer}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="font-medium text-gray-900 text-sm">{etappe.titel}</p>
            <span className="text-sm font-semibold text-teal-600 flex-shrink-0">
              {centZuEuro(etappe.kosten_gesamt_cent)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{etappe.ort} - {dauer} {dauer === 1 ? 'Tag' : 'Tage'}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {etappe.verkehrsmittel.map(v => (
              <span key={v} className="chip chip-teal text-xs">{v}</span>
            ))}
            {etappe.unterkunft_typ && (
              <span className="chip chip-purple text-xs">{etappe.unterkunft_typ}</span>
            )}
          </div>
          {aktiv && etappe.tipps && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2 leading-relaxed">
              Tipp: {etappe.tipps}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
