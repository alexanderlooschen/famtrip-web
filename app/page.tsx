// app/page.tsx
// Landingpage – Hero, Feature-Highlights, Beispiel-Reisen

import { supabase, ReiseUebersicht, centZuEuro, dauerTage } from '../lib/supabase';

async function getLetzteReisen(): Promise<ReiseUebersicht[]> {
  const { data } = await supabase
    .from('reisen_uebersicht')
    .select('*')
    .order('erstellt_am', { ascending: false })
    .limit(3);
  return (data ?? []) as ReiseUebersicht[];
}

export default async function HomePage() {
  const reisen = await getLetzteReisen();

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-6xl mb-6 block">🗺️</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Familienreisen<br />
            <span className="text-teal-400">gemeinsam dokumentieren</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            Routen, Kosten, Unterkünfte und Tipps – von Familien für Familien.
            Finde die perfekte Reise für deine Kinder oder teile eigene Erlebnisse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/entdecken" className="btn-primary text-base px-8 py-3">
              Reisen entdecken →
            </a>
            <a href="/reise/neu" className="btn-ghost text-base px-8 py-3">
              Eigene Reise teilen
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-10">
          Alles, was Familien brauchen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.titel} className="card p-6">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-gray-900 mb-2">{f.titel}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Neueste Reisen ── */}
      {reisen.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Neue Reisen der Community</h2>
            <a href="/entdecken" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Alle ansehen →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reisen.map(r => <ReiseKarte key={r.id} reise={r} />)}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-teal-400 text-white py-16 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-3">Deine Reise fehlt noch!</h2>
        <p className="text-teal-50 mb-6 max-w-md mx-auto">
          Hilf anderen Familien und dokumentiere deine nächste Reise.
          Kostenlos, in wenigen Minuten.
        </p>
        <a href="/registrieren" className="bg-white text-teal-700 font-semibold px-8 py-3 rounded-xl hover:bg-teal-50 transition-colors inline-block">
          Jetzt mitmachen →
        </a>
      </section>
    </>
  );
}

// ── Reise-Karte ───────────────────────────────────────────────
function ReiseKarte({ reise }: { reise: ReiseUebersicht }) {
  const dauer = dauerTage(reise.datum_von, reise.datum_bis);
  const preisstufeClass = {
    '€': 'preisstufe-e', '€€': 'preisstufe-ee', '€€€': 'preisstufe-eee',
  }[reise.preisstufe] ?? 'chip-teal';

  return (
    <a href={`/reise/${reise.id}`} className="card p-5 block group">
      {/* Karten-Platzhalter (wird später durch echtes Bild ersetzt) */}
      <div className="h-36 bg-teal-50 rounded-xl mb-4 flex items-center justify-center text-4xl border border-teal-100">
        🏕️
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors leading-tight">
          {reise.titel}
        </h3>
        <span className={preisstufeClass}>{reise.preisstufe}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {reise.datum_von.slice(0, 4)} · {dauer} Tage · {reise.personen_anzahl} Personen
      </p>
      {reise.beschreibung && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {reise.beschreibung}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {(reise.alle_verkehrsmittel ?? []).slice(0, 3).map(v => (
          <span key={v} className="chip chip-teal">{VM_ICON[v] ?? '🚀'} {v}</span>
        ))}
        {reise.kinder_alter_min !== null && (
          <span className="chip chip-green">👶 ab {reise.kinder_alter_min} J.</span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
        <span>von {reise.ersteller_name}</span>
        <span className="font-medium text-gray-700">{centZuEuro(reise.gesamtkosten_cent)}</span>
      </div>
    </a>
  );
}

// ── Daten ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🗺️', titel: 'Routen nachzeichnen', text: 'Dokumentiere jede Etappe mit Ort, Verkehrsmittel und Dauer – interaktiv auf der Karte.' },
  { icon: '💶', titel: 'Kosten transparent', text: 'Unterkunft, Transport, Verpflegung und Aktivitäten – aufgeschlüsselt pro Person und Tag.' },
  { icon: '👶', titel: 'Kindgerecht filtern', text: 'Finde Reisen passend zum Alter deiner Kinder – vom Kleinkind bis zum Teenager.' },
  { icon: '🏕️', titel: 'Unterkünfte & Tipps', text: 'Hotel, Camping, Ferienwohnung – mit Community-Bewertungen und praktischen Hinweisen.' },
  { icon: '🤝', titel: 'Community-Datenbank', text: 'Jeder kann Etappen ergänzen, Fehler korrigieren und eigene Erfahrungen teilen.' },
  { icon: '📱', titel: 'App & Web', text: 'Nutze FamTrip im Browser auf famtrip.looschen.net oder als App auf iOS und Android.' },
];

const VM_ICON: Record<string, string> = {
  Auto: '🚗', Bahn: '🚂', Fahrrad: '🚲', Fähre: '⛴️',
  Flugzeug: '✈️', Bus: '🚌', Fuß: '🚶', Sonstiges: '🚀',
};
