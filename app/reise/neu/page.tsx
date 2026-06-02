// app/reise/neu/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

type Schritt = 'basis' | 'etappe' | 'kosten' | 'fertig';

const VERKEHRSMITTEL = ['Auto','Bahn','Fahrrad','Fähre','Flugzeug','Bus','Fuß','Sonstiges'];
const UNTERKUNFT_TYPEN = ['Hotel','Ferienwohnung','Camping','Hostel','Bauernhof','Verwandte','Sonstiges'];
const JAHRESZEITEN = ['Frühling','Sommer','Herbst','Winter'];

interface EtappeFormular {
  titel: string;
  ort: string;
  datum_von: string;
  datum_bis: string;
  verkehrsmittel: string[];
  unterkunft_typ: string;
  unterkunft_name: string;
  kosten_unterkunft: string;
  kosten_transport: string;
  kosten_verpflegung: string;
  kosten_aktivitaeten: string;
  kosten_sonstiges: string;
  tipps: string;
  kinderwagen: string;
}

const leerEtappe = (): EtappeFormular => ({
  titel:'', ort:'', datum_von:'', datum_bis:'',
  verkehrsmittel:[], unterkunft_typ:'', unterkunft_name:'',
  kosten_unterkunft:'', kosten_transport:'', kosten_verpflegung:'',
  kosten_aktivitaeten:'', kosten_sonstiges:'', tipps:'', kinderwagen:'',
});

const euroCent = (v: string) => Math.round((parseFloat(v.replace(',','.')) || 0) * 100);
const etappeGesamt = (e: EtappeFormular) =>
  ['kosten_unterkunft','kosten_transport','kosten_verpflegung','kosten_aktivitaeten','kosten_sonstiges']
    .reduce((s, k) => s + (parseFloat((e as any)[k].replace(',','.')) || 0), 0);

export default function ReiseNeuPage() {
  const { session, profil } = useAuth();
  const router = useRouter();
  const [schritt, setSchritt] = useState<Schritt>('basis');
  const [laden, setLaden]     = useState(false);
  const [fehler, setFehler]   = useState('');
  const [reiseId, setReiseId] = useState<string | null>(null);

  // Schritt 1: Basisdaten
  const [titel, setTitel]               = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [datumVon, setDatumVon]         = useState('');
  const [datumBis, setDatumBis]         = useState('');
  const [personen, setPersonen]         = useState('2');
  const [kinderMin, setKinderMin]       = useState('');
  const [kinderMax, setKinderMax]       = useState('');
  const [jahreszeit, setJahreszeit]     = useState('');

  // Schritt 2: Etappen
  const [etappen, setEtappen]           = useState<EtappeFormular[]>([leerEtappe()]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-5xl">🔒</span>
          <h2 className="text-xl font-semibold mt-4 mb-2">Anmeldung erforderlich</h2>
          <p className="text-gray-500 text-sm mb-6">Bitte melde dich an, um eine Reise zu erstellen.</p>
          <a href="/login" className="btn-primary">Zur Anmeldung</a>
        </div>
      </div>
    );
  }

  // ── Schritt 1 speichern ──────────────────────────────────────
  const basisSpeichern = async () => {
    if (!titel || !datumVon || !datumBis) { setFehler('Bitte alle Pflichtfelder ausfüllen.'); return; }
    setFehler(''); setLaden(true);
    const { data, error } = await supabase.from('reisen').insert({
      ersteller_id:   session.user.id,
      titel, beschreibung: beschreibung || null,
      datum_von: datumVon, datum_bis: datumBis,
      personen_anzahl: parseInt(personen) || 2,
      kinder_alter_min: kinderMin ? parseInt(kinderMin) : null,
      kinder_alter_max: kinderMax ? parseInt(kinderMax) : null,
      jahreszeit: jahreszeit || null,
      veroeffentlicht: false,
    }).select('id').single();
    setLaden(false);
    if (error) { setFehler(error.message); return; }
    setReiseId(data.id);
    setSchritt('etappe');
  };

  // ── Schritt 2: Etappen speichern ─────────────────────────────
  const etappenSpeichern = async () => {
    if (!reiseId) return;
    const ungueltig = etappen.find(e => !e.titel || !e.ort || !e.datum_von || !e.datum_bis || e.verkehrsmittel.length === 0);
    if (ungueltig) { setFehler('Bitte alle Etappen vollständig ausfüllen (Titel, Ort, Datum, Verkehrsmittel).'); return; }
    setFehler(''); setLaden(true);
    const rows = etappen.map((e, idx) => ({
      reise_id:               reiseId,
      ersteller_id:           session.user.id,
      reihenfolge:            idx + 1,
      titel:                  e.titel,
      ort:                    e.ort,
      datum_von:              e.datum_von,
      datum_bis:              e.datum_bis,
      verkehrsmittel:         e.verkehrsmittel,
      unterkunft_typ:         e.unterkunft_typ || null,
      unterkunft_name:        e.unterkunft_name || null,
      kosten_unterkunft_cent:  euroCent(e.kosten_unterkunft),
      kosten_transport_cent:   euroCent(e.kosten_transport),
      kosten_verpflegung_cent: euroCent(e.kosten_verpflegung),
      kosten_aktivitaeten_cent:euroCent(e.kosten_aktivitaeten),
      kosten_sonstiges_cent:   euroCent(e.kosten_sonstiges),
      tipps:                  e.tipps || null,
      kinderwagen_geeignet:   e.kinderwagen === 'ja' ? true : e.kinderwagen === 'nein' ? false : null,
    }));
    const { error } = await supabase.from('etappen').insert(rows);
    setLaden(false);
    if (error) { setFehler(error.message); return; }
    setSchritt('fertig');
  };

  // ── Veröffentlichen ──────────────────────────────────────────
  const veroeffentlichen = async () => {
    if (!reiseId) return;
    setLaden(true);
    await supabase.from('reisen').update({ veroeffentlicht: true }).eq('id', reiseId);
    setLaden(false);
    router.push(`/reise/${reiseId}`);
  };

  const etappeAktualisieren = (idx: number, feld: keyof EtappeFormular, wert: any) =>
    setEtappen(prev => prev.map((e, i) => i === idx ? { ...e, [feld]: wert } : e));

  const vmToggle = (idx: number, vm: string) =>
    setEtappen(prev => prev.map((e, i) => i === idx
      ? { ...e, verkehrsmittel: e.verkehrsmittel.includes(vm) ? e.verkehrsmittel.filter(v => v !== vm) : [...e.verkehrsmittel, vm] }
      : e));

  // ── Fortschrittsanzeige ──────────────────────────────────────
  const schritte = ['basis','etappe','fertig'];
  const schrittIdx = schritte.indexOf(schritt === 'kosten' ? 'etappe' : schritt);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reise dokumentieren</h1>
      <p className="text-gray-500 mb-8">Teile deine Familienreise mit der Community</p>

      {/* Fortschrittsbalken */}
      <div className="flex items-center gap-2 mb-10">
        {['Basisdaten','Etappen','Fertig'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              i <= schrittIdx ? 'bg-teal-400 text-white' : 'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className={`text-xs ${i <= schrittIdx ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${i < schrittIdx ? 'bg-teal-400' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      {fehler && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          ⚠️ {fehler}
        </div>
      )}

      {/* ══ SCHRITT 1: Basisdaten ══════════════════════════════ */}
      {schritt === 'basis' && (
        <div className="space-y-5">
          <Abschnitt titel="Reise-Titel *">
            <input value={titel} onChange={e => setTitel(e.target.value)}
              placeholder="z. B. Sommerurlaub Ostseeküste 2024"
              className="eingabe" />
          </Abschnitt>

          <Abschnitt titel="Beschreibung">
            <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
              rows={3} placeholder="Was macht diese Reise besonders?"
              className="eingabe resize-none" />
          </Abschnitt>

          <div className="grid grid-cols-2 gap-4">
            <Abschnitt titel="Reisebeginn *">
              <input type="date" value={datumVon} onChange={e => setDatumVon(e.target.value)} className="eingabe" />
            </Abschnitt>
            <Abschnitt titel="Reiseende *">
              <input type="date" value={datumBis} onChange={e => setDatumBis(e.target.value)} className="eingabe" />
            </Abschnitt>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Abschnitt titel="Personen *">
              <input type="number" min="1" max="20" value={personen} onChange={e => setPersonen(e.target.value)} className="eingabe" />
            </Abschnitt>
            <Abschnitt titel="Kinder ab (Jahre)">
              <input type="number" min="0" max="17" value={kinderMin} onChange={e => setKinderMin(e.target.value)} placeholder="0" className="eingabe" />
            </Abschnitt>
            <Abschnitt titel="Kinder bis (Jahre)">
              <input type="number" min="0" max="17" value={kinderMax} onChange={e => setKinderMax(e.target.value)} placeholder="12" className="eingabe" />
            </Abschnitt>
          </div>

          <Abschnitt titel="Jahreszeit">
            <div className="flex gap-2 flex-wrap">
              {JAHRESZEITEN.map(j => (
                <button key={j} type="button"
                  onClick={() => setJahreszeit(prev => prev === j ? '' : j)}
                  className={`chip border px-4 py-2 rounded-xl text-sm transition-all ${
                    jahreszeit === j ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                  }`}>{j}</button>
              ))}
            </div>
          </Abschnitt>

          <button onClick={basisSpeichern} disabled={laden} className="btn-primary w-full py-3 text-base mt-2">
            {laden ? 'Speichern …' : 'Weiter: Etappen →'}
          </button>
        </div>
      )}

      {/* ══ SCHRITT 2: Etappen ════════════════════════════════ */}
      {schritt === 'etappe' && (
        <div>
          {etappen.map((etappe, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Etappe {idx + 1}</h3>
                {etappen.length > 1 && (
                  <button onClick={() => setEtappen(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-400 hover:text-red-600">entfernen</button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Abschnitt titel="Titel *">
                    <input value={etappe.titel} onChange={e => etappeAktualisieren(idx,'titel',e.target.value)}
                      placeholder="z. B. Ankunft Lübeck" className="eingabe" />
                  </Abschnitt>
                  <Abschnitt titel="Ort *">
                    <input value={etappe.ort} onChange={e => etappeAktualisieren(idx,'ort',e.target.value)}
                      placeholder="z. B. Lübeck" className="eingabe" />
                  </Abschnitt>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Abschnitt titel="Von *">
                    <input type="date" value={etappe.datum_von} onChange={e => etappeAktualisieren(idx,'datum_von',e.target.value)} className="eingabe" />
                  </Abschnitt>
                  <Abschnitt titel="Bis *">
                    <input type="date" value={etappe.datum_bis} onChange={e => etappeAktualisieren(idx,'datum_bis',e.target.value)} className="eingabe" />
                  </Abschnitt>
                </div>

                <Abschnitt titel="Verkehrsmittel *">
                  <div className="flex flex-wrap gap-2">
                    {VERKEHRSMITTEL.map(vm => (
                      <button key={vm} type="button" onClick={() => vmToggle(idx, vm)}
                        className={`chip border px-3 py-1.5 text-xs rounded-xl transition-all ${
                          etappe.verkehrsmittel.includes(vm) ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                        }`}>{vm}</button>
                    ))}
                  </div>
                </Abschnitt>

                <div className="grid grid-cols-2 gap-3">
                  <Abschnitt titel="Unterkunft-Typ">
                    <select value={etappe.unterkunft_typ} onChange={e => etappeAktualisieren(idx,'unterkunft_typ',e.target.value)} className="eingabe">
                      <option value="">-- wählen --</option>
                      {UNTERKUNFT_TYPEN.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </Abschnitt>
                  <Abschnitt titel="Unterkunft-Name">
                    <input value={etappe.unterkunft_name} onChange={e => etappeAktualisieren(idx,'unterkunft_name',e.target.value)}
                      placeholder="z. B. Strandhotel" className="eingabe" />
                  </Abschnitt>
                </div>

                {/* Kosten */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Kosten in € (Gesamt)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['kosten_unterkunft','🏨 Unterkunft'],
                      ['kosten_transport','🚗 Transport'],
                      ['kosten_verpflegung','🍽️ Verpflegung'],
                      ['kosten_aktivitaeten','🎟️ Aktivitäten'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input type="text" inputMode="decimal"
                          value={(etappe as any)[key]}
                          onChange={e => etappeAktualisieren(idx, key as keyof EtappeFormular, e.target.value)}
                          placeholder="0" className="eingabe text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between items-center bg-teal-50 rounded-lg px-3 py-2 border border-teal-100">
                    <span className="text-xs text-teal-700">Etappe gesamt</span>
                    <span className="text-sm font-semibold text-teal-600">
                      {etappeGesamt(etappe).toFixed(2).replace('.',',')} €
                    </span>
                  </div>
                </div>

                <Abschnitt titel="Kinderwagentauglich?">
                  <div className="flex gap-2">
                    {[['ja','✅ Ja'],['nein','❌ Nein'],['','Weiß nicht']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => etappeAktualisieren(idx,'kinderwagen',val)}
                        className={`chip border px-4 py-1.5 text-xs rounded-xl transition-all ${
                          etappe.kinderwagen === val ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-600 border-gray-200'
                        }`}>{label}</button>
                    ))}
                  </div>
                </Abschnitt>

                <Abschnitt titel="Tipps für andere Familien">
                  <textarea value={etappe.tipps} onChange={e => etappeAktualisieren(idx,'tipps',e.target.value)}
                    rows={2} placeholder="Besonderheiten, Spartipps, Empfehlungen …"
                    className="eingabe resize-none text-sm" />
                </Abschnitt>
              </div>
            </div>
          ))}

          <button onClick={() => setEtappen(prev => [...prev, leerEtappe()])}
            className="w-full border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-xl p-3 text-sm text-teal-500 hover:text-teal-700 transition-colors mb-5">
            + Weitere Etappe
          </button>

          <div className="flex gap-3">
            <button onClick={() => setSchritt('basis')} className="btn-ghost flex-1">← Zurück</button>
            <button onClick={etappenSpeichern} disabled={laden} className="btn-primary flex-2 flex-1 py-3">
              {laden ? 'Speichern …' : 'Etappen speichern →'}
            </button>
          </div>
        </div>
      )}

      {/* ══ SCHRITT 3: Fertig ════════════════════════════════ */}
      {schritt === 'fertig' && (
        <div className="text-center py-8">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reise gespeichert!</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Deine Reise ist als Entwurf gespeichert. Möchtest du sie jetzt für die Community veröffentlichen?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={veroeffentlichen} disabled={laden} className="btn-primary px-8 py-3 text-base">
              {laden ? 'Veröffentlichen …' : '🌍 Jetzt veröffentlichen'}
            </button>
            <a href={`/reise/${reiseId}`} className="btn-ghost px-8 py-3 text-base text-center">
              Vorschau ansehen
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-5">
            Du kannst die Reise auch später in deinem Profil veröffentlichen.
          </p>
        </div>
      )}
    </div>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{titel}</label>
      {children}
    </div>
  );
}
