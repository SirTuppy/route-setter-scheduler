// components/YellowPageButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react'; // Import the icon

export const YellowPageButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-amber-600 text-slate-200 bg-amber-600 gap-2"
      onClick={() => router.push('/yellow-page')}
    >
       <FileText size={16} />
      Yellow Page Exporter
    </Button>
  );
};