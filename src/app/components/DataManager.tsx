import { createClient } from '@supabase/supabase-js';
import { SchedulerError, ErrorCodes } from '../errors/types';
import { supabase } from '@/lib/supabase';

export interface Gym {
    id: string;
    name: string;
    location: string;
    paired_gym_id: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Wall {
    id: string;
    name: string;
    gym_id: string;
    difficulty: number;
    climbs_per_setter: number;
    wall_type: 'boulder' | 'rope';
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    primary_gyms: string[];
    created_at: string;
    updated_at: string;
}

export interface ScheduleEntry {
    id: string;
    schedule_date: string;
    gym_id: string;
    comments: string | null;
    walls: string[];
    setters: string[];
    created_at: string;
    updated_at: string;
}

export interface TimeOffRequest {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    hours: number;
    reason: string;
    type: 'vacation' | 'sick' | 'other';
    status: 'pending' | 'approved' | 'denied';
    approved_by: string | null;
    created_at: string;
    updated_at: string;
}

class DataManager {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

       constructor() {
          //console.log('process.env', process.env)
          //console.log('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
          //console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        }
  // Gym Operations
  async fetchGyms(): Promise<Gym[]> {
    try {
        const { data, error } = await this.supabase
            .from('gyms')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
           console.error("Supabase Fetch Error", error)
            throw new SchedulerError('Failed to fetch gyms from Supabase', ErrorCodes.DATA_FETCH_ERROR);
        }
       //console.log('supabase data', data)
       return data as Gym[];
    } catch (error: any) {
         console.error("Supabase Fetch Error", error)
        throw new SchedulerError('Failed to fetch gyms', ErrorCodes.DATA_FETCH_ERROR);
    }
  }

  // Wall Operations
  async fetchWalls(gymId?: string): Promise<Wall[]> {
    try {
      let query =  this.supabase
        .from('walls')
        .select('*')
        .order('name', { ascending: true });

       if (gymId) {
          query = query.eq('gym_id', gymId);
       }

      const { data, error } =  await query;

      if (error) {
          console.error('Supabase Error fetching walls:', error);
          throw new SchedulerError('Failed to fetch walls', ErrorCodes.DATA_FETCH_ERROR);
      }
       console.log('wall data from supabase:', data)
        return data as Wall[];
    } catch (error: any) {
      console.error("Error in fetchWalls", error)
      throw new SchedulerError('Failed to fetch walls', ErrorCodes.DATA_FETCH_ERROR);
    }
  }

  // User Operations
  async fetchUsers(gymId?: string): Promise<User[]> {
    try {
        let query = this.supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (gymId) {
            query = query.contains('primary_gyms', [gymId]);
        }

        const { data, error } = await query;
          
        if (error) {
              console.error('Supabase Error fetching users:', error);
            throw new SchedulerError('Failed to fetch users', ErrorCodes.DATA_FETCH_ERROR);
        }
        
          console.log('user data from supabase:', data)
        return data as User[];

    } catch (error: any) {
        console.error("Error in fetchUsers", error)
        throw new SchedulerError('Failed to fetch users', ErrorCodes.DATA_FETCH_ERROR);
    }
}

  // Schedule Operations
  async fetchScheduleEntries(startDate: string, endDate: string): Promise<ScheduleEntry[]> {
    try {
      const { data: entries, error: entriesError } = await this.supabase
        .from('schedule_entries')
        .select(`
          *,
          schedule_entry_walls(wall_id),
          schedule_setters(user_id)
        `)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate);

            console.log('Schedule entries fetched: ', entries);
        
      if (entriesError) {
        console.error('Error fetching schedule entries:', entriesError);
        throw new SchedulerError('Failed to fetch schedule entries', ErrorCodes.DATA_FETCH_ERROR);
      }

      return entries.map(entry => ({
        id: entry.id,
        schedule_date: entry.schedule_date,
        gym_id: entry.gym_id,
        comments: entry.comments,
        walls: entry.schedule_entry_walls.map((w: any) => w.wall_id),
        setters: entry.schedule_setters.map((s: any) => s.user_id),
        created_at: entry.created_at,
        updated_at: entry.updated_at
      }));
    } catch (error) {
      console.error('Error in fetchScheduleEntries:', error);
      throw new SchedulerError('Failed to fetch schedule entries', ErrorCodes.DATA_FETCH_ERROR);
    }
  }

  async createScheduleEntry(
    entry: Omit<ScheduleEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ScheduleEntry> {
    try {
      console.log('Creating schedule entry:', entry);
      
      const { data: scheduleEntry, error: scheduleError } = await this.supabase
        .from('schedule_entries')
        .insert({
          schedule_date: entry.schedule_date,
          gym_id: entry.gym_id,
          comments: entry.comments
        })
        .select()
        .single();
  
      if (scheduleError) {
        console.error('Schedule entry creation error:', scheduleError);
        throw scheduleError;
      }
  
      console.log('Created schedule entry:', scheduleEntry);
  
      // Insert wall assignments
      if (entry.walls.length > 0) {
        const wallAssignments = entry.walls.map(wallId => ({
          schedule_entry_id: scheduleEntry.id,
          wall_id: wallId
        }));
        
        console.log('Creating wall assignments:', wallAssignments);
        
        const { error: wallsError } = await this.supabase
          .from('schedule_entry_walls')
          .insert(wallAssignments);
  
        if (wallsError) {
          console.error('Wall assignment error:', wallsError);
          throw wallsError;
        }
      }
  
      // Insert setter assignments
      if (entry.setters.length > 0) {
        const setterAssignments = entry.setters.map(userId => ({
          schedule_entry_id: scheduleEntry.id,
          user_id: userId
        }));
        
        console.log('Creating setter assignments:', setterAssignments);
        
        const { error: settersError } = await this.supabase
          .from('schedule_setters')
          .insert(setterAssignments);
  
        if (settersError) {
          console.error('Setter assignment error:', settersError);
          throw settersError;
        }
      }
  
      return {
        ...scheduleEntry,
        walls: entry.walls,
        setters: entry.setters
      };
    } catch (error) {
      console.error('Error in createScheduleEntry:', error);
      throw new SchedulerError('Failed to create schedule entry', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }

  async updateScheduleEntry(entry: ScheduleEntry): Promise<ScheduleEntry> {
    try {
      console.log('Updating schedule entry:', entry);
      
      const { data: scheduleEntry, error: scheduleError } = await this.supabase
        .from('schedule_entries')
        .update({
          schedule_date: entry.schedule_date,
          gym_id: entry.gym_id,
          comments: entry.comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)
        .select()
        .single();
  
      if (scheduleError) {
        console.error('Schedule entry update error:', scheduleError);
        throw scheduleError;
      }
  
      console.log('Updated schedule entry:', scheduleEntry);
  
      // Delete existing relations
      console.log('Deleting existing wall assignments');
      const { error: deleteWallsError } = await this.supabase
        .from('schedule_entry_walls')
        .delete()
        .eq('schedule_entry_id', entry.id);
  
      if (deleteWallsError) {
        console.error('Wall deletion error:', deleteWallsError);
        throw deleteWallsError;
      }
  
      console.log('Deleting existing setter assignments');
      const { error: deleteSettersError } = await this.supabase
        .from('schedule_setters')
        .delete()
        .eq('schedule_entry_id', entry.id);
  
      if (deleteSettersError) {
        console.error('Setter deletion error:', deleteSettersError);
        throw deleteSettersError;
      }
  
      // Insert new wall assignments
      if (entry.walls.length > 0) {
        const wallAssignments = entry.walls.map(wallId => ({
          schedule_entry_id: entry.id,
          wall_id: wallId
        }));
        
        console.log('Creating new wall assignments:', wallAssignments);
        
        const { error: wallsError } = await this.supabase
          .from('schedule_entry_walls')
          .insert(wallAssignments);
  
        if (wallsError) {
          console.error('Wall assignment error:', wallsError);
          throw wallsError;
        }
      }
  
      // Insert new setter assignments
      if (entry.setters.length > 0) {
        const setterAssignments = entry.setters.map(userId => ({
          schedule_entry_id: entry.id,
          user_id: userId
        }));
        
        console.log('Creating new setter assignments:', setterAssignments);
        
        const { error: settersError } = await this.supabase
          .from('schedule_setters')
          .insert(setterAssignments);
  
        if (settersError) {
          console.error('Setter assignment error:', settersError);
          throw settersError;
        }
      }
  
      return {
        ...scheduleEntry,
        walls: entry.walls,
        setters: entry.setters
      };
    } catch (error) {
      console.error('Error in updateScheduleEntry:', error);
      throw new SchedulerError('Failed to update schedule entry', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }
  
  async deleteScheduleEntry(id: string): Promise<void> {
    try {
      // Delete related records first
      const { error: wallsError } = await this.supabase
        .from('schedule_entry_walls')
        .delete()
        .eq('schedule_entry_id', id);

      if (wallsError) throw wallsError;

      const { error: settersError } = await this.supabase
        .from('schedule_setters')
        .delete()
        .eq('schedule_entry_id', id);

      if (settersError) throw settersError;

      // Delete main entry
      const { error: entryError } = await this.supabase
        .from('schedule_entries')
        .delete()
        .eq('id', id);

      if (entryError) throw entryError;
    } catch (error) {
      console.error('Error in deleteScheduleEntry:', error);
      throw new SchedulerError('Failed to delete schedule entry', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }

  // Time Off Operations
  async createTimeOffRequest(
    timeOff: Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<TimeOffRequest> {
    try {
      // TODO: Implement Supabase query
      throw new Error('Not implemented');
    } catch (error) {
      throw new SchedulerError('Failed to create time off request', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }

  async updateTimeOffRequest(timeOff: TimeOffRequest): Promise<TimeOffRequest> {
    try {
      // TODO: Implement Supabase query
      throw new Error('Not implemented');
    } catch (error) {
      throw new SchedulerError('Failed to update time off request', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }

    async fetchTimeOffRequests(userId?: string): Promise<TimeOffRequest[]> {
        try {
            // TODO: Implement Supabase query
            throw new Error('Not implemented');
        } catch (error) {
            throw new SchedulerError('Failed to fetch time off requests', ErrorCodes.DATA_FETCH_ERROR);
        }
    }
    async fetchTimeOffRequestById(id: string): Promise<TimeOffRequest> {
        try {
            // TODO: Implement Supabase query
            throw new Error('Not implemented');
        } catch (error) {
            throw new SchedulerError('Failed to fetch time off request', ErrorCodes.DATA_FETCH_ERROR);
        }
    }
}

export const dataManager = new DataManager();