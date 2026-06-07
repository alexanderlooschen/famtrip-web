// lib/supabase.ts
// Wird sowohl im Browser als auch in Next.js Server Components genutzt.

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Typen (identisch mit der App) ────────────────────────────
export type Preisstufe = '€' | '€€' | '€€€';
export type Jahreszeit = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter';
export type Verkehrsmittel =
  | 'Auto' | 'Bahn' | 'Fahrrad' | 'Fähre'
  | 'Flugzeug' | 'Bus' | 'Fuß' | 'Sonstiges';
export type UnterkunftTyp =
  | 'Hotel' | 'Ferienwohnung' | 'Camping' | 'Hostel'
  | 'Bauernhof' | 'Verwandte' | 'Sonstiges';

export interface Reise {
  id: string;
  ersteller_id: string;
  titel: string;
  beschreibung: string | null;
  datum_von: string;
  datum_bis: string;
  personen_anzahl: number;
  kinder_alter_min: number | null;
  kinder_alter_max: number | null;
  jahreszeit: Jahreszeit | null;
  gesamtkosten_cent: number;
  preisstufe: Preisstufe;
  bewertung_schnitt: number;
  bewertung_anzahl: number;
  tipp_anzahl: number;
  veroeffentlicht: boolean;
  erstellt_am: string;
}

export interface ReiseUebersicht extends Reise {
  dauer_tage: number;
  gesamtkosten_euro: number;
  kosten_pro_person_euro: number;
  ersteller_name: string;
  ersteller_avatar: string | null;
  alle_verkehrsmittel: Verkehrsmittel[];
  etappen_anzahl: number;
}

export interface Etappe {
  id: string;
  reise_id: string;
  ersteller_id: string;
  reihenfolge: number;
  titel: string;
  ort: string;
  lat: number | null;
  lng: number | null;
  datum_von: string;
  datum_bis: string;
  unterkunft_typ: UnterkunftTyp | null;
  unterkunft_name: string | null;
  verkehrsmittel: Verkehrsmittel[];
  kosten_unterkunft_cent: number;
  kosten_transport_cent: number;
  kosten_verpflegung_cent: number;
  kosten_aktivitaeten_cent: number;
  kosten_sonstiges_cent: number;
  kosten_gesamt_cent: number;
  tipps: string | null;
  kinderwagen_geeignet: boolean | null;
}

// ── Hilfsfunktionen ───────────────────────────────────────────
export const centZuEuro = (cent: number): string =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(cent / 100);

export const datumDE = (iso: string): string =>
  new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const dauerTage = (von: string, bis: string): number =>
  Math.round((new Date(bis).getTime() - new Date(von).getTime()) / 86_400_000) + 1;

// Monat (1-12) → Jahreszeit automatisch
export function monatZuJahreszeit(monat: number): string {
  if ([12,1,2].includes(monat))  return "Winter";
  if ([3,4,5].includes(monat))   return "Frühling";
  if ([6,7,8].includes(monat))   return "Sommer";
  return "Herbst";
}


export const ALTERSGRUPPEN = [
  { id: "kleinkind",    label: "Kleinkind",        icon: "👶", alter: "0–3 Jahre" },
  { id: "kindergarten", label: "Kindergartenkind",  icon: "🧒", alter: "4–6 Jahre" },
  { id: "grundschule",  label: "Grundschulkind",    icon: "🏫", alter: "7–10 Jahre" },
  { id: "aeltere",      label: "Ältere Kinder",     icon: "🎒", alter: "11–14 Jahre" },
  { id: "teenager",     label: "Teenager",          icon: "🧑", alter: "15+ Jahre" },
];

