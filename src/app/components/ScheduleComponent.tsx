"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ScheduleHeader from './ScheduleHeader';
import GymFilter from './GymFilter';
import ScheduleCell from './ScheduleCell';
import { ErrorBoundary } from './ErrorBoundary';
import { dataManager, Gym, Wall, User } from './DataManager';
import { useAuth } from '@/providers/auth-provider';
import { getStandardizedDateKey, getDateForDatabase, createStandardizedDate, getMondayOfWeek } from '../utils/dateUtils';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const ScheduleContent: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(() => getMondayOfWeek());
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState<Record<string, any>>({});
    const [gymGroups, setGymGroups] = useState<Record<string, any>>({});
    const [setters, setSetters] = useState<User[]>([]);

    const { user } = useAuth();
    const [userDetails, setUserDetails] = useState<User | null>(null);
    const [hiddenGyms, setHiddenGyms] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadUserDetails = async () => {
            if (!user?.id) return;
            try {
                const details = await dataManager.fetchUserDetails(user.id);
                setUserDetails(details);
                
                // Get all gym IDs from gymGroups
                const allGymIds = Object.values(gymGroups).flatMap(group => 
                    Object.keys(group.gyms)
                );
                
                // Hide gyms not in user's primary_gyms (except vacation)
                const initialHiddenGyms = new Set(
                    allGymIds.filter(gymId => 
                        gymId !== 'vacation' && 
                        !details?.primary_gyms.includes(gymId)
                    )
                );
                
                setHiddenGyms(initialHiddenGyms);
            } catch (error) {
                console.error('Error loading user details:', error);
            }
        };
        
        if (Object.keys(gymGroups).length > 0) {
            loadUserDetails();
        }
    }, [user?.id, gymGroups]);

    useEffect(() => {
        const loadSetters = async () => {
            try {
                const fetchedSetters = await dataManager.fetchUsers();
                setSetters(fetchedSetters);
            } catch(error) {
                console.error('error fetching setters', error);
            }
        };
        loadSetters();
    }, []);

    useEffect(() => {
        const loadGyms = async () => {
            try {
                const fetchedGyms = await dataManager.fetchGyms();
                const groups = {
                    northernGyms: {
                        color: 'bg-blue-900/20',
                        border: 'border-l-4 border-blue-600',
                        gyms: {} as Record<string, any>
                    },
                    eastGyms: {
                        color: 'bg-green-900/20',
                        border: 'border-l-4 border-green-600',
                        gyms: {} as Record<string, any>
                    },
                    westGyms: {
                        color: 'bg-purple-900/20',
                        border: 'border-l-4 border-purple-600',
                        gyms: {} as Record<string, any>
                    },
                    trainingCenters: {
                        color: 'bg-orange-900/20',
                        border: 'border-l-4 border-orange-600',
                        gyms: {} as Record<string, any>
                    },
                    vacationGym: {
                        color: 'bg-slate-800/40',
                        border: 'border-l-4 border-slate-400',
                        gyms: {} as Record<string, any>
                      }
                };
               
                const fetchWallsForGym = async (gym: Gym) => {
                    try {
                        const walls = await dataManager.fetchWalls(gym.id);
                        if(gym.id === 'design' || gym.id === 'denton') {
                            groups.northernGyms.gyms[gym.id] = {
                                name: gym.name,
                                walls: walls,
                            };
                        }
                        if(gym.id === 'plano' || gym.id === 'hill') {
                            groups.eastGyms.gyms[gym.id] = {
                                name: gym.name,
                                walls: walls
                            }
                        }
                        if(gym.id === 'grapevine' || gym.id === 'fortWorth') {
                            groups.westGyms.gyms[gym.id] = {
                                name: gym.name,
                                walls: walls
                            }
                        }
                        if(gym.id === 'carrolltonTC' || gym.id === 'planoTC') {
                            groups.trainingCenters.gyms[gym.id] = {
                                name: gym.name,
                                walls: walls
                            }
                        }
                        if(gym.id === 'vacation') {
                            groups.vacationGym.gyms[gym.id] = {
                                name: gym.name,
                                walls: walls
                            }
                        }
                    }
                    catch(error) {
                        console.error("Error fetching walls for ", gym.name, error)
                    }
                };
                    
                await Promise.all(fetchedGyms.map(fetchWallsForGym));
                setGymGroups(groups);
            } catch(error) {
                console.error('error fetching gyms', error)
            }
        }
        loadGyms()
    }, []);

    const dates = useMemo(() => {
      return Array.from({ length: 14 }, (_, i) => {
          const date = new Date(currentDate); // Create date from currentDate
          date.setDate(date.getDate() + i);   // Use that date's getDate()
          return createStandardizedDate(date); // Standardize after setting the date
      }).filter(date => {
          const day = date.getDay();
          return day !== 0 && day !== 6;
      }).slice(0, 10);
  }, [currentDate]);

    useEffect(() => {
      const loadScheduleEntries = async () => {
        try {
          const startDate = getDateForDatabase(dates[0]);
          const endDate = getDateForDatabase(dates[dates.length - 1]);
          
          const entries = await dataManager.fetchScheduleEntries(startDate, endDate);
                
                //walls: newData.walls.map((wallId: string) => ${wallId}),

                const newScheduleData = { ...scheduleData };
                entries.forEach(entry => {
                  const date = new Date(entry.schedule_date);
                  const dateKey = getStandardizedDateKey(date);
                  const gymKey = `${entry.gym_id}-${dateKey}`;

                  newScheduleData[gymKey] = {
                      id: entry.id,
                      //walls: entry.walls,
                      walls: entry.walls.map((wallId: string) => wallId),
                      setters: entry.setters,
                      comments: entry.comments
                  };
              });
                setScheduleData(newScheduleData);
            } catch (error) {
                console.error('Error loading schedule entries:', error);
            }
        };

        loadScheduleEntries();
    }, [dates]);

    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    };

    const toggleGym = (gymId: string) => {
        setHiddenGyms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gymId)) {
                newSet.delete(gymId);
            } else {
                newSet.add(gymId);
            }
            return newSet;
        });
    };

    return (
      <Card className="w-full bg-slate-900 border-slate-800">
          <CardContent className="p-6">
              <ScheduleHeader
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  datePickerOpen={datePickerOpen}
                  setDatePickerOpen={setDatePickerOpen}
              />

              <GymFilter
                  gymGroups={gymGroups}
                  hiddenGyms={hiddenGyms}
                  onToggleGym={toggleGym}
              />

              {/* Add an outer div for scrolling */}
              <div className="overflow-x-auto">
                  {/* Set fixed width columns using min-w classes */}
                  <div className="grid" style={{
                      gridTemplateColumns: '125px repeat(10, minmax(250px, 250px))',
                      minWidth: 'fit-content',
                      gap: '0.5rem'
                  }}>
                      <div className="font-bold text-slate-200">Gym</div>
                      {/* Rest of your grid content remains the same */}
                      {dates.map(date => (
                          <div key={date.toString()} className="text-center">
                              <div className="font-bold text-slate-200">{WEEK_DAYS[date.getDay() - 1]}</div>
                              <div className="text-slate-400">{formatDate(date)}</div>
                          </div>
                      ))}

                      {/* Your existing gym rows code */}
                       {Object.entries(gymGroups).flatMap(([groupId, group]) =>
                          Object.entries(group.gyms)
                              .filter(([gymId]) => !hiddenGyms.has(gymId))
                              .map(([gymId, gym]) => {
                                  return dates.map(date => {
                                      const dateKey = new Date(date.toISOString().split('T')[0] + 'T06:00:00.000Z').toISOString();
                                      const gymKey = `${gymId}-${dateKey}`;
                                      return (
                                          <React.Fragment key={`${gymId}-${date.toString()}`}>
                                              {date === dates[0] && (
                                                  <div className={`${group.color} p-2 font-medium rounded-md ${group.border} text-slate-200`}>
                                                      {gym.name}
                                                  </div>
                                              )}
                                              <ScheduleCell
                                                  gym={gymId}
                                                  walls={gym.walls}
                                                  setters={setters}
                                                  date={date}
                                                  scheduleData={scheduleData}
                                                  updateData={setScheduleData}
                                                  groupColor={group.color}
                                              />
                                          </React.Fragment>
                                      );
                                  });
                              })
                      )}
                  </div>
              </div>
          </CardContent>
      </Card>
  );
};

const ScheduleComponent: React.FC = () => {
    return (
        <ScheduleContent />
    );
};

export default ScheduleComponent;