// components/ViewTimeOffButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const ViewTimeOffButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-cyan-700 text-slate-200 bg-cyan-600"
      onClick={() => router.push('/time-off/view')}
    >
      View Time Off
    </Button>
  );
};