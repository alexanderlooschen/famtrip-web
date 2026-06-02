// components/ReiseKarte.tsx
// Wird mit dynamic({ ssr: false }) geladen – Leaflet läuft nur im Browser.

'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Etappe } from '../lib/supabase';

// Leaflet-Standard-Icons reparieren (Webpack-Bug)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Farbe je Verkehrsmittel
const VM_FARBE: Record<string, string> = {
  Auto:      '#1D9E75',
  Bahn:      '#0C447C',
  Fahrrad:   '#BA7517',
  Fähre:     '#5DCAA5',
  Flugzeug:  '#3C3489',
  Bus:       '#712B13',
  Fuß:       '#6B7280',
  Sonstiges: '#9CA3AF',
};

// Nummerierten Marker erstellen
function nummerMarker(nummer: number, farbe: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${farbe};border:2.5px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;color:white;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">${nummer}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

// Karte auf alle Marker einpassen
function KarteAnpassen({ koordinaten }: { koordinaten: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (koordinaten.length >= 2) {
      map.fitBounds(koordinaten, { padding: [40, 40] });
    } else if (koordinaten.length === 1) {
      map.setView(koordinaten[0], 10);
    }
  }, [koordinaten, map]);
  return null;
}

interface Props {
  etappen: Etappe[];
  aktiveEtappe: Etappe | null;
  onEtappeClick: (e: Etappe) => void;
}

export default function ReiseKarte({ etappen, aktiveEtappe, onEtappeClick }: Props) {
  const mitKoord = etappen.filter(e => e.lat !== null && e.lng !== null);
  const koordinaten: [number, number][] = mitKoord.map(e => [e.lat!, e.lng!]);

  return (
    <MapContainer
      center={koordinaten[0] ?? [51.1, 10.4]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <KarteAnpassen koordinaten={koordinaten} />

      {/* Farbige Segment-Linien nach Verkehrsmittel */}
      {mitKoord.slice(0, -1).map((etappe, idx) => {
        const naechste = mitKoord[idx + 1];
        const farbe = VM_FARBE[etappe.verkehrsmittel?.[0] ?? 'Sonstiges'] ?? '#1D9E75';
        return (
          <Polyline
            key={`seg-${etappe.id}`}
            positions={[[etappe.lat!, etappe.lng!], [naechste.lat!, naechste.lng!]]}
            pathOptions={{ color: farbe, weight: 4, dashArray: '8,5' }}
          />
        );
      })}

      {/* Nummerierte Marker */}
      {mitKoord.map((etappe, idx) => {
        const farbe = VM_FARBE[etappe.verkehrsmittel?.[0] ?? 'Sonstiges'] ?? '#1D9E75';
        const istAktiv = aktiveEtappe?.id === etappe.id;
        return (
          <Marker
            key={etappe.id}
            position={[etappe.lat!, etappe.lng!]}
            icon={nummerMarker(idx + 1, istAktiv ? '#085041' : farbe)}
            eventHandlers={{ click: () => onEtappeClick(etappe) }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{etappe.titel}</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  📍 {etappe.ort}
                </p>
                <p style={{ fontSize: 12 }}>
                  🚗 {etappe.verkehrsmittel.join(', ')}
                </p>
                {etappe.unterkunft_name && (
                  <p style={{ fontSize: 12 }}>🏨 {etappe.unterkunft_name}</p>
                )}
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75', marginTop: 6 }}>
                  {(etappe.kosten_gesamt_cent / 100).toFixed(0)} €
                </p>
                {etappe.tipps && (
                  <p style={{ fontSize: 11, color: '#633806', background: '#FAEEDA', padding: '6px 8px', borderRadius: 6, marginTop: 6 }}>
                    💡 {etappe.tipps}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
