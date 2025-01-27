// components/AdminMenu.tsx
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
import { Settings, Users, Cog } from 'lucide-react'; // Using 'Cog' icon for System Config
import { useRouter } from 'next/navigation';

const AdminMenu = () => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-indigo-600 hover:bg-indigo-700 text-slate-200 bg-indigo-600 gap-2">
          <Settings size={16} />
          Admin Tools
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
        <DropdownMenuLabel className="text-slate-300">Admin Tools</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          className="text-slate-200 focus:bg-blue-700 focus:text-slate-200 cursor-pointer" 
          onClick={() => router.push('/admin/user-management')} 
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-slate-200 focus:bg-green-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/admin/gym-management')} 
        >
          <Settings className="mr-2 h-4 w-4" />
          Gym Management
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminMenu;