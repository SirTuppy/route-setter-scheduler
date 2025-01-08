// components/MyScheduleButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

export const MyScheduleButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-purple-800 text-slate-200 bg-purple-700 gap-2"
      onClick={() => router.push('/my-schedule')}
    >
      <Calendar size={16} />
      My Schedule
    </Button>
  );
};