import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User, LogOut } from 'lucide-react';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  
  if (!user) return null;

  // Extract name from email (e.g., "Luke Sherlock" from "Luke.Sherlock@movementgyms.com")
  const displayName = user.email?.split('@')[0].replace(/([A-Z])/g, ' $1').trim();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700 gap-2"
        >
          <User size={16} />
          {displayName}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-slate-800 border-slate-700 p-2">
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-slate-200">Signed in as</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-slate-700"
            onClick={() => signOut()}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserMenu;