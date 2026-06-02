// app/datenschutz/page.tsx
export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
      <p className="text-gray-500 mb-10 text-sm">Stand: Juni 2026</p>
      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">1. Verantwortlicher</h2>
          <p>Alexander Looschen, alexander@looschen.net<br />
          (vollständige Adresse siehe Impressum)</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">2. Welche Daten wir erheben</h2>
          <p className="mb-2">Bei der Registrierung speichern wir:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>E-Mail-Adresse (für Login und Benachrichtigungen)</li>
            <li>Name (öffentlich sichtbar im Profil)</li>
            <li>Optionale Profilinfos (Wohnort, Kinder-Alter, Bio)</li>
            <li>Von dir eingetragene Reisedaten (Routen, Etappen, Kosten)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">3. Zweck der Verarbeitung</h2>
          <p>Deine Daten werden ausschließlich für den Betrieb der FamTrip-Plattform
          verwendet – also um Reisen anzuzeigen, zu speichern und der Community
          zugänglich zu machen. Wir verkaufen keine Daten an Dritte.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">4. Rechtsgrundlage</h2>
          <p>Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung) für die Kontoführung sowie Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung) für optionale Profilangaben.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">5. Hosting & Dienstleister</h2>
          <p className="mb-2">Wir nutzen folgende Dienste:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Vercel Inc.</strong> (San Francisco, USA) – Hosting der Web-App.
              Vercel ist unter dem EU-US Data Privacy Framework zertifiziert.</li>
            <li><strong>Supabase Inc.</strong> (San Francisco, USA) – Datenbank und
              Authentifizierung. Server-Standort: Frankfurt (EU). Daten verlassen die EU nicht.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">6. Speicherdauer</h2>
          <p>Dein Konto und alle zugehörigen Daten werden gespeichert, solange du
          die Plattform nutzt. Du kannst jederzeit die Löschung deines Kontos
          per E-Mail an alexander@looschen.net beantragen.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">7. Deine Rechte</h2>
          <p className="mb-2">Du hast das Recht auf:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung falscher Daten (Art. 16 DSGVO)</li>
            <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="mt-2">Zur Ausübung deiner Rechte wende dich an: alexander@looschen.net</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">8. Cookies</h2>
          <p>FamTrip verwendet ausschließlich technisch notwendige Cookies für die
          Authentifizierung (Login-Session). Es werden keine Tracking- oder
          Werbe-Cookies eingesetzt.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">9. Beschwerderecht</h2>
          <p>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          Zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen (falls du in NRW wohnst) oder die Behörde deines Bundeslandes.</p>
        </section>
      </div>
    </div>
  );
}
