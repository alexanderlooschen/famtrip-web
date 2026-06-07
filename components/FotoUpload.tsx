// components/FotoUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Foto {
  id: string;
  url: string;
  beschriftung: string | null;
}

interface Props {
  reiseId?: string;
  etappeId?: string;
  fotos: Foto[];
  onFotosChange: (fotos: Foto[]) => void;
  readonly?: boolean;
}

export default function FotoUpload({ reiseId, etappeId, fotos, onFotosChange, readonly }: Props) {
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fehler, setFehler] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const hochladen = async (files: FileList | null) => {
    if (!files || !session) return;
    setFehler('');
    setUploading(true);

    const neueFotos: Foto[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setFehler('Datei zu groß (max. 5 MB)');
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const pfad = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(pfad, file, { upsert: false });

      if (uploadError) { setFehler(`Upload Fehler: ${uploadError.message}`); continue; }

      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(pfad);
      const url = urlData.publicUrl;

      const dbEintrag: any = { ersteller_id: session.user.id, url, beschriftung: null };
      if (reiseId)  dbEintrag.reise_id  = reiseId;
      if (etappeId) dbEintrag.etappe_id = etappeId;

      const { data: fotoData, error: dbError } = await supabase
        .from('fotos').insert(dbEintrag).select('id, url, beschriftung').single();

      if (dbError) {
        setFehler(`Datenbank Fehler: ${dbError.message}`);
        await supabase.storage.from('fotos').remove([pfad]);
        continue;
      }
      if (fotoData) neueFotos.push(fotoData as Foto);
    }

    onFotosChange([...fotos, ...neueFotos]);
    setUploading(false);
  };

  const loeschen = async (foto: Foto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Foto wirklich löschen?')) return;
    await supabase.from('fotos').delete().eq('id', foto.id);
    onFotosChange(fotos.filter(f => f.id !== foto.id));
    setLightbox(null);
  };

  const beschriftungAktualisieren = async (foto: Foto, text: string) => {
    await supabase.from('fotos').update({ beschriftung: text }).eq('id', foto.id);
    onFotosChange(fotos.map(f => f.id === foto.id ? { ...f, beschriftung: text } : f));
  };

  const prev = () => setLightbox(i => i !== null ? (i - 1 + fotos.length) % fotos.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % fotos.length : null);

  return (
    <div>
      {/* Galerie */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {fotos.map((foto, idx) => (
            <div key={foto.id}
              className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer"
              onClick={() => setLightbox(idx)}>
              <img
                src={foto.url}
                alt={foto.beschriftung ?? 'Reisefoto'}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {/* Hover-Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-2xl">🔍</span>
              </div>
              {session && !readonly && (
                <button
                  onClick={e => loeschen(foto, e)}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                  ✕
                </button>
              )}
              {foto.beschriftung && (
                <p className="text-xs text-gray-500 px-2 py-1 truncate bg-white">
                  {foto.beschriftung}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      {!readonly && session && (
        <div>
          {fehler && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2 mb-2">
              ⚠️ {fehler}
            </div>
          )}
          <input ref={inputRef} type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple className="hidden"
            onChange={e => hochladen(e.target.files)} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 btn-ghost text-sm w-full justify-center py-3 border-dashed">
            {uploading ? (
              <span className="text-gray-400">⏳ Wird hochgeladen...</span>
            ) : (
              <>
                <span className="text-lg">📷</span>
                <span>Fotos hinzufügen</span>
                <span className="text-xs text-gray-400">(JPG, PNG, max. 5 MB)</span>
              </>
            )}
          </button>
        </div>
      )}

      {fotos.length === 0 && readonly && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Fotos vorhanden.</p>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}>

          {/* Schließen */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10">
            ✕
          </button>

          {/* Zähler */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightbox + 1} / {fotos.length}
          </div>

          {/* Vorheriges */}
          {fotos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white text-4xl hover:text-gray-300 transition-colors z-10 bg-black/30 rounded-full w-12 h-12 flex items-center justify-center">
              ‹
            </button>
          )}

          {/* Bild */}
          <div onClick={e => e.stopPropagation()} className="max-w-4xl max-h-[85vh] mx-16">
            <img
              src={fotos[lightbox].url}
              alt={fotos[lightbox].beschriftung ?? 'Foto'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {/* Beschriftung + Bearbeiten */}
            <div className="mt-3 text-center">
              {session && !readonly ? (
                <input
                  defaultValue={fotos[lightbox].beschriftung ?? ''}
                  onBlur={e => beschriftungAktualisieren(fotos[lightbox], e.target.value)}
                  placeholder="Beschriftung hinzufügen..."
                  className="text-sm text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-center w-full max-w-sm placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
                  onClick={e => e.stopPropagation()}
                />
              ) : fotos[lightbox].beschriftung ? (
                <p className="text-white/80 text-sm">{fotos[lightbox].beschriftung}</p>
              ) : null}
              {session && !readonly && (
                <button
                  onClick={e => loeschen(fotos[lightbox], e)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                  Foto löschen
                </button>
              )}
            </div>
          </div>

          {/* Nächstes */}
          {fotos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10 bg-black/30 rounded-full w-12 h-12 flex items-center justify-center">
              ›
            </button>
          )}

          {/* Thumbnail-Leiste */}
          {fotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {fotos.map((f, i) => (
                <button key={f.id}
                  onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightbox ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}>
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
