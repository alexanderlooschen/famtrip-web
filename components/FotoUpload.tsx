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

  const hochladen = async (files: FileList | null) => {
    if (!files || !session) return;
    setFehler(''); setUploading(true);

    const neueFotos: Foto[] = [];

    for (const file of Array.from(files)) {
      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setFehler('Datei zu groß (max. 5 MB)');
        continue;
      }

      const ext = file.name.split('.').pop();
      const pfad = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(pfad, file, { upsert: false });

      if (uploadError) { setFehler(uploadError.message); continue; }

      const { data: urlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(pfad);

      const url = urlData.publicUrl;

      const { data: fotoData, error: dbError } = await supabase
        .from('fotos')
        .insert({
          reise_id:    reiseId ?? null,
          etappe_id:   etappeId ?? null,
          ersteller_id: session.user.id,
          url,
          beschriftung: null,
        })
        .select('id, url, beschriftung')
        .single();

      if (!dbError && fotoData) neueFotos.push(fotoData as Foto);
    }

    onFotosChange([...fotos, ...neueFotos]);
    setUploading(false);
  };

  const loeschen = async (foto: Foto) => {
    if (!confirm('Foto wirklich löschen?')) return;
    await supabase.from('fotos').delete().eq('id', foto.id);
    onFotosChange(fotos.filter(f => f.id !== foto.id));
  };

  const beschriftungAktualisieren = async (foto: Foto, text: string) => {
    await supabase.from('fotos').update({ beschriftung: text }).eq('id', foto.id);
    onFotosChange(fotos.map(f => f.id === foto.id ? { ...f, beschriftung: text } : f));
  };

  return (
    <div>
      {/* Foto-Galerie */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {fotos.map(foto => (
            <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-gray-100">
              <img
                src={foto.url}
                alt={foto.beschriftung ?? 'Reisefoto'}
                className="w-full h-32 object-cover"
              />
              {!readonly && session && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <button
                    onClick={() => loeschen(foto)}
                    className="self-end bg-red-500 text-white text-xs rounded-lg px-2 py-1 hover:bg-red-600">
                    Löschen
                  </button>
                  <input
                    defaultValue={foto.beschriftung ?? ''}
                    onBlur={e => beschriftungAktualisieren(foto, e.target.value)}
                    placeholder="Beschriftung..."
                    className="text-xs bg-white/90 rounded-lg px-2 py-1 w-full"
                  />
                </div>
              )}
              {foto.beschriftung && (
                <p className="text-xs text-gray-500 px-2 py-1 truncate">{foto.beschriftung}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload-Button */}
      {!readonly && session && (
        <div>
          {fehler && (
            <p className="text-xs text-red-500 mb-2">{fehler}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => hochladen(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 btn-ghost text-sm w-full justify-center py-3 border-dashed">
            {uploading ? (
              <span className="text-gray-400">Wird hochgeladen...</span>
            ) : (
              <>
                <span className="text-lg">📷</span>
                <span>Fotos hinzufügen</span>
                <span className="text-xs text-gray-400">(max. 5 MB pro Bild)</span>
              </>
            )}
          </button>
        </div>
      )}

      {fotos.length === 0 && readonly && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Fotos vorhanden.</p>
      )}
    </div>
  );
}
