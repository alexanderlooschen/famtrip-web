// components/AlleReisenKarte.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ReiseUebersicht, centZuEuro, dauerTage } from '../lib/supabase';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function preisMarker(preisstufe: string) {
  const farben: Record<string, { bg: string; text: string; border: string }> = {
    '€':   { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
    '€€':  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
    '€€€': { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  };
  const f = farben[preisstufe] ?? farben['€€'];
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${f.bg};border:2px solid ${f.border};color:${f.text};
      padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;
    ">${preisstufe}</div>`,
    iconSize: [48, 28],
    iconAnchor: [24, 28],
    popupAnchor: [0, -30],
  });
}

interface Props {
  reisen: ReiseUebersicht[];
  onReiseClick: (r: ReiseUebersicht) => void;
}

export default function AlleReisenKarte({ reisen, onReiseClick }: Props) {
  // Startkoordinate aus Reise-ID ableiten (Fallback bis echte Koordinaten vorliegen)
  const koordinate = (r: ReiseUebersicht): [number, number] => {
    const seed = r.id.charCodeAt(0) + r.id.charCodeAt(1);
    return [47.5 + (seed % 7), 7 + (seed % 10)];
  };

  return (
    <MapContainer
      center={[51.0, 10.5]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reisen.map(r => (
        <Marker key={r.id} position={koordinate(r)} icon={preisMarker(r.preisstufe)}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{r.titel}</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                {dauerTage(r.datum_von, r.datum_bis)} Tage
                {r.kinder_alter_min !== null ? ` · ab ${r.kinder_alter_min} J.` : ''}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 8 }}>
                {centZuEuro(r.gesamtkosten_cent)}
              </p>
              <button
                onClick={() => onReiseClick(r)}
                style={{
                  background: '#059669', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '5px 12px', fontSize: 12,
                  cursor: 'pointer', width: '100%',
                }}>
                Route anzeigen →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
