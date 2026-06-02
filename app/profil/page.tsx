// app/profil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase, Reise, centZuEuro, dauerTage } from '../../lib/supabase';

export default function ProfilPage() {
  const { session, profil, laden, signOut, profilAktualisieren } = useAuth();
  const router = useRouter();
  const [reisen, setReisen]             = useState<Reise[]>([]);
  const [reisenLaden, setReisenLaden]   = useState(true);
  const [bearbeiten, setBearbeiten]     = useState(false);
  const [name, setName]                 = useState('');
  const [wohnort, setWohnort]           = useState('');
  const [bio, setBio]                   = useState('');
  const [kinderAnzahl, setKinderAnzahl] = useState('');
  const [gespeichert, setGespeichert]   = useState(false);

  useEffect(() => {
    if (!laden && !session) router.push('/login');
  }, [laden, session]);

  useEffect(() => {
    if (!profil) return;
    setName(profil.name ?? '');
    setWohnort(profil.wohnort ?? '');
    setBio(profil.bio ?? '');
    setKinderAnzahl(String(profil.kinder_anzahl ?? ''));
  }, [profil]);

  useEffect(() => {
    if (!session) return;
    supabase.from('reisen')
      .select('*')
      .eq('ersteller_id', session.user.id)
      .order('erstellt_am', { ascending: false })
      .then(({ data }) => {
        setReisen((data ?? []) as Reise[]);
        setReisenLaden(false);
      });
  }, [session]);

  const profilSpeichern = async () => {
    await profilAktualisieren({
      name, wohnort: wohnort || null, bio: bio || null,
      kinder_anzahl: kinderAnzahl ? parseInt(kinderAnzahl) : null,
    });
    setBearbeiten(false);
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 3000);
  };

  const reiseVeroeffentlichen = async (id: string) => {
    await supabase.from('reisen').update({ veroeffentlicht: true }).eq('id', id);
    setReisen(prev => prev.map(r => r.id === id ? { ...r, veroeffentlicht: true } : r));
  };

  const reiseLoeschen = async (id: string) => {
    if (!confirm('Reise wirklich löschen?')) return;
    await supabase.from('reisen').delete().eq('id', id);
    setReisen(prev => prev.filter(r => r.id !== id));
  };

  if (laden || !session) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">🗺️</div></div>;
  }

  const veroeffentlicht = reisen.filter(r => r.veroeffentlicht);
  const entwuerfe       = reisen.filter(r => !r.veroeffentlicht);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* ── Profil-Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-700 flex-shrink-0">
            {profil?.name?.slice(0, 2).toUpperCase() ?? '??'}
          </div>

          <div className="flex-1 min-w-0">
            {!bearbeiten ? (
              <>
                <h1 className="text-2xl font-semibold text-gray-900">{profil?.name}</h1>
                {profil?.wohnort && <p className="text-gray-500 text-sm mt-0.5">📍 {profil.wohnort}</p>}
                {profil?.bio && <p className="text-gray-600 text-sm mt-2 leading-relaxed">{profil.bio}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {profil?.kinder_anzahl && (
                    <span className="chip chip-teal">👶 {profil.kinder_anzahl} {profil.kinder_anzahl === 1 ? 'Kind' : 'Kinder'}</span>
                  )}
                  <span className="chip chip-blue">🗺️ {veroeffentlicht.length} Reisen</span>
                  <span className="chip chip-amber">✏️ {entwuerfe.length} Entwürfe</span>
                </div>
              </>
            ) : (
              <div className="space-y-3 w-full">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="eingabe text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Wohnort</label>
                    <input value={wohnort} onChange={e => setWohnort(e.target.value)} placeholder="z. B. Hamburg" className="eingabe text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Über mich</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Kurze Vorstellung …" className="eingabe text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Anzahl Kinder</label>
                  <input type="number" min="0" max="10" value={kinderAnzahl} onChange={e => setKinderAnzahl(e.target.value)} placeholder="0" className="eingabe text-sm w-24" />
                </div>
              </div>
            )}
          </div>

          {/* Aktionen */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!bearbeiten ? (
              <>
                <button onClick={() => setBearbeiten(true)} className="btn-ghost text-sm">✏️ Bearbeiten</button>
                <button onClick={() => { signOut(); router.push('/'); }} className="text-sm text-red-400 hover:text-red-600 text-left transition-colors">Abmelden</button>
              </>
            ) : (
              <>
                <button onClick={profilSpeichern} className="btn-primary text-sm">Speichern</button>
                <button onClick={() => setBearbeiten(false)} className="btn-ghost text-sm">Abbrechen</button>
              </>
            )}
          </div>
        </div>

        {gespeichert && (
          <div className="mt-4 bg-teal-50 border border-teal-100 text-teal-700 text-sm rounded-xl px-4 py-2.5">
            ✅ Profil gespeichert!
          </div>
        )}
      </div>

      {/* ── Neue Reise Button ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Meine Reisen</h2>
        <a href="/reise/neu" className="btn-primary text-sm">+ Neue Reise</a>
      </div>

      {/* ── Entwürfe ── */}
      {entwuerfe.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Entwürfe ({entwuerfe.length})
          </h3>
          <div className="space-y-3">
            {entwuerfe.map(r => (
              <ReiseZeile key={r.id} reise={r}
                aktionen={
                  <div className="flex gap-2">
                    <button onClick={() => reiseVeroeffentlichen(r.id)} className="btn-primary text-xs px-3 py-1.5">
                      🌍 Veröffentlichen
                    </button>
                    <a href={`/reise/${r.id}`} className="btn-ghost text-xs px-3 py-1.5">Ansehen</a>
                    <button onClick={() => reiseLoeschen(r.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Löschen</button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Veröffentlichte Reisen ── */}
      {reisenLaden ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : veroeffentlicht.length === 0 && entwuerfe.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl block mb-4">✈️</span>
          <p className="text-gray-500 mb-4">Du hast noch keine Reisen dokumentiert.</p>
          <a href="/reise/neu" className="btn-primary">Erste Reise erstellen</a>
        </div>
      ) : veroeffentlicht.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>
            Veröffentlicht ({veroeffentlicht.length})
          </h3>
          <div className="space-y-3">
            {veroeffentlicht.map(r => (
              <ReiseZeile key={r.id} reise={r}
                aktionen={
                  <div className="flex gap-2">
                    <a href={`/reise/${r.id}`} className="btn-ghost text-xs px-3 py-1.5">Ansehen</a>
                    <button onClick={() => reiseLoeschen(r.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Löschen</button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reise-Zeile ───────────────────────────────────────────────
function ReiseZeile({ reise, aktionen }: { reise: Reise; aktionen: React.ReactNode }) {
  const dauer = dauerTage(reise.datum_von, reise.datum_bis);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 truncate">{reise.titel}</p>
          <span className={`chip text-xs flex-shrink-0 ${
            reise.preisstufe === '€' ? 'preisstufe-e' :
            reise.preisstufe === '€€' ? 'preisstufe-ee' : 'preisstufe-eee'
          }`}>{reise.preisstufe}</span>
        </div>
        <p className="text-xs text-gray-400">
          {reise.datum_von.slice(0,4)} · {dauer} Tage · {reise.personen_anzahl} Personen
          {reise.kinder_alter_min !== null && ` · ab ${reise.kinder_alter_min} J.`}
          {' · '}<span className="font-medium text-gray-600">{centZuEuro(reise.gesamtkosten_cent)}</span>
        </p>
      </div>
      <div className="flex-shrink-0">{aktionen}</div>
    </div>
  );
}
