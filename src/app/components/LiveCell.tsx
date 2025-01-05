import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { UserCircle2 } from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  timestamp: string;
}

interface LiveCellProps {
  gymId: string;
  date: string;
  children: React.ReactNode;
}

const USER_COLORS = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-purple-500',
  'bg-rose-500'
];

const LiveCell: React.FC<LiveCellProps> = ({ gymId, date, children }) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Map<string, ActiveUser>>(new Map());
  const [isFocused, setIsFocused] = useState(false);
  const channelRef = useRef<any>(null);
  const cellId = `${gymId}-${date}`;

  useEffect(() => {
    if (!user) return;

    // Create a presence channel for this cell
    const channel = supabase.channel(`cell_presence:${cellId}`, {
      config: {
        presence: {
          key: cellId,
        },
      },
    });

    // Handle presence state changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const newActiveUsers = new Map();
      
      Object.entries(state).forEach(([key, presences]) => {
        const presence = presences[0] as any;
        const colorIndex = parseInt(presence.user_id.slice(-4), 16) % USER_COLORS.length;
        
        newActiveUsers.set(presence.user_id, {
          id: presence.user_id,
          name: presence.user_name,
          color: USER_COLORS[colorIndex],
          timestamp: presence.timestamp
        });
      });
      
      setActiveUsers(newActiveUsers);
    });

    // Subscribe to channel
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [cellId, user]);

  // Handle focus/blur
  const handleFocus = async () => {
    if (!user || !channelRef.current) return;

    setIsFocused(true);
    const userName = user.email?.split('@')[0] || 'Unknown User';
    await channelRef.current.track({
      user_id: user.id,
      user_name: userName,
      timestamp: new Date().toISOString()
    });
  };

  const handleBlur = async () => {
    if (!user || !channelRef.current) return;
    
    setIsFocused(false);
    await channelRef.current.untrack();
  };

  // Get border style based on active users
  const getBorderStyle = () => {
    if (activeUsers.size === 0) return 'border-slate-700';
    if (activeUsers.size === 1) {
      const [firstUser] = activeUsers.values();
      return `border-2 ${firstUser.color.replace('bg-', 'border-')}`;
    }
    return 'border-2 border-gradient-multicolor';
  };

  return (
    <div 
      className="relative group"
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleFocus}  // Add click handler for better mobile support
    >
      <div className={`rounded-md transition-all duration-200 ${getBorderStyle()}`}>
        {children}
      </div>
      
      {/* Active users indicators */}
      {activeUsers.size > 0 && (
        <div className="absolute -top-2 -right-2 flex -space-x-2">
          {Array.from(activeUsers.values()).map((activeUser) => (
            <div
              key={activeUser.id}
              className={`${activeUser.color} rounded-full p-1 border-2 border-slate-800 shadow-lg`}
              title={activeUser.name}
            >
              <UserCircle2 className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveCell;