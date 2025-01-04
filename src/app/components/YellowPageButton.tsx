// components/YellowPageButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const YellowPageButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700"
      onClick={() => router.push('/yellow-page')}
    >
      Yellow Page
    </Button>
  );
};