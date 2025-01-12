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
import RealtimeManager from './RealtimeManager';
import { Button } from '@/components/ui/button'; 
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import MobileScheduleView from './MobileScheduleView';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const ScheduleContent: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(() => getMondayOfWeek());
    const [scheduleData, setScheduleData] = useState<Record<string, any>>({});
    const [gymGroups, setGymGroups] = useState<Record<string, any>>({});
    const [setters, setSetters] = useState<User[]>([]);

    const { user } = useAuth();
    const [userDetails, setUserDetails] = useState<User | null>(null);
    const [hiddenGyms, setHiddenGyms] = useState<Set<string>>(new Set());
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [weekToDelete, setWeekToDelete] = useState<Date[]>([]);
    const [gymToDelete, setGymToDelete] = useState<string | null>(null);

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
          
          console.log('Fetching entries for date range:', startDate, endDate);
const entries = await dataManager.fetchScheduleEntries(startDate, endDate);
console.log('Received entries:', entries);
                

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
                <RealtimeManager
                    onScheduleUpdate={setScheduleData}
                    startDate={dates[0]}
                    endDate={dates[dates.length - 1]}
                />
                
                {/* Desktop View */}
                <div className="hidden lg:block">
                    <ScheduleHeader
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        gymGroups={gymGroups}
                        hiddenGyms={hiddenGyms}
                        onToggleGym={toggleGym}
                    />
    
                    {/* Desktop scrolling container */}
                    <div className="overflow-x-auto">
                        <div className="relative">
                            {/* Vertical divider */}
                            <div 
                                className="absolute border-r-2 border-slate-600 opacity-80"
                                style={{
                                    left: 'calc(128px + (250px * 5) + (0.5rem * 5))',
                                    height: '100%',
                                    top: 0,
                                    zIndex: 10
                                }}
                            />
                            
                            <div className="grid" style={{
                                gridTemplateColumns: '125px repeat(10, minmax(250px, 250px))',
                                minWidth: 'fit-content',
                                gap: '0.5rem'
                            }}>
                                {/* Week labels */}
                                <div></div>
                                <div className="col-span-5 text-center text-slate-400 pb-2 border-slate-700">Week 1</div>
                                <div className="col-span-5 text-center text-slate-400 pb-2 border-slate-700">Week 2</div>
    
                                {/* Date headers */}
                                {dates.map((date, index) => (
                                    <React.Fragment key={date.toString()}>
                                        {index === 0 && <div></div>}
                                        <div className="text-center">
                                            <div className="font-bold text-slate-200">{WEEK_DAYS[date.getDay() - 1]}</div>
                                            <div className="text-slate-400">{formatDate(date)}</div>
                                        </div>
                                    </React.Fragment>
                                ))}
    
                                {/* Gym rows */}
                                {Object.entries(gymGroups).flatMap(([groupId, group]) =>
                                    Object.entries(group.gyms)
                                        .filter(([gymId]) => !hiddenGyms.has(gymId))
                                        .map(([gymId, gym]) => {
                                            return dates.map((date, index) => {
                                                const dateKey = new Date(date.toISOString().split('T')[0] + 'T06:00:00.000Z').toISOString();
                                                const gymKey = `${gymId}-${dateKey}`;
                                                return (
                                                    <React.Fragment key={`${gymId}-${date.toString()}`}>
                                                        {date === dates[0] && (
                                                            <div className={`${group.color} p-2 font-medium rounded-md ${group.border} text-slate-200`}>
                                                                <div className="flex flex-col gap-2">
                                                                    <span>{gym.name}</span>
                                                                    {userDetails?.role === 'head_setter' && (
                                                                        <>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const firstWeek = dates.slice(0, 5);
                                                                                    const secondWeek = dates.slice(5, 10);
                                                                                    const hasFirstWeekEntries = firstWeek.some(weekDate => {
                                                                                        const dateKey = getStandardizedDateKey(weekDate);
                                                                                        const key = `${gymId}-${dateKey}`;
                                                                                        return scheduleData[key]?.id;
                                                                                    });
                                                                                    setGymToDelete(gymId);
                                                                                    setWeekToDelete(hasFirstWeekEntries ? firstWeek : secondWeek);
                                                                                    setConfirmationOpen(true);
                                                                                }}
                                                                                className="w-full bg-slate-700 hover:bg-red-900 text-slate-200 border-slate-600"
                                                                            >
                                                                                Clear week
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
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
                                                            isActive={index < 5}
                                                        />
                                                    </React.Fragment>
                                                );
                                            });
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
    
                {/* Mobile View */}
                <MobileScheduleView 
                    dates={dates}
                    scheduleData={scheduleData}
                    gymGroups={gymGroups}
                    hiddenGyms={hiddenGyms}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onToggleGym={toggleGym}
                    setters={setters}
                    userDetails={userDetails}
                />
            </CardContent>
    
            {/* Clear week confirmation dialog */}
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-200">Confirm Clear Week</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Are you sure you want to clear all schedule entries from{' '}
                            {weekToDelete[0] && formatDate(weekToDelete[0])} to{' '}
                            {weekToDelete[4] && formatDate(weekToDelete[4])}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmationOpen(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                try {
                                    if (!gymToDelete) return;
                                    const weekEntries = weekToDelete
                                        .map(weekDate => {
                                            const dateKey = getStandardizedDateKey(weekDate);
                                            const key = `${gymToDelete}-${dateKey}`;
                                            return scheduleData[key]?.id;
                                        })
                                        .filter(id => id !== undefined);
    
                                    if (weekEntries.length > 0) {
                                        await Promise.all(
                                            weekEntries.map(id => dataManager.deleteScheduleEntry(id))
                                        );
                                        setScheduleData(prev => {
                                            const newData = { ...prev };
                                            weekToDelete.forEach(weekDate => {
                                                const dateKey = getStandardizedDateKey(weekDate);
                                                const key = `${gymToDelete}-${dateKey}`;
                                                delete newData[key];
                                            });
                                            return newData;
                                        });
                                    }
                                    setConfirmationOpen(false);
                                } catch (error) {
                                    console.error('Error clearing week:', error);
                                    throw error instanceof SchedulerError ? error : new SchedulerError(
                                        'Failed to clear week',
                                        ErrorCodes.DATA_UPDATE_ERROR
                                    );
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        >
                            Clear Week
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const ScheduleComponent: React.FC = () => {
    return (
        <ScheduleContent />
    );
};

export default ScheduleComponent;