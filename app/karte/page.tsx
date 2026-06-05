// app/karte/page.tsx
import { Suspense } from 'react';
import KarteClient from '../../components/KarteClient';

export default function KartePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Karte lädt...</p></div>}>
      <KarteClient />
    </Suspense>
  );
}
