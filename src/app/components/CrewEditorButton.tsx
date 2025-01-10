// components/CrewEditorButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePermissions } from '../hooks/usePermissions';
import { Users } from 'lucide-react';

export const CrewEditorButton = () => {
  const router = useRouter();
  const { isHeadSetter } = usePermissions();

  if (!isHeadSetter) return null;

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-pink-800 text-slate-200 bg-pink-700 gap-2"
      onClick={() => router.push('/crew-editor')}
    >
      <Users size={16} />
      Crew Editor
    </Button>
  );
};