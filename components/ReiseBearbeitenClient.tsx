// components/ReiseBearbeitenClient.tsx
'use client';

function monatZuJahreszeit(monat: number): string {
  if ([12,1,2].includes(monat))  return 'Winter';
  if ([3,4,5].includes(monat))   return 'Frühling';
  if ([6,7,8].includes(monat))   return 'Sommer';
  return 'Herbst';
}

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase, Reise, Etappe, centZuEuro } from '../lib/supabase';

const MONATE = ['Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember'];
const JAHRE = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
const UNTERKUNFT_TYPEN = ['Hotel','Ferienwohnung','Camping','Zelt','Jugendherberge',
  'Hostel','Bauernhof','Verwandte','Sonstiges'];
const VERKEHRSMITTEL = ['Auto','Bahn','Fahrrad','Fähre','Flugzeug','Bus','Fuß','Sonstiges'];


const euroCent = (v: string) => Math.round((parseFloat(v.replace(',','.')) || 0) * 100);

interface EtappeEdit {
  id: string;
  titel: string;
  ort: string;
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
  offen: boolean;
}

function etappeZuEdit(e: Etappe): EtappeEdit {
  return {
    id: e.id,
    titel: e.titel,
    ort: e.ort,
    verkehrsmittel: e.verkehrsmittel ?? [],
    unterkunft_typ: e.unterkunft_typ ?? '',
    unterkunft_name: e.unterkunft_name ?? '',
    kosten_unterkunft: e.kosten_unterkunft_cent ? String(e.kosten_unterkunft_cent / 100) : '',
    kosten_transport:  e.kosten_transport_cent  ? String(e.kosten_transport_cent  / 100) : '',
    kosten_verpflegung:e.kosten_verpflegung_cent? String(e.kosten_verpflegung_cent/ 100) : '',
    kosten_aktivitaeten:e.kosten_aktivitaeten_cent?String(e.kosten_aktivitaeten_cent/100):'',
    kosten_sonstiges:  e.kosten_sonstiges_cent  ? String(e.kosten_sonstiges_cent  / 100) : '',
    tipps: e.tipps ?? '',
    kinderwagen: e.kinderwagen_geeignet === true ? 'ja' : e.kinderwagen_geeignet === false ? 'nein' : '',
    offen: false,
  };
}

export default function ReiseBearbeitenClient() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reiseId = searchParams.get('id');

  const [reise, setReise]     = useState<Reise | null>(null);
  const [etappen, setEtappen] = useState<EtappeEdit[]>([]);
  const [laden, setLaden]     = useState(true);
  const [fehler, setFehler]   = useState('');
  const [erfolg, setErfolg]   = useState('');

  // Basisdaten
  const [titel, setTitel]               = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [gesamtkommentar, setGesamtkommentar] = useState('');
  const [monat, setMonat]               = useState('1');
  const [jahr, setJahr]                 = useState(String(new Date().getFullYear()));
  const [personen, setPersonen]         = useState('2');
  const [kinderMin, setKinderMin]       = useState('');
  const [kinderMax, setKinderMax]       = useState('');
  const [jahreszeit, setJahreszeit]     = useState('');

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
        if (d.datum_von) {
          const dt = new Date(d.datum_von);
          setMonat(String(dt.getMonth() + 1));
          setJahr(String(dt.getFullYear()));
        }
      }
      if (e.data) setEtappen((e.data as Etappe[]).map(etappeZuEdit));
      setLaden(false);
    });
  }, [reiseId]);

  const basisSpeichern = async () => {
    if (!titel) { setFehler('Bitte einen Titel eingeben.'); return; }
    setFehler('');
    const monatNum = parseInt(monat) || 1;
    const jahrNum  = parseInt(jahr);
    const datumVon = `${jahrNum}-${String(monatNum).padStart(2,'0')}-01`;
    const letzterTag = new Date(jahrNum, monatNum, 0).getDate();
    const datumBis = `${jahrNum}-${String(monatNum).padStart(2,'0')}-${letzterTag}`;

    const { error } = await supabase.from('reisen').update({
      titel, beschreibung: beschreibung || null,
      gesamtkommentar: gesamtkommentar || null,
      datum_von: datumVon, datum_bis: datumBis,
      personen_anzahl: parseInt(personen) || 2,
      kinder_alter_min: kinderMin ? parseInt(kinderMin) : null,
      kinder_alter_max: kinderMax ? parseInt(kinderMax) : null,
      jahreszeit: monatZuJahreszeit(parseInt(monat)),
    }).eq('id', reiseId);

    if (error) { setFehler(error.message); return; }
    setErfolg('Basisdaten gespeichert!');
    setTimeout(() => setErfolg(''), 3000);
  };

  const etappeSpeichern = async (idx: number) => {
    const e = etappen[idx];
    setFehler('');

    // Geocoding
    let lat = null, lng = null;
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.ort)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'FamTrip/1.0' } }
      );
      const geoData = await geo.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch { /* optional */ }

    const { error } = await supabase.from('etappen').update({
      titel: e.titel, ort: e.ort, lat, lng,
      verkehrsmittel: e.verkehrsmittel,
      unterkunft_typ: e.unterkunft_typ || null,
      unterkunft_name: e.unterkunft_name || null,
      kosten_unterkunft_cent:   euroCent(e.kosten_unterkunft),
      kosten_transport_cent:    euroCent(e.kosten_transport),
      kosten_verpflegung_cent:  euroCent(e.kosten_verpflegung),
      kosten_aktivitaeten_cent: euroCent(e.kosten_aktivitaeten),
      kosten_sonstiges_cent:    euroCent(e.kosten_sonstiges),
      tipps: e.tipps || null,
      kinderwagen_geeignet: e.kinderwagen === 'ja' ? true : e.kinderwagen === 'nein' ? false : null,
    }).eq('id', e.id);

    if (error) { setFehler(error.message); return; }
    setEtappen(prev => prev.map((et, i) => i === idx ? { ...et, offen: false } : et));
    setErfolg(`Etappe "${e.titel}" gespeichert!`);
    setTimeout(() => setErfolg(''), 3000);
  };

  const etappeLoeschen = async (id: string) => {
    if (!confirm('Etappe wirklich löschen?')) return;
    await supabase.from('etappen').delete().eq('id', id);
    setEtappen(prev => prev.filter(e => e.id !== id));
  };

  const updateEtappe = (idx: number, feld: keyof EtappeEdit, wert: any) =>
    setEtappen(prev => prev.map((e, i) => i === idx ? { ...e, [feld]: wert } : e));

  const vmToggle = (idx: number, vm: string) =>
    setEtappen(prev => prev.map((e, i) => i === idx
      ? { ...e, verkehrsmittel: e.verkehrsmittel.includes(vm)
          ? e.verkehrsmittel.filter(v => v !== vm)
          : [...e.verkehrsmittel, vm] }
      : e));

  if (laden) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!session || (reise && reise.ersteller_id !== session.user.id)) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-semibold mt-4">Kein Zugriff</h2>
        <p className="text-gray-500 mt-2">Nur der Ersteller kann diese Reise bearbeiten.</p>
        <a href="/profil" className="btn-primary mt-4 inline-block">Zum Profil</a>
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

      {/* ── Basisdaten ── */}
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
              rows={3} placeholder="Wie war die Reise insgesamt? Empfehlungen für andere Familien?"
              className="eingabe resize-none" />
          </Feld>
          <div className="grid grid-cols-2 gap-4">
            <Feld label="Reisemonat">
              <select value={monat} onChange={e => setMonat(e.target.value)} className="eingabe">
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
              <input type="number" min="1" value={personen}
                onChange={e => setPersonen(e.target.value)} className="eingabe" />
            </Feld>
            <Feld label="Kinder ab (J.)">
              <input type="number" min="0" value={kinderMin}
                onChange={e => setKinderMin(e.target.value)} placeholder="0" className="eingabe" />
            </Feld>
            <Feld label="Kinder bis (J.)">
              <input type="number" min="0" value={kinderMax}
                onChange={e => setKinderMax(e.target.value)} placeholder="12" className="eingabe" />
            </Feld>
          </div>
          <Feld label="Jahreszeit">
            <div className="flex gap-2 flex-wrap">
              {JAHRESZEITEN.map(j => (
                <button key={j} type="button"
                  onClick={() => setJahreszeit(prev => prev === j ? '' : j)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                    jahreszeit === j ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}>{j}</button>
              ))}
            </div>
          </Feld>
          <button onClick={basisSpeichern} className="btn-primary w-full py-3">
            Basisdaten speichern
          </button>
        </div>
      </div>

      {/* ── Etappen ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Etappen ({etappen.length})</h2>
          <a href={`/etappe/neu?reise_id=${reiseId}`} className="btn-primary text-sm px-4 py-2">
            + Neue Etappe
          </a>
        </div>

        {etappen.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Noch keine Etappen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {etappen.map((e, idx) => (
              <div key={e.id} className="border border-gray-100 rounded-xl overflow-hidden">

                {/* Etappen-Kopf */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer"
                  onClick={() => updateEtappe(idx, 'offen', !e.offen)}>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{e.titel}</p>
                    <p className="text-xs text-gray-400">{e.ort} · {e.verkehrsmittel.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-medium">
                      {e.offen ? '▲ Schließen' : '▼ Bearbeiten'}
                    </span>
                    <button onClick={(ev) => { ev.stopPropagation(); etappeLoeschen(e.id); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors ml-2">
                      Löschen
                    </button>
                  </div>
                </div>

                {/* Etappen-Formular */}
                {e.offen && (
                  <div className="p-4 space-y-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <Feld label="Titel *">
                        <input value={e.titel}
                          onChange={ev => updateEtappe(idx, 'titel', ev.target.value)}
                          className="eingabe" />
                      </Feld>
                      <Feld label="Ort *">
                        <input value={e.ort}
                          onChange={ev => updateEtappe(idx, 'ort', ev.target.value)}
                          className="eingabe" />
                        <p className="text-xs text-gray-400 mt-1">Wird für Karte geocodiert</p>
                      </Feld>
                    </div>

                    <Feld label="Verkehrsmittel">
                      <div className="flex flex-wrap gap-2">
                        {VERKEHRSMITTEL.map(vm => (
                          <button key={vm} type="button" onClick={() => vmToggle(idx, vm)}
                            className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                              e.verkehrsmittel.includes(vm)
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-white text-gray-600 border-gray-200'
                            }`}>{vm}</button>
                        ))}
                      </div>
                    </Feld>

                    <div className="grid grid-cols-2 gap-3">
                      <Feld label="Unterkunft-Typ">
                        <select value={e.unterkunft_typ}
                          onChange={ev => updateEtappe(idx, 'unterkunft_typ', ev.target.value)}
                          className="eingabe">
                          <option value="">-- wählen --</option>
                          {UNTERKUNFT_TYPEN.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </Feld>
                      <Feld label="Unterkunft-Name">
                        <input value={e.unterkunft_name}
                          onChange={ev => updateEtappe(idx, 'unterkunft_name', ev.target.value)}
                          placeholder="z. B. Hotel Muster" className="eingabe" />
                      </Feld>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Kosten in € (Gesamt)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['kosten_unterkunft',  'Unterkunft'],
                          ['kosten_transport',   'Transport'],
                          ['kosten_verpflegung', 'Verpflegung'],
                          ['kosten_aktivitaeten','Aktivitäten'],
                        ].map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-xs text-gray-500 mb-1">{label}</label>
                            <input type="text" inputMode="decimal"
                              value={(e as any)[key]}
                              onChange={ev => updateEtappe(idx, key as keyof EtappeEdit, ev.target.value)}
                              placeholder="0" className="eingabe text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Feld label="Kinderwagentauglich?">
                      <div className="flex gap-2">
                        {[['ja','✅ Ja'],['nein','❌ Nein'],['','Weiß nicht']].map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => updateEtappe(idx, 'kinderwagen', val)}
                            className={`px-4 py-1.5 text-xs rounded-xl border transition-all ${
                              e.kinderwagen === val
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-white text-gray-600 border-gray-200'
                            }`}>{label}</button>
                        ))}
                      </div>
                    </Feld>

                    <Feld label="Tipps für andere Familien">
                      <textarea value={e.tipps}
                        onChange={ev => updateEtappe(idx, 'tipps', ev.target.value)}
                        rows={3} className="eingabe resize-none text-sm"
                        placeholder="Besonderheiten, Spartipps, Empfehlungen ..." />
                    </Feld>

                    <button onClick={() => etappeSpeichern(idx)}
                      className="btn-primary w-full py-2.5">
                      Etappe speichern ✓
                    </button>
                  </div>
                )}
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
