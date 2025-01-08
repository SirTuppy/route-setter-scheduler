import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { UserCircle2 } from 'lucide-react';

const USER_COLORS = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-purple-500',
  'bg-rose-500'
];

const ACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  timestamp: string;
  lastActivity: string;
  isEditing: boolean;
}

interface LiveCellProps {
  gymId: string;
  date: string;
  children: React.ReactNode;
  onLockedStateChange: (locked: boolean) => void;
}

const LiveCell: React.FC<LiveCellProps> = ({ gymId, date, children, onLockedStateChange }) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Map<string, ActiveUser>>(new Map());
  const [isFocused, setIsFocused] = useState(false);
  const channelRef = useRef<any>(null);
  const cellId = `${gymId}-${date}`;

  // Check if cell is locked by another user
  const isLockedByOther = () => {
    const now = new Date().getTime();
    for (const [userId, userInfo] of activeUsers.entries()) {
      if (userId !== user?.id && userInfo.isEditing) {
        const lastActivity = new Date(userInfo.lastActivity).getTime();
        if (now - lastActivity < ACTIVITY_TIMEOUT) {
          console.log('Cell locked by:', userInfo.name, 'Last activity:', new Date(userInfo.lastActivity).toLocaleString());
          return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (!user) return;

    console.log('Setting up presence channel for cell:', cellId);
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
      console.log('Presence state updated:', state);
      
      const newActiveUsers = new Map();
      Object.entries(state).forEach(([key, presences]) => {
        const presence = presences[0] as any;
        const colorIndex = parseInt(presence.user_id.slice(-4), 16) % USER_COLORS.length;
        
        newActiveUsers.set(presence.user_id, {
          id: presence.user_id,
          name: presence.user_name,
          color: USER_COLORS[colorIndex],
          timestamp: presence.timestamp,
          lastActivity: presence.lastActivity || presence.timestamp,
          isEditing: presence.isEditing || false
        });
      });
      
      setActiveUsers(newActiveUsers);
      const isLocked = isLockedByOther();
      console.log('Cell locked state:', isLocked);
      onLockedStateChange(isLocked);
    });

    // Subscribe to channel
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      console.log('Cleaning up presence channel for cell:', cellId);
      channel.unsubscribe();
    };
  }, [cellId, user]);

  // Keep track of activity
  useEffect(() => {
    if (!isFocused || !user || !channelRef.current) return;

    console.log('Starting activity tracking for user:', user.id);
    const updateActivity = async () => {
      await channelRef.current.track({
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Unknown User',
        timestamp: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isEditing: true
      });
    };

    // Initial update
    updateActivity();

    const interval = setInterval(updateActivity, ACTIVITY_TIMEOUT / 2);
    return () => {
      console.log('Stopping activity tracking for user:', user.id);
      clearInterval(interval);
    };
  }, [isFocused, user]);

  const handleFocus = async () => {
    if (!user || !channelRef.current || isLockedByOther()) {
      console.log('Focus prevented - locked:', isLockedByOther());
      return;
    }
    
    console.log('Cell focused by user:', user.id);
    setIsFocused(true);
    
    const userName = user.email?.split('@')[0] || 'Unknown User';
    await channelRef.current.track({
      user_id: user.id,
      user_name: userName,
      timestamp: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isEditing: true
    });
  };

  const handleBlur = async () => {
    if (!user || !channelRef.current) return;
    console.log('Cell blurred by user:', user.id);
    setIsFocused(false);
    await channelRef.current.untrack();
  };

  const getBorderStyle = () => {
    if (activeUsers.size === 0) return 'border-slate-700';
    if (activeUsers.size === 1 && activeUsers.has(user?.id || '')) {
      const [firstUser] = activeUsers.values();
      return `border-2 ${firstUser.color.replace('bg-', 'border-')}`;
    }
    if (activeUsers.size > 0 && !activeUsers.has(user?.id || '')) {
      return 'border-2 border-red-500';
    }
    return 'border-2 border-gradient-multicolor';
  };

  return (
    <div
      className={`relative group ${isLockedByOther() ? 'pointer-events-none opacity-50' : ''}`}
      tabIndex={isLockedByOther() ? -1 : 0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleFocus}
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
              title={`${activeUser.name}${activeUser.isEditing ? ' (editing)' : ''}`}
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