// app/reise/neu/page.tsx
import { Suspense } from 'react';
import ReiseNeuClient from '../../../components/ReiseNeuClient';

export default function ReiseNeuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Lädt...</p></div>}>
      <ReiseNeuClient />
    </Suspense>
  );
}
