import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePermissions } from '../hooks/usePermissions';

export const WallEditorButton = () => {
  const router = useRouter();
  const { isHeadSetter } = usePermissions();

  if (!isHeadSetter) return null;

  return (
    <Button
      variant="outline"
      className="border-slate-700 hover:bg-teal-800 text-slate-200 bg-teal-700"
      onClick={() => router.push('/wall-editor')}
    >
      Wall Editor
    </Button>
  );
};