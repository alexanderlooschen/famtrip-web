// components/AlleReisenKarte.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase, ReiseUebersicht, centZuEuro, dauerTage } from '../lib/supabase';

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

interface ReiseMitKoord {
  reise: ReiseUebersicht;
  lat: number;
  lng: number;
}

interface Props {
  reisen: ReiseUebersicht[];
  onReiseClick: (r: ReiseUebersicht) => void;
}

export default function AlleReisenKarte({ reisen, onReiseClick }: Props) {
  const [reisenMitKoord, setReisenMitKoord] = useState<ReiseMitKoord[]>([]);

  useEffect(() => {
    if (reisen.length === 0) return;

    // Für jede Reise die erste Etappe mit gültigen Koordinaten laden
    const ladeKoordinaten = async () => {
      const ergebnisse: ReiseMitKoord[] = [];

      await Promise.all(reisen.map(async (reise) => {
        const { data } = await supabase
          .from('etappen')
          .select('lat, lng')
          .eq('reise_id', reise.id)
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .order('reihenfolge')
          .limit(1);

        if (data && data.length > 0 && data[0].lat && data[0].lng) {
          ergebnisse.push({
            reise,
            lat: data[0].lat,
            lng: data[0].lng,
          });
        }
      }));

      setReisenMitKoord(ergebnisse);
    };

    ladeKoordinaten();
  }, [reisen]);

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

      {reisenMitKoord.map(({ reise, lat, lng }) => (
        <Marker
          key={reise.id}
          position={[lat, lng]}
          icon={preisMarker(reise.preisstufe)}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{reise.titel}</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                {dauerTage(reise.datum_von, reise.datum_bis)} Tage
                {reise.kinder_alter_min !== null ? ` · ab ${reise.kinder_alter_min} J.` : ''}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 8 }}>
                {centZuEuro(reise.gesamtkosten_cent)}
              </p>
              <button
                onClick={() => onReiseClick(reise)}
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

      {/* Hinweis wenn keine Koordinaten vorhanden */}
      {reisenMitKoord.length === 0 && reisen.length > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white', padding: '16px 20px',
          borderRadius: 12, zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: 13, color: '#6B7280', textAlign: 'center',
        }}>
          <p>Keine Koordinaten gefunden.</p>
          <p style={{ marginTop: 4, fontSize: 12 }}>
            Etappen müssen erst mit einem Ort gespeichert werden.
          </p>
        </div>
      )}
    </MapContainer>
  );
}
