// components/EtappeNeuClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase, Reise } from '../lib/supabase';

const VERKEHRSMITTEL = ['Auto','Bahn','Fahrrad','Fähre','Flugzeug','Bus','Fuß','Sonstiges'];
const UNTERKUNFT_TYPEN = [
  'Hotel','Ferienwohnung','Camping','Zelt','Jugendherberge',
  'Hostel','Bauernhof','Verwandte','Sonstiges'
];

const euroCent = (v: string) => Math.round((parseFloat(v.replace(',','.')) || 0) * 100);

export default function EtappeNeuClient() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reiseId = searchParams.get('reise_id');

  const [reise, setReise] = useState<Reise | null>(null);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState(false);

  const [titel, setTitel] = useState('');
  const [ort, setOrt] = useState('');
  const [verkehrsmittel, setVerkehrsmittel] = useState<string[]>([]);
  const [unterkunftTyp, setUnterkunftTyp] = useState('');
  const [unterkunftName, setUnterkunftName] = useState('');
  const [kostenUnterkunft, setKostenUnterkunft] = useState('');
  const [kostenTransport, setKostenTransport] = useState('');
  const [kostenVerpflegung, setKostenVerpflegung] = useState('');
  const [kostenAktivitaeten, setKostenAktivitaeten] = useState('');
  const [kostenSonstiges, setKostenSonstiges] = useState('');
  const [tipps, setTipps] = useState('');
  const [kinderwagen, setKinderwagen] = useState('');

  useEffect(() => {
    if (!reiseId) return;
    supabase.from('reisen').select('*').eq('id', reiseId).single()
      .then(({ data }) => { if (data) setReise(data as Reise); });
  }, [reiseId]);

  const gesamt = () => [kostenUnterkunft, kostenTransport, kostenVerpflegung, kostenAktivitaeten, kostenSonstiges]
    .reduce((s, v) => s + (parseFloat(v.replace(',','.')) || 0), 0);

  const vmToggle = (vm: string) =>
    setVerkehrsmittel(prev => prev.includes(vm) ? prev.filter(v => v !== vm) : [...prev, vm]);

  const absenden = async () => {
    if (!titel || !ort || verkehrsmittel.length === 0) {
      setFehler('Bitte Titel, Ort und mindestens ein Verkehrsmittel angeben.');
      return;
    }
    if (!session) { setFehler('Bitte zuerst anmelden.'); return; }
    if (!reiseId) { setFehler('Keine Reise-ID gefunden.'); return; }

    setFehler(''); setLaden(true);

    // Koordinaten per Nominatim (OpenStreetMap) geocodieren
    let lat = null, lng = null;
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ort)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'FamTrip/1.0' } }
      );
      const geoData = await geo.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch { /* Koordinaten optional */ }

    // Datum aus Reise übernehmen (vereinfacht)
    const { error } = await supabase.from('etappen').insert({
      reise_id:                reiseId,
      ersteller_id:            session.user.id,
      reihenfolge:             99,
      titel,
      ort,
      lat,
      lng,
      datum_von:               reise?.datum_von ?? new Date().toISOString().slice(0,10),
      datum_bis:               reise?.datum_bis ?? new Date().toISOString().slice(0,10),
      verkehrsmittel,
      unterkunft_typ:          unterkunftTyp || null,
      unterkunft_name:         unterkunftName || null,
      kosten_unterkunft_cent:  euroCent(kostenUnterkunft),
      kosten_transport_cent:   euroCent(kostenTransport),
      kosten_verpflegung_cent: euroCent(kostenVerpflegung),
      kosten_aktivitaeten_cent:euroCent(kostenAktivitaeten),
      kosten_sonstiges_cent:   euroCent(kostenSonstiges),
      tipps: tipps || null,
      kinderwagen_geeignet:    kinderwagen === 'ja' ? true : kinderwagen === 'nein' ? false : null,
    });

    setLaden(false);
    if (error) { setFehler(error.message); return; }
    setErfolg(true);
    setTimeout(() => router.push(`/reise/${reiseId}`), 2000);
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-semibold mt-4 mb-2">Anmeldung erforderlich</h2>
        <a href="/login" className="btn-primary mt-4 inline-block">Zur Anmeldung</a>
      </div>
    </div>
  );

  if (erfolg) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl">✅</span>
        <h2 className="text-xl font-semibold mt-4">Etappe gespeichert!</h2>
        <p className="text-gray-500 mt-2">Du wirst weitergeleitet...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        {reise && <><a href={`/reise/${reiseId}`} className="hover:text-emerald-600">{reise.titel}</a><span>›</span></>}
        <span className="text-gray-600">Etappe hinzufügen</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Etappe hinzufügen</h1>
      {reise && <p className="text-gray-500 mb-8">zu: {reise.titel}</p>}

      {fehler && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {fehler}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Feld label="Titel der Etappe *">
            <input value={titel} onChange={e => setTitel(e.target.value)}
              placeholder="z. B. Ankunft Lübeck" className="eingabe" />
          </Feld>
          <Feld label="Ort *">
            <input value={ort} onChange={e => setOrt(e.target.value)}
              placeholder="z. B. Lübeck" className="eingabe" />
            <p className="text-xs text-gray-400 mt-1">Wird automatisch auf der Karte angezeigt</p>
          </Feld>
        </div>

        <Feld label="Verkehrsmittel *">
          <div className="flex flex-wrap gap-2">
            {VERKEHRSMITTEL.map(vm => (
              <button key={vm} type="button" onClick={() => vmToggle(vm)}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                  verkehrsmittel.includes(vm)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                }`}>{vm}</button>
            ))}
          </div>
        </Feld>

        <div className="grid grid-cols-2 gap-4">
          <Feld label="Unterkunft-Typ">
            <select value={unterkunftTyp} onChange={e => setUnterkunftTyp(e.target.value)} className="eingabe">
              <option value="">-- wählen --</option>
              {UNTERKUNFT_TYPEN.map(u => <option key={u}>{u}</option>)}
            </select>
          </Feld>
          <Feld label="Unterkunft-Name">
            <input value={unterkunftName} onChange={e => setUnterkunftName(e.target.value)}
              placeholder="z. B. Hotel Muster" className="eingabe" />
          </Feld>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Kosten in € (Gesamt für alle Personen)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['kostenUnterkunft', setKostenUnterkunft, 'Unterkunft'],
              ['kostenTransport', setKostenTransport, 'Transport'],
              ['kostenVerpflegung', setKostenVerpflegung, 'Verpflegung'],
              ['kostenAktivitaeten', setKostenAktivitaeten, 'Aktivitäten'],
            ].map(([key, setter, label]: any) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type="text" inputMode="decimal"
                  onChange={e => setter(e.target.value)}
                  placeholder="0" className="eingabe text-sm" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
            <span className="text-xs text-emerald-700">Etappe gesamt</span>
            <span className="text-sm font-semibold text-emerald-600">
              {gesamt().toFixed(2).replace('.',',')} €
            </span>
          </div>
        </div>

        <Feld label="Kinderwagentauglich?">
          <div className="flex gap-2">
            {[['ja','✅ Ja'],['nein','❌ Nein'],['','Weiß nicht']].map(([val, label]) => (
              <button key={val} type="button"
                onClick={() => setKinderwagen(val)}
                className={`px-4 py-1.5 text-xs rounded-xl border transition-all ${
                  kinderwagen === val
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}>{label}</button>
            ))}
          </div>
        </Feld>

        <Feld label="Tipps für andere Familien">
          <textarea value={tipps} onChange={e => setTipps(e.target.value)}
            rows={3} placeholder="Besonderheiten, Spartipps, Empfehlungen ..."
            className="eingabe resize-none" />
        </Feld>

        <div className="flex gap-3 pt-2">
          <a href={reiseId ? `/reise/${reiseId}` : '/entdecken'} className="btn-ghost flex-1 text-center">
            Abbrechen
          </a>
          <button onClick={absenden} disabled={laden} className="btn-primary flex-1 py-3">
            {laden ? 'Wird gespeichert ...' : 'Etappe speichern ✓'}
          </button>
        </div>
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
