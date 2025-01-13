import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Calendar, Clock, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  if (!user) return null;

  const displayName = user.email?.split('@')[0].replace(/([A-Z])/g, ' $1').trim();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="border-cyan-600 hover:bg-cyan-700 text-slate-200 bg-cyan-600 gap-2"
        >
          <User size={16} />
          {displayName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
        <DropdownMenuLabel className="text-slate-300">
          Signed in as
          <p className="text-xs text-slate-400 font-normal">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-green-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/my-schedule')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          My Schedule
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-blue-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/time-off')}
        >
          <Clock className="mr-2 h-4 w-4" />
          Request Time Off
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-slate-200 focus:bg-purple-700 focus:text-slate-200 cursor-pointer"
          onClick={() => router.push('/time-off/view')}
        >
          <ListChecks className="mr-2 h-4 w-4" />
          View Time Off
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem 
          className="text-red-400 focus:text-red-400 focus:bg-red-900 cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;