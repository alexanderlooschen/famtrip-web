# FamTrip Web – famtrip.looschen.net

## Setup & Deploy auf Ionos Webspace

### 1. Voraussetzungen (lokal auf deinem Rechner)
- Node.js 18+ installiert (https://nodejs.org)
- Ein FTP-Programm (z. B. FileZilla, kostenlos)

---

### 2. Projekt einrichten

```bash
# Abhängigkeiten installieren
npm install

# .env.local anlegen (Werte aus Supabase Dashboard → Settings → API)
cp .env.example .env.local
```

**.env.local** befüllen:
```env
NEXT_PUBLIC_SUPABASE_URL=https://DEINE_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
```

---

### 3. Lokal testen

```bash
npm run dev
# → http://localhost:3000
```

---

### 4. Für Ionos bauen (statischer Export)

```bash
npm run build
```

Das erstellt den Ordner **`out/`** mit allen statischen Dateien
(HTML, CSS, JS) – kein Node.js-Server nötig!

---

### 5. Auf Ionos hochladen (FTP)

1. FileZilla öffnen
2. Mit Ionos FTP verbinden:
   - Host: `ftp.ionos.de` (oder dein Ionos FTP-Host)
   - Benutzername + Passwort: aus dem Ionos Control Panel
3. Alle Dateien aus dem lokalen `out/`-Ordner hochladen in das
   Verzeichnis deiner Subdomain auf dem Server:
   ```
   /famtrip.looschen.net/  (oder wie Ionos es benennt)
   ```
4. Fertig! → https://famtrip.looschen.net

---

### 6. Ionos Subdomain konfigurieren

Im Ionos Control Panel:
1. Domains & SSL → famtrip.looschen.net
2. DNS: A-Record auf die Ionos Webspace-IP zeigen lassen
3. Dokumentenstamm (Document Root) auf den Upload-Ordner setzen
4. SSL-Zertifikat aktivieren (kostenlos mit Let's Encrypt bei Ionos)

---

### 7. .htaccess für Routing anlegen

Da Next.js statischen Export mit Unterseiten nutzt, braucht Ionos
eine `.htaccess`-Datei im Root-Verzeichnis:

```apache
# .htaccess (in out/ kopieren oder direkt auf den Server laden)
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

---

## Projektstruktur

```
famtrip-web/
├── app/
│   ├── layout.tsx          ✅  Navigation + Footer
│   ├── globals.css         ✅  Tailwind + Basis-Styles
│   ├── page.tsx            ✅  Landingpage
│   ├── entdecken/
│   │   └── page.tsx        ✅  Reisenliste mit Filter
│   └── reise/
│       └── [id]/
│           └── page.tsx    ✅  Reisedetail + Kosten + Karte
├── components/
│   └── ReiseKarte.tsx      ✅  Leaflet-Karte (OpenStreetMap)
├── lib/
│   └── supabase.ts         ✅  Client + Typen + Hilfsfunktionen
├── next.config.js          ✅  Statischer Export
└── tailwind.config.ts      ✅  Design-System
```

## Fertig ✅
- Landingpage mit Hero, Features, neueste Reisen
- Entdecken: Grid mit Suche + Filter (Preisstufe, Kindesalter)
- Reisedetail: Karte (Leaflet/OSM), Etappen, Kostenaufschlüsselung
- Responsive Design (Mobile + Desktop)
- Statischer Export → läuft auf jedem Webspace

## TODO
- [ ] Login / Registrierung
- [ ] Reise erstellen (Formular)
- [ ] Profil-Seite
- [ ] Kartenansicht (alle Reisen)
- [ ] Foto-Upload
