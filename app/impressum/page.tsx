// app/impressum/page.tsx
export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Impressum</h1>
      <p className="text-gray-500 mb-10 text-sm">Angaben gemäß § 5 TMG</p>
      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-gray-900 mb-2">Verantwortlich</h2>
          <p>Alexander Looschen<br />
          [Huntestr. 14]<br />
          [49681 Garrel]<br />
          Deutschland</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900 mb-2">Kontakt</h2>
          <p>E-Mail: alexander@looschen.net</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900 mb-2">Hinweis zur Plattform</h2>
          <p>FamTrip ist eine Community-Plattform für selbstorganisierte Familienreisen.
          Inhalte werden von Nutzern erstellt und geteilt. Für die Richtigkeit der
          Community-Beiträge übernehmen wir keine Gewähr.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900 mb-2">Streitschlichtung</h2>
          <p>Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:
          <a href="https://ec.europa.eu/consumers/odr/" className="text-emerald-600 hover:underline ml-1" target="_blank" rel="noopener">
            ec.europa.eu/consumers/odr
          </a>. Wir sind nicht verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </section>
      </div>
    </div>
  );
}
