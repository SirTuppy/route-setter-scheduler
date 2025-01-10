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
  angle: 'Slab' | 'Vert' | 'Overhang' | 'Steep' | null;
}

export interface Crew {
  id: string;
  name: string;
  head_setter_id: string;
  gyms: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    crew_id: string | null;
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
  users?: {
      name: string;
      email: string;
  };
}

interface ScheduleConflict {
  date: string;
  gym: string;
}

class DataManager {
    private supabase = supabase;

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
        return data as User[];

    } catch (error: any) {
        console.error("Error in fetchUsers", error)
        throw new SchedulerError('Failed to fetch users', ErrorCodes.DATA_FETCH_ERROR);
    }
}

async fetchUserDetails(userId: string): Promise<User | null> {
  try {
      const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

      if (error) {
          console.error('Error fetching user details:', error);
          throw error;
      }

      return data;
  } catch (error) {
      console.error('Error in fetchUserDetails:', error);
      throw new SchedulerError('Failed to fetch user details', ErrorCodes.DATA_FETCH_ERROR);
  }
}

  // Schedule Operations
  async fetchScheduleEntries(startDate: string, endDate: string): Promise<ScheduleEntry[]> {
    try {
      console.log('Database query dates:', startDate, endDate);
const { data: entries, error: entriesError } = await this.supabase
  .from('schedule_entries')
  .select(`
    *,
    schedule_entry_walls(wall_id),
    schedule_setters(user_id)
  `)
  .gte('schedule_date', startDate)
  .lte('schedule_date', endDate);
console.log('Raw database response:', entries);
        
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
      const { data: scheduleEntry, error: scheduleError } = await this.supabase
        .from('schedule_entries')
        .insert({
          schedule_date: entry.schedule_date,
          gym_id: entry.gym_id,
          comments: entry.comments
        })
        .select()
        .single();
  
      if (scheduleError) throw scheduleError;
  
      // Insert wall assignments
      if (entry.walls.length > 0) {
        const wallAssignments = entry.walls.map(wallId => ({
          schedule_entry_id: scheduleEntry.id,
          wall_id: wallId
        }));
        
        const { error: wallsError } = await this.supabase
          .from('schedule_entry_walls')
          .insert(wallAssignments);
  
        if (wallsError) throw wallsError;
      }
  
      // Insert setter assignments one by one to handle conflicts gracefully
      const setterErrors: string[] = [];
      const successfulSetters: string[] = [];
  
      for (const userId of entry.setters) {
        try {
          const { error: setterError } = await this.supabase
            .from('schedule_setters')
            .insert({
              schedule_entry_id: scheduleEntry.id,
              user_id: userId
            });
  
          if (setterError) {
            // If error contains our custom message, add it to errors
            if (setterError.message.includes('already scheduled')) {
              setterErrors.push(`${userId} is already scheduled at another location on this date`);
            } else {
              throw setterError;
            }
          } else {
            successfulSetters.push(userId);
          }
        } catch (error) {
          setterErrors.push(`Failed to assign setter ${userId}`);
        }
      }
  
      // If we have any errors but some setters were successful,
      // return a partial success with warnings
      if (setterErrors.length > 0 && successfulSetters.length > 0) {
        throw new SchedulerError(
          `Some setters could not be assigned: ${setterErrors.join(', ')}`,
          ErrorCodes.SCHEDULE_CONFLICT
        );
      }
  
      // If all setters failed, throw error
      if (setterErrors.length > 0 && successfulSetters.length === 0) {
        throw new SchedulerError(
          `Failed to assign setters: ${setterErrors.join(', ')}`,
          ErrorCodes.SCHEDULE_CONFLICT
        );
      }
  
      return {
        ...scheduleEntry,
        walls: entry.walls,
        setters: successfulSetters
      };
    } catch (error) {
      console.error('Error in createScheduleEntry:', error);
      throw error instanceof SchedulerError ? error : new SchedulerError(
        'Failed to create schedule entry',
        ErrorCodes.DATA_UPDATE_ERROR
      );
    }
  }

  async updateScheduleEntry(entry: ScheduleEntry): Promise<ScheduleEntry> {
    try {
      
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
    timeOff: Omit<TimeOffRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'approved_by'>
  ): Promise<TimeOffRequest> {
    try {
      const { data, error } = await this.supabase
        .from('time_off')
        .insert({
          ...timeOff,
          status: 'pending',
          approved_by: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating time off request:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createTimeOffRequest:', error);
      throw new SchedulerError('Failed to create time off request', ErrorCodes.DATA_UPDATE_ERROR);
    }
  }

  // Time Off Operations
  async updateTimeOffRequest(
    id: string,
    status: 'approved' | 'denied',
    approvedBy: string,
    reason?: string
): Promise<void> {
    try {
        const updateData: any = {
            status,
            approved_by: approvedBy,
            updated_at: new Date().toISOString()
        };

        if (reason && status === 'denied') {
            updateData.reason = reason;
        }

        if (status === 'approved') {
            // Get full request details first
            const { data: request, error: requestError } = await this.supabase
                .from('time_off')
                .select('*')
                .eq('id', id)
                .single();

            if (requestError) throw requestError;

            // Fetch all schedule entries for the date range
            const entries = await this.fetchScheduleEntries(
                request.start_date,
                request.end_date
            );

            // Remove setter from any conflicting schedule entries
            for (const entry of entries) {
                if (entry.setters.includes(request.user_id) && entry.gym_id !== 'vacation') {
                    console.log('Removing setter from schedule entry:', {
                        entryId: entry.id,
                        date: entry.schedule_date,
                        gym: entry.gym_id
                    });

                    const updatedSetters = entry.setters.filter(setterId => 
                        setterId !== request.user_id
                    );

                    const { error: updateError } = await this.supabase
                        .from('schedule_setters')
                        .delete()
                        .eq('schedule_entry_id', entry.id)
                        .eq('user_id', request.user_id);

                    if (updateError) {
                        console.error('Error removing setter from schedule:', updateError);
                        throw updateError;
                    }
                }
            }
        }

        // Update the time off request status
        const { error: updateError } = await this.supabase
            .from('time_off')
            .update(updateData)
            .eq('id', id);

        if (updateError) throw updateError;

        // If approved, create vacation schedule entry
        if (status === 'approved') {
            try {
                const { data: timeOffRequest } = await this.supabase
                    .from('time_off')
                    .select(`
                        *,
                        users!time_off_user_id_fkey (
                            name,
                            email
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (timeOffRequest) {
                    await this.createVacationScheduleEntry(timeOffRequest);
                }
            } catch (error) {
                console.error('Error creating vacation schedule entry:', error);
                throw error;
            }
        }
    } catch (error) {
        console.error('Error in updateTimeOffRequest:', error);
        throw new SchedulerError(
            'Failed to update time off request: ' + (error instanceof Error ? error.message : 'Unknown error'),
            ErrorCodes.DATA_UPDATE_ERROR
        );
    }
}

async fetchTimeOffRequests(userId?: string): Promise<TimeOffRequest[]> {
  try {
    if (!userId) {
      // Admin view - return all requests
      const { data, error } = await this.supabase
        .from('time_off')
        .select(`
          *,
          users!time_off_user_id_fkey (
            name,
            email,
            role
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    }

    // Get user details including role
    const userDetails = await this.fetchUserDetails(userId);
    if (!userDetails) throw new Error("User not found");
    
    if (userDetails?.role !== 'head_setter') {
      // Regular setter - only see their own requests
      const { data, error } = await this.supabase
        .from('time_off')
        .select(`
          *,
          users!time_off_user_id_fkey (
            name,
            email,
            role
          )
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    }

    // Fetch all users first
    const { data: allUsers, error: usersError } = await this.supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;

    // For head setters, get all crews they're involved with
    const { data: crews } = await this.supabase
      .from('crews')
      .select('id')
      .eq('head_setter_id', userId);

    // For assistant head setters (M2s), also get crews where the main head setter is their partner
    const headSetterPairs = {
      'Evan': 'Luke S.',
      'Canon': 'Jack S.',
      'Austin': 'Nicole'
    };

    // Get partner's name (whether they're head or assistant)
    const userNameToId = Object.fromEntries(allUsers.map(u => [u.name, u.id]));
    const userName = userDetails.name;
    let partnerName = null;

    // Find if they're a head setter or assistant
    for (const [head, assistant] of Object.entries(headSetterPairs)) {
      if (head === userName) partnerName = assistant;
      if (assistant === userName) partnerName = head;
    }

    if (partnerName) {
      const partnerId = userNameToId[partnerName];
      const { data: partnerCrews } = await this.supabase
        .from('crews')
        .select('id')
        .eq('head_setter_id', partnerId);
      
      if (partnerCrews) crews.push(...partnerCrews);
    }

    // Get all users in any of these crews
    const { data: crewUsers } = await this.supabase
      .from('user_crews')
      .select('user_id')
      .in('crew_id', crews.map(c => c.id));

    // Get all unique user IDs (including both head setters)
    const relevantUserIds = [...new Set([
      userId, 
      userNameToId[partnerName],
      ...(crewUsers?.map(u => u.user_id) || [])
    ])].filter(Boolean);

    // Get time off requests for all relevant users
    const { data: timeOffRequests, error } = await this.supabase
      .from('time_off')
      .select(`
        *,
        users!time_off_user_id_fkey (
          name,
          email,
          role
        )
      `)
      .in('user_id', relevantUserIds)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return timeOffRequests;

  } catch (error) {
    console.error('Error in fetchTimeOffRequests:', error);
    throw new SchedulerError('Failed to fetch time off requests', ErrorCodes.DATA_FETCH_ERROR);
  }
}

private async createVacationScheduleEntry(timeOff: TimeOffRequest): Promise<void> {
    // Helper function to create date range
    const getDatesInRange = (startDate: Date, endDate: Date) => {
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
                dates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const dates = getDatesInRange(new Date(timeOff.start_date), new Date(timeOff.end_date));
    
    // Create schedule entries for each date
    for (const date of dates) {
        await this.createScheduleEntry({
            schedule_date: date.toISOString().split('T')[0],
            gym_id: 'vacation',
            comments: `Time off: ${timeOff.reason}`,
            walls: [], // Vacation gym doesn't need walls
            setters: [timeOff.user_id]
        });
    }
}

async checkTimeOffConflicts(userId: string, startDate: string, endDate: string): Promise<ScheduleConflict[]> {
  const entries = await this.fetchScheduleEntries(startDate, endDate);
  return entries
    .filter(entry => 
      entry.setters.includes(userId) && 
      entry.gym_id !== 'vacation'
    )
    .map(entry => ({
      date: entry.schedule_date,
      gym: entry.gym_id
    }));
}

async fetchCrews(): Promise<Crew[]> {
  try {
    const { data, error } = await this.supabase
      .from('crews')
      .select(`
        *,
        head_setter:users!crews_head_setter_id_fkey (
          name,
          email
        ),
        users:user_crews (
          user:users (
            id,
            name,
            email,
            role
          )
        )
      `);

    if (error) throw error;

    // Transform the nested data structure
    return data.map(crew => ({
      ...crew,
      users: crew.users?.map(u => u.user)
    }));
  } catch (error) {
    console.error('Error fetching crews:', error);
    throw new SchedulerError('Failed to fetch crews', ErrorCodes.DATA_FETCH_ERROR);
  }
}

async addCrewMember(crewId: string, userId: string): Promise<void> {
  try {
    const { error } = await this.supabase
      .from('user_crews')
      .insert({
        crew_id: crewId,
        user_id: userId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding crew member:', error);
    throw new SchedulerError('Failed to add crew member', ErrorCodes.DATA_UPDATE_ERROR);
  }
}

async removeCrewMember(crewId: string, userId: string): Promise<void> {
  try {
    const { error } = await this.supabase
      .from('user_crews')
      .delete()
      .eq('crew_id', crewId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing crew member:', error);
    throw new SchedulerError('Failed to remove crew member', ErrorCodes.DATA_UPDATE_ERROR);
  }
}

async updateCrewHeadSetter(crewId: string, headSetterId: string): Promise<void> {
  try {
    const { error } = await this.supabase
      .from('crews')
      .update({ head_setter_id: headSetterId })
      .eq('id', crewId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating crew head setter:', error);
    throw new SchedulerError('Failed to update crew head setter', ErrorCodes.DATA_UPDATE_ERROR);
  }
}

async updateWall(wall: Wall) {
  try {
    const { data, error } = await this.supabase
      .from('walls')
      .update({
        difficulty: wall.difficulty,
        climbs_per_setter: wall.climbs_per_setter,
        wall_type: wall.wall_type,
        angle: wall.angle,  // Updated from type to angle
        updated_at: new Date().toISOString()
      })
      .eq('id', wall.id)
      .select()
      .single();

    if (error) {
      console.error('DataManager: Error updating wall:', error);
      throw error;
    }

    console.log('DataManager: Wall updated successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('DataManager: Update wall error:', error);
    return { data: null, error };
  }
}

}

export const dataManager = new DataManager();