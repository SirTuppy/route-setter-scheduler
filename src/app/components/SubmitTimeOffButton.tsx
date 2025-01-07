// components/SubmitTimeOffButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react'; // Import the icon

export const SubmitTimeOffButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-indigo-800 text-slate-200 bg-indigo-700 gap-2"
      onClick={() => router.push('/time-off')}
    >
      <Clock size={16} />
      Submit Time Off
    </Button>
  );
};