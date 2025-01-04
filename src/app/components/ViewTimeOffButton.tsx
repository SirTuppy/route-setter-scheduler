// components/ViewTimeOffButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const ViewTimeOffButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700"
      onClick={() => router.push('/time-off/view')}
    >
      View Time Off
    </Button>
  );
};