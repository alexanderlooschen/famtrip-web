// app/reise/bearbeiten/page.tsx
import { Suspense } from 'react';
import ReiseBearbeitenClient from '../../../components/ReiseBearbeitenClient';

export default function ReiseBearbeitenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Lädt...</p></div>}>
      <ReiseBearbeitenClient />
    </Suspense>
  );
}
