// components/ReiseNeuClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Schritt = 'basis' | 'etappe' | 'fertig';

const MONATE = ['Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember'];
const JAHRE = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
const VERKEHRSMITTEL = ['Auto','Bahn','Fahrrad','Fähre','Flugzeug','Bus','Fuß','Sonstiges'];
const UNTERKUNFT_TYPEN = ['Hotel','Ferienwohnung','Camping','Zelt','Jugendherberge',
  'Hostel','Bauernhof','Verwandte','Sonstiges'];
const JAHRESZEITEN = ['Frühling','Sommer','Herbst','Winter'];

interface EtappeFormular {
  ort_von: string;
  ort_bis: string;
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

const leerEtappe = (ort_von = ''): EtappeFormular => ({
  ort_von, ort_bis: '',
  verkehrsmittel: [],
  unterkunft_typ: '', unterkunft_name: '',
  kosten_unterkunft: '', kosten_transport: '',
  kosten_verpflegung: '', kosten_aktivitaeten: '',
  kosten_sonstiges: '', tipps: '', kinderwagen: '',
});

const euroCent = (v: string) => Math.round((parseFloat(v.replace(',','.')) || 0) * 100);

const etappeGesamt = (e: EtappeFormular) =>
  ['kosten_unterkunft','kosten_transport','kosten_verpflegung','kosten_aktivitaeten','kosten_sonstiges']
    .reduce((s, k) => s + (parseFloat((e as any)[k].replace(',','.')) || 0), 0);

async function geocodeOrt(ort: string): Promise<{lat: number|null, lng: number|null}> {
  if (!ort.trim()) return { lat: null, lng: null };
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ort)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'FamTrip/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* optional */ }
  return { lat: null, lng: null };
}

export default function ReiseNeuClient() {
  const { session } = useAuth();
  const router = useRouter();
  const [schritt, setSchritt] = useState<Schritt>('basis');
  const [laden, setLaden]     = useState(false);
  const [fehler, setFehler]   = useState('');
  const [reiseId, setReiseId] = useState<string | null>(null);

  // Basisdaten
  const [titel, setTitel]               = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [gesamtkommentar, setGesamtkommentar] = useState('');
  const [monat, setMonat]               = useState(String(new Date().getMonth() + 1));
  const [jahr, setJahr]                 = useState(String(new Date().getFullYear()));
  const [dauerTage, setDauerTage]       = useState('');
  const [personen, setPersonen]         = useState('2');
  const [kinderMin, setKinderMin]       = useState('');
  const [kinderMax, setKinderMax]       = useState('');
  const [jahreszeit, setJahreszeit]     = useState('');
  const [etappen, setEtappen]           = useState<EtappeFormular[]>([leerEtappe()]);

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-semibold mt-4 mb-2">Anmeldung erforderlich</h2>
        <a href="/login" className="btn-primary mt-4 inline-block">Zur Anmeldung</a>
      </div>
    </div>
  );

  const basisSpeichern = async () => {
    if (!titel) { setFehler('Bitte einen Titel eingeben.'); return; }
    setFehler(''); setLaden(true);
    const monatNum   = parseInt(monat) || 1;
    const jahrNum    = parseInt(jahr);
    const datumVon   = `${jahrNum}-${String(monatNum).padStart(2,'0')}-01`;
    const letzterTag = new Date(jahrNum, monatNum, 0).getDate();
    const datumBis   = `${jahrNum}-${String(monatNum).padStart(2,'0')}-${letzterTag}`;

    const { data, error } = await supabase.from('reisen').insert({
      ersteller_id:    session.user.id,
      titel,
      beschreibung:    beschreibung || null,
      gesamtkommentar: gesamtkommentar || null,
      datum_von:       datumVon,
      datum_bis:       datumBis,
      dauer_tage:      dauerTage ? parseInt(dauerTage) : null,
      personen_anzahl: parseInt(personen) || 2,
      kinder_alter_min: kinderMin ? parseInt(kinderMin) : null,
      kinder_alter_max: kinderMax ? parseInt(kinderMax) : null,
      jahreszeit:       jahreszeit || null,
      veroeffentlicht:  false,
    }).select('id').single();

    setLaden(false);
    if (error) { setFehler(error.message); return; }
    setReiseId(data.id);
    setSchritt('etappe');
  };

  const etappenSpeichern = async () => {
    if (!reiseId) return;
    const ungueltig = etappen.find(e => !e.ort_von || !e.ort_bis || e.verkehrsmittel.length === 0);
    if (ungueltig) { setFehler('Bitte bei allen Etappen Von-Ort, Bis-Ort und Verkehrsmittel angeben.'); return; }
    setFehler(''); setLaden(true);

    // Alle Orte geocodieren
    const geoVon = await Promise.all(etappen.map(e => geocodeOrt(e.ort_von)));
    const geoBis = await Promise.all(etappen.map(e => geocodeOrt(e.ort_bis)));

    const rows = etappen.map((e, idx) => ({
      reise_id:                reiseId,
      ersteller_id:            session.user.id,
      reihenfolge:             idx + 1,
      titel:                   `${e.ort_von} → ${e.ort_bis}`,
      ort:                     e.ort_von,
      ort_von:                 e.ort_von,
      ort_bis:                 e.ort_bis,
      lat:                     geoVon[idx].lat,
      lng:                     geoVon[idx].lng,
      lat_von:                 geoVon[idx].lat,
      lng_von:                 geoVon[idx].lng,
      lat_bis:                 geoBis[idx].lat,
      lng_bis:                 geoBis[idx].lng,
      datum_von:               `${parseInt(jahr)}-${String(parseInt(monat)).padStart(2,'0')}-01`,
      datum_bis:               `${parseInt(jahr)}-${String(parseInt(monat)).padStart(2,'0')}-${new Date(parseInt(jahr), parseInt(monat), 0).getDate()}`,
      verkehrsmittel:          e.verkehrsmittel,
      unterkunft_typ:          e.unterkunft_typ || null,
      unterkunft_name:         e.unterkunft_name || null,
      kosten_unterkunft_cent:  euroCent(e.kosten_unterkunft),
      kosten_transport_cent:   euroCent(e.kosten_transport),
      kosten_verpflegung_cent: euroCent(e.kosten_verpflegung),
      kosten_aktivitaeten_cent:euroCent(e.kosten_aktivitaeten),
      kosten_sonstiges_cent:   euroCent(e.kosten_sonstiges),
      tipps:                   e.tipps || null,
      kinderwagen_geeignet:    e.kinderwagen === 'ja' ? true : e.kinderwagen === 'nein' ? false : null,
    }));

    const { error } = await supabase.from('etappen').insert(rows);
    setLaden(false);
    if (error) { setFehler(error.message); return; }
    setSchritt('fertig');
  };

  const veroeffentlichen = async () => {
    if (!reiseId) return;
    setLaden(true);
    await supabase.from('reisen').update({ veroeffentlicht: true }).eq('id', reiseId);
    setLaden(false);
    router.push(`/reise/${reiseId}`);
  };

  const updateEtappe = (idx: number, feld: keyof EtappeFormular, wert: any) =>
    setEtappen(prev => prev.map((e, i) => i === idx ? { ...e, [feld]: wert } : e));

  const vmToggle = (idx: number, vm: string) =>
    setEtappen(prev => prev.map((e, i) => i === idx
      ? { ...e, verkehrsmittel: e.verkehrsmittel.includes(vm)
          ? e.verkehrsmittel.filter(v => v !== vm)
          : [...e.verkehrsmittel, vm] }
      : e));

  const etappeHinzufuegen = () => {
    // Von-Ort der neuen Etappe = Bis-Ort der letzten Etappe
    const letzteEtappe = etappen[etappen.length - 1];
    setEtappen(prev => [...prev, leerEtappe(letzteEtappe?.ort_bis ?? '')]);
  };

  const schrittIdx = ['basis','etappe','fertig'].indexOf(schritt);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reise dokumentieren</h1>
      <p className="text-gray-500 mb-8">Teile deine Familienreise mit der Community</p>

      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-10">
        {['Basisdaten','Etappen','Fertig'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              i <= schrittIdx ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className={`text-xs ${i <= schrittIdx ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${i < schrittIdx ? 'bg-emerald-400' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      {fehler && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">{fehler}</div>
      )}

      {/* ── SCHRITT 1: Basisdaten ── */}
      {schritt === 'basis' && (
        <div className="space-y-5">
          <Feld label="Reise-Titel *">
            <input value={titel} onChange={e => setTitel(e.target.value)}
              placeholder="z. B. Radtour Osnabrücker Land" className="eingabe" />
          </Feld>

          <Feld label="Kurzbeschreibung">
            <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
              rows={2} placeholder="Was macht diese Reise besonders?" className="eingabe resize-none" />
          </Feld>

          <Feld label="Gesamtfazit (kann auch später ergänzt werden)">
            <textarea value={gesamtkommentar} onChange={e => setGesamtkommentar(e.target.value)}
              rows={3} placeholder="Wie war die Reise insgesamt? Was würdet ihr empfehlen?"
              className="eingabe resize-none" />
          </Feld>

          <div className="grid grid-cols-2 gap-4">
            <Feld label="Reisemonat *">
              <select value={monat} onChange={e => setMonat(e.target.value)} className="eingabe">
                {MONATE.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </Feld>
            <Feld label="Jahr *">
              <select value={jahr} onChange={e => setJahr(e.target.value)} className="eingabe">
                {JAHRE.map(j => <option key={j}>{j}</option>)}
              </select>
            </Feld>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Feld label="Reisedauer (Tage) *">
              <input type="number" min="1" max="365" value={dauerTage}
                onChange={e => setDauerTage(e.target.value)}
                placeholder="z. B. 7" className="eingabe" />
              <p className="text-xs text-gray-400 mt-1">Für Kosten pro Tag</p>
            </Feld>
            <Feld label="Personen *">
              <input type="number" min="1" max="20" value={personen}
                onChange={e => setPersonen(e.target.value)} className="eingabe" />
            </Feld>
            <Feld label="Kinder ab (J.)">
              <input type="number" min="0" max="17" value={kinderMin}
                onChange={e => setKinderMin(e.target.value)} placeholder="0" className="eingabe" />
            </Feld>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Feld label="Kinder bis (J.)">
              <input type="number" min="0" max="17" value={kinderMax}
                onChange={e => setKinderMax(e.target.value)} placeholder="12" className="eingabe" />
            </Feld>
            <Feld label="Jahreszeit">
              <select value={jahreszeit} onChange={e => setJahreszeit(e.target.value)} className="eingabe">
                <option value="">-- wählen --</option>
                {JAHRESZEITEN.map(j => <option key={j}>{j}</option>)}
              </select>
            </Feld>
          </div>

          <button onClick={basisSpeichern} disabled={laden} className="btn-primary w-full py-3 text-base">
            {laden ? 'Speichern ...' : 'Weiter: Etappen →'}
          </button>
        </div>
      )}

      {/* ── SCHRITT 2: Etappen ── */}
      {schritt === 'etappe' && (
        <div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 text-sm text-emerald-700">
            💡 Gib für jede Etappe den Startort und das Ziel ein. Ab der zweiten Etappe wird der Startort automatisch vorbelegt.
          </div>

          {etappen.map((etappe, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Etappe {idx + 1}
                  {etappe.ort_von && etappe.ort_bis && (
                    <span className="text-gray-400 font-normal text-sm ml-2">
                      {etappe.ort_von} → {etappe.ort_bis}
                    </span>
                  )}
                </h3>
                {etappen.length > 1 && (
                  <button onClick={() => setEtappen(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-400 hover:text-red-600">entfernen</button>
                )}
              </div>

              <div className="space-y-4">
                {/* Von / Bis */}
                <div className="grid grid-cols-2 gap-3">
                  <Feld label="Von (Startort) *">
                    <input value={etappe.ort_von}
                      onChange={e => updateEtappe(idx,'ort_von',e.target.value)}
                      placeholder="z. B. Osnabrück" className="eingabe" />
                  </Feld>
                  <Feld label="Bis (Zielort) *">
                    <input value={etappe.ort_bis}
                      onChange={e => {
                        updateEtappe(idx,'ort_bis',e.target.value);
                        // Nächste Etappe vorbelegen wenn sie leer ist
                        if (etappen[idx+1] && !etappen[idx+1].ort_von) {
                          updateEtappe(idx+1,'ort_von',e.target.value);
                        }
                      }}
                      placeholder="z. B. Wallenhorst" className="eingabe" />
                  </Feld>
                </div>

                <Feld label="Verkehrsmittel *">
                  <div className="flex flex-wrap gap-2">
                    {VERKEHRSMITTEL.map(vm => (
                      <button key={vm} type="button" onClick={() => vmToggle(idx, vm)}
                        className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                          etappe.verkehrsmittel.includes(vm)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                        }`}>{vm}</button>
                    ))}
                  </div>
                </Feld>

                <div className="grid grid-cols-2 gap-3">
                  <Feld label="Unterkunft-Typ">
                    <select value={etappe.unterkunft_typ}
                      onChange={e => updateEtappe(idx,'unterkunft_typ',e.target.value)}
                      className="eingabe">
                      <option value="">-- wählen --</option>
                      {UNTERKUNFT_TYPEN.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </Feld>
                  <Feld label="Unterkunft-Name">
                    <input value={etappe.unterkunft_name}
                      onChange={e => updateEtappe(idx,'unterkunft_name',e.target.value)}
                      placeholder="z. B. Hotel Muster" className="eingabe" />
                  </Feld>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Kosten in € (Gesamt für alle Personen)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['kosten_unterkunft','Unterkunft'],
                      ['kosten_transport','Transport'],
                      ['kosten_verpflegung','Verpflegung'],
                      ['kosten_aktivitaeten','Aktivitäten'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input type="text" inputMode="decimal"
                          value={(etappe as any)[key]}
                          onChange={e => updateEtappe(idx, key as keyof EtappeFormular, e.target.value)}
                          placeholder="0" className="eingabe text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                    <span className="text-xs text-emerald-700">Etappe gesamt</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {etappeGesamt(etappe).toFixed(2).replace('.',',')} €
                    </span>
                  </div>
                </div>

                <Feld label="Kinderwagentauglich?">
                  <div className="flex gap-2">
                    {[['ja','✅ Ja'],['nein','❌ Nein'],['','Weiß nicht']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => updateEtappe(idx,'kinderwagen',val)}
                        className={`px-4 py-1.5 text-xs rounded-xl border transition-all ${
                          etappe.kinderwagen === val
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}>{label}</button>
                    ))}
                  </div>
                </Feld>

                <Feld label="Tipps für andere Familien">
                  <textarea value={etappe.tipps}
                    onChange={e => updateEtappe(idx,'tipps',e.target.value)}
                    rows={3} placeholder="Besonderheiten, Spartipps, Empfehlungen ..."
                    className="eingabe resize-none text-sm" />
                </Feld>
              </div>
            </div>
          ))}

          <button onClick={etappeHinzufuegen}
            className="w-full border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl p-3 text-sm text-emerald-500 hover:text-emerald-700 transition-colors mb-5">
            + Weitere Etappe
          </button>

          <div className="flex gap-3">
            <button onClick={() => setSchritt('basis')} className="btn-ghost flex-1">← Zurück</button>
            <button onClick={etappenSpeichern} disabled={laden} className="btn-primary flex-1 py-3">
              {laden ? 'Speichern & Geocoding ...' : 'Etappen speichern →'}
            </button>
          </div>
        </div>
      )}

      {/* ── SCHRITT 3: Fertig ── */}
      {schritt === 'fertig' && (
        <div className="text-center py-8">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reise gespeichert!</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Deine Reise ist als Entwurf gespeichert. Möchtest du sie jetzt veröffentlichen?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={veroeffentlichen} disabled={laden} className="btn-primary px-8 py-3 text-base">
              {laden ? 'Wird veröffentlicht ...' : '🌍 Jetzt veröffentlichen'}
            </button>
            <a href={`/reise/${reiseId}`} className="btn-ghost px-8 py-3 text-base text-center">
              Vorschau ansehen
            </a>
          </div>
        </div>
      )}
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
