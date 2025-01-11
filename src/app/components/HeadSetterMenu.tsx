// components/HeadSetterMenu.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

const HeadSetterMenu = () => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-indigo-600 hover:bg-indigo-700 text-slate-200 bg-indigo-600 gap-2">
          <Settings size={16} />
          Head Setter Tools
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
        <DropdownMenuLabel className="text-slate-300">Management Tools</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-slate-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/wall-editor')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Wall Editor
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-slate-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/yellow-page')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Yellow Page Exporter
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-slate-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/crew-editor')}
        >
          <Users className="mr-2 h-4 w-4" />
          Crew Editor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeadSetterMenu;