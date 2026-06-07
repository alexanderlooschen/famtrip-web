// components/AltersgruppenAuswahl.tsx
'use client';

import { ALTERSGRUPPEN } from '../lib/supabase';

interface Props {
  ausgewaehlt: string[];
  onChange: (gruppen: string[]) => void;
}

export default function AltersgruppenAuswahl({ ausgewaehlt, onChange }: Props) {
  const toggle = (id: string) => {
    if (ausgewaehlt.includes(id)) {
      onChange(ausgewaehlt.filter(g => g !== id));
    } else {
      onChange([...ausgewaehlt, id]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Geeignet für welche Altersgruppen?
      </label>
      <div className="flex flex-wrap gap-2">
        {ALTERSGRUPPEN.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
              ausgewaehlt.includes(g.id)
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
            }`}>
            <span className="text-base">{g.icon}</span>
            <span className="font-medium">{g.label}</span>
            <span className={`text-xs ${ausgewaehlt.includes(g.id) ? 'text-emerald-100' : 'text-gray-400'}`}>
              {g.alter}
            </span>
          </button>
        ))}
      </div>
      {ausgewaehlt.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Keine Auswahl = für alle Altersgruppen geeignet
        </p>
      )}
    </div>
  );
}
