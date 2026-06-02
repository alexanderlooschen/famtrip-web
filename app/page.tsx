// app/page.tsx  – Landingpage
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
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-8 border border-white/30">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse inline-block"></span>
            Community-Plattform für Familienreisen
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Familienreisen<br />
            <span className="text-emerald-100">gemeinsam erleben</span>
          </h1>
          <p className="text-xl text-emerald-50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Routen, Kosten, Unterkünfte und Tipps – von Familien für Familien.
            Finde die perfekte Reise für deine Kinder oder teile eigene Erlebnisse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/entdecken"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl text-base">
              Reisen entdecken →
            </a>
            <a href="/registrieren"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 font-medium px-8 py-4 rounded-2xl transition-all text-base">
              Kostenlos mitmachen
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-14 text-emerald-100 text-sm">
            <div className="text-center"><div className="text-2xl font-bold text-white">100%</div>kostenlos</div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center"><div className="text-2xl font-bold text-white">Community</div>driven</div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center"><div className="text-2xl font-bold text-white">DSGVO</div>konform</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Alles, was Familien brauchen</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Eine Plattform für alle Aspekte eurer Familienreise – von der Planung bis zur Rückkehr.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.titel} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.titel}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Neueste Reisen ── */}
      {reisen.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Neue Reisen</h2>
                <p className="text-gray-500 mt-1">Frisch von der Community dokumentiert</p>
              </div>
              <a href="/entdecken" className="btn-ghost hidden sm:block">Alle ansehen →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reisen.map(r => <ReiseKarte key={r.id} reise={r} />)}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <a href="/entdecken" className="btn-ghost">Alle ansehen →</a>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-12 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-3">Deine Reise fehlt noch!</h2>
          <p className="text-emerald-50 mb-8 text-lg leading-relaxed">
            Hilf anderen Familien und dokumentiere deine nächste Reise.
            Kostenlos, in wenigen Minuten.
          </p>
          <a href="/registrieren"
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-10 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl inline-block text-base">
            Jetzt mitmachen →
          </a>
        </div>
      </section>
    </div>
  );
}

function ReiseKarte({ reise }: { reise: ReiseUebersicht }) {
  const dauer = dauerTage(reise.datum_von, reise.datum_bis);
  const preisstufeClass: Record<string, string> = {
    '€': 'preisstufe-e', '€€': 'preisstufe-ee', '€€€': 'preisstufe-eee',
  };
  const jahreszeitBg: Record<string, string> = {
    'Sommer': 'from-amber-100 to-orange-50',
    'Winter': 'from-blue-100 to-sky-50',
    'Herbst': 'from-orange-100 to-amber-50',
    'Frühling': 'from-green-100 to-emerald-50',
  };
  const bg = jahreszeitBg[reise.jahreszeit ?? ''] ?? 'from-emerald-50 to-teal-50';

  return (
    <a href={`/reise/${reise.id}`} className="card block group overflow-hidden">
      <div className={`h-40 bg-gradient-to-br ${bg} flex items-center justify-center text-5xl`}>
        {reise.jahreszeit === 'Sommer' ? '☀️' : reise.jahreszeit === 'Winter' ? '❄️' : reise.jahreszeit === 'Herbst' ? '🍂' : '🌸'}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug">
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
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{reise.beschreibung}</p>
        )}
        <div className="flex flex-wrap gap-1 mb-4">
          {(reise.alle_verkehrsmittel ?? []).slice(0, 3).map(v => (
            <span key={v} className="chip chip-teal">{VM_ICON[v] ?? '?'} {v}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">
              {reise.ersteller_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">{reise.ersteller_name}</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{centZuEuro(reise.gesamtkosten_cent)}</span>
        </div>
      </div>
    </a>
  );
}

const FEATURES = [
  { icon: '🗺️', titel: 'Routen nachzeichnen', text: 'Dokumentiere jede Etappe mit Ort, Verkehrsmittel und Dauer – interaktiv auf der Karte.' },
  { icon: '💶', titel: 'Kosten transparent', text: 'Unterkunft, Transport, Verpflegung und Aktivitäten – aufgeschlüsselt pro Person und Tag.' },
  { icon: '👶', titel: 'Kindgerecht filtern', text: 'Finde Reisen passend zum Alter deiner Kinder – vom Kleinkind bis zum Teenager.' },
  { icon: '🏕️', titel: 'Unterkünfte & Tipps', text: 'Hotel, Camping, Ferienwohnung – mit Community-Bewertungen und praktischen Hinweisen.' },
  { icon: '🤝', titel: 'Community-Datenbank', text: 'Jeder kann Etappen ergänzen, Fehler korrigieren und eigene Erfahrungen teilen.' },
  { icon: '📱', titel: 'App & Web', text: 'Nutze FamTrip im Browser auf famtrip.looschen.net oder bald als App auf iOS und Android.' },
];

const VM_ICON: Record<string, string> = {
  Auto: '🚗', Bahn: '🚂', Fahrrad: '🚲', Fähre: '⛴️',
  Flugzeug: '✈️', Bus: '🚌', Fuß: '🚶', Sonstiges: '🚀',
};
