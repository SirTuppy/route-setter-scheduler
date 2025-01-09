// components/RealtimeManager.tsx
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getStandardizedDateKey } from '../utils/dateUtils';

interface RealtimeManagerProps {
  onScheduleUpdate: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  startDate: Date;
  endDate: Date;
}

const RealtimeManager = ({ onScheduleUpdate, startDate, endDate }: RealtimeManagerProps) => {
  // Keep track of pending updates
  const pendingUpdates = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Helper function to fetch complete entry data
    const fetchCompleteEntry = async (entryId: string) => {
      console.log('Fetching complete entry:', entryId);
      const { data: entry } = await supabase
        .from('schedule_entries')
        .select(`
          *,
          schedule_entry_walls(wall_id),
          schedule_setters(user_id)
        `)
        .eq('id', entryId)
        .single();

      if (entry) {
        console.log('Fetched entry data:', entry);
        const dateKey = getStandardizedDateKey(new Date(entry.schedule_date));
        const gymKey = `${entry.gym_id}-${dateKey}`;

        onScheduleUpdate(prev => ({
          ...prev,
          [gymKey]: {
            id: entry.id,
            walls: entry.schedule_entry_walls.map((w: any) => w.wall_id),
            setters: entry.schedule_setters.map((s: any) => s.user_id),
            comments: entry.comments
          }
        }));
      }
    };

    // Handle any change by debouncing the update
    const handleChange = (entryId: string) => {
      console.log('Change detected for entry:', entryId);
      
      // Clear any existing timeout for this entry
      if (pendingUpdates.current[entryId]) {
        clearTimeout(pendingUpdates.current[entryId]);
      }

      // Set a new timeout
      pendingUpdates.current[entryId] = setTimeout(() => {
        fetchCompleteEntry(entryId);
        delete pendingUpdates.current[entryId];
      }, 500); // Wait 500ms before updating
    };

    const channel = supabase.channel('schedule_changes')
      // Listen for schedule entry changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_entries' },
        async (payload) => {
          const entryDate = new Date(payload.new?.schedule_date || payload.old?.schedule_date);
          if (entryDate >= startDate && entryDate <= endDate) {
            if (payload.eventType === 'DELETE' && payload.old) {
              const dateKey = getStandardizedDateKey(new Date(payload.old.schedule_date));
              const gymKey = `${payload.old.gym_id}-${dateKey}`;
              onScheduleUpdate(prev => {
                const newState = { ...prev };
                delete newState[gymKey];
                return newState;
              });
            } else if (payload.new) {
              handleChange(payload.new.id);
            }
          }
        }
      )
      // Listen for wall assignment changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_entry_walls' },
        (payload) => {
          const entryId = payload.new?.schedule_entry_id || payload.old?.schedule_entry_id;
          if (entryId) {
            handleChange(entryId);
          }
        }
      )
      // Listen for setter assignment changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_setters' },
        (payload) => {
          const entryId = payload.new?.schedule_entry_id || payload.old?.schedule_entry_id;
          if (entryId) {
            handleChange(entryId);
          }
        }
      );

    channel.subscribe((status) => {
      console.log('Subscription status:', status);
    });

    return () => {
      // Clear any pending timeouts
      Object.values(pendingUpdates.current).forEach(clearTimeout);
      channel.unsubscribe();
    };
  }, [startDate, endDate, onScheduleUpdate]);

  return null;
};

export default RealtimeManager;