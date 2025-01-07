// components/ViewTimeOffButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ListChecks } from 'lucide-react'; // Import the icon

export const ViewTimeOffButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-cyan-700 text-slate-200 bg-cyan-600 gap-2"
      onClick={() => router.push('/time-off/view')}
    >
      <ListChecks size={16} />
      View Time Off
    </Button>
  );
};