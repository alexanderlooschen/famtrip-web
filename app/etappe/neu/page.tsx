// app/etappe/neu/page.tsx
import { Suspense } from 'react';
import EtappeNeuClient from '../../../components/EtappeNeuClient';

export default function EtappeNeuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Lädt...</p></div>}>
      <EtappeNeuClient />
    </Suspense>
  );
}
