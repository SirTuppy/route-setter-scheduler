import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { dataManager, User } from '../components/DataManager';
import { getDateForDatabase } from '../utils/dateUtils';
import {
    DESIGN_GYM_CONFIG,
    DENTON_GYM_CONFIG,
    HILL_GYM_CONFIG,
    PLANO_GYM_CONFIG,
    GRAPEVINE_GYM_CONFIG,
    FORT_WORTH_GYM_CONFIG,
    CARROLLTON_TC_GYM_CONFIG,
    PLANO_TC_GYM_CONFIG
} from '../config/wall-config';
import { useMediaQuery } from 'usehooks-ts';
import MyScheduleMobileView from './MyScheduleMobileView';

const MyScheduleView = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [scheduleData, setScheduleData] = useState([]);
    const [allUsers, setAllUsers] = useState<Record<string, User>>({}); // Store users by ID
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Get the date range for the two weeks
    const dateRange = useMemo(() => {
        const dates = [];
        const startDate = new Date(currentDate);
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // adjust when sunday

        const monday = new Date(startDate);
        monday.setDate(diff);

        for (let week = 0; week < 2; week++) {
            for (let i = 0; i < 5; i++) { // 5 weekdays in a week
                const date = new Date(monday);
                date.setDate(monday.getDate() + i + (week * 7));
                dates.push(date);
            }
        }

        return dates;
    }, [currentDate]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await dataManager.fetchUsers();
                const userMap = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {});
                setAllUsers(userMap);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        loadUsers();
    }, []);

    useEffect(() => {
        const loadSchedule = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const startDate = getDateForDatabase(dateRange[0]);
                const endDate = getDateForDatabase(dateRange[dateRange.length - 1]);

                const entries = await dataManager.fetchScheduleEntries(startDate, endDate);

                // Filter entries where the current user is a setter
                const userEntries = entries.filter(entry =>
                    entry.setters.includes(user.id)
                );

                setScheduleData(userEntries);
            } catch (error) {
                console.error('Error loading schedule:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadSchedule();
    }, [user?.id, dateRange]);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    const getSetterNames = (setterIds: string[]) => {
        return setterIds.map(setterId => allUsers[setterId]?.name || 'Unknown User')
    }

    const GYM_CONFIGS = {
        design: DESIGN_GYM_CONFIG,
        denton: DENTON_GYM_CONFIG,
        hill: HILL_GYM_CONFIG,
        plano: PLANO_GYM_CONFIG,
        grapevine: GRAPEVINE_GYM_CONFIG,
        fortWorth: FORT_WORTH_GYM_CONFIG,
        carrolltonTC: CARROLLTON_TC_GYM_CONFIG,
        planoTC: PLANO_TC_GYM_CONFIG
    };

    const cleanWallId = (wallId: string) => {
        for (const gymId of Object.keys(GYM_CONFIGS)) {
            const prefix = `${gymId}-`;
            if (wallId.startsWith(prefix)) {
                return wallId.slice(prefix.length);
            }
        }
        return wallId;
    };

    const calculateMetrics = (entry) => {
        if (!entry.walls.length || entry.gym_id === 'vacation') {
            return { difficulty: 0, totalClimbs: 0 };
        }

        const gymConfig = GYM_CONFIGS[entry.gym_id];
        if (!gymConfig) return { difficulty: 0, totalClimbs: 0 };

        const wallConfigs = entry.walls
            .map(wallId => {
                const cleanId = cleanWallId(wallId);
                return gymConfig.walls[cleanId];
            })
            .filter(config => config); // Remove any undefined configs

        if (!wallConfigs.length) return { difficulty: 0, totalClimbs: 0 };

        const totalDifficulty = wallConfigs.reduce((sum, wall) => sum + wall.difficulty, 0);
        const avgDifficulty = Number((totalDifficulty / wallConfigs.length).toFixed(1));

        const totalClimbsPerSetter = wallConfigs.reduce((sum, wall) => sum + wall.climbsPerSetter, 0);
        const avgClimbsPerSetter = Math.ceil(totalClimbsPerSetter / wallConfigs.length);
        const totalClimbs = avgClimbsPerSetter * entry.setters.length;

        return { difficulty: avgDifficulty, totalClimbs };
    };

    const getGymGroupStyle = (gymId) => {
        const gymGroups = {
            design: 'bg-blue-900/20',
            denton: 'bg-blue-900/20',
            hill: 'bg-green-900/20',
            plano: 'bg-green-900/20',
            grapevine: 'bg-purple-900/20',
            fortWorth: 'bg-purple-900/20',
            carrolltonTC: 'bg-orange-900/20',
            planoTC: 'bg-orange-900/20',
            vacation: 'bg-slate-800/40'
        };
        return gymGroups[gymId] || 'bg-slate-700/50';
    };

    const getGymName = (gymId) => {
        const gymNames = {
            design: 'Design District',
            denton: 'Denton',
            plano: 'Plano',
            hill: 'The Hill',
            grapevine: 'Grapevine',
            fortWorth: 'Fort Worth',
            carrolltonTC: 'Carrollton TC',
            planoTC: 'Plano TC',
            vacation: 'Vacation'
        };
        return gymNames[gymId] || gymId;
    };

    const adjustDate = useCallback((weeks) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + weeks * 7 * 2);
        setCurrentDate(newDate);
    }, [currentDate, setCurrentDate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 p-4">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="text-slate-200">Loading...</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Add these logs right before the return statement
console.log('All Schedule Data:', scheduleData);
console.log('Date Range:', dateRange);
console.log('All Users:', allUsers);

    return (
        <>
    {isMobile ? (
      <MyScheduleMobileView 
        dateRange={dateRange}
        scheduleData={scheduleData}
        allUsers={allUsers}
        adjustDate={adjustDate}
        getGymGroupStyle={getGymGroupStyle}
        getGymName={getGymName}
        loading={loading}
        DESIGN_GYM_CONFIG={DESIGN_GYM_CONFIG}
        DENTON_GYM_CONFIG={DENTON_GYM_CONFIG}
        HILL_GYM_CONFIG={HILL_GYM_CONFIG}
        PLANO_GYM_CONFIG={PLANO_GYM_CONFIG}
        GRAPEVINE_GYM_CONFIG={GRAPEVINE_GYM_CONFIG}
        FORT_WORTH_GYM_CONFIG={FORT_WORTH_GYM_CONFIG}
        CARROLLTON_TC_GYM_CONFIG={CARROLLTON_TC_GYM_CONFIG}
        PLANO_TC_GYM_CONFIG={PLANO_TC_GYM_CONFIG}
      />
    ) : (
        <div className="min-h-screen bg-slate-900 p-4">
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
                    <CardTitle className="text-xl text-slate-100">My Schedule</CardTitle>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustDate(-1)}
                            className="bg-slate-700 border-slate-600 text-slate-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustDate(1)}
                            className="bg-slate-700 border-slate-600 text-slate-200"
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/')}
                            className="bg-slate-700 border-slate-600 text-slate-200"
                        >
                            View Full Schedule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-auto">
                     <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                           {dateRange.map(date => {
                            const dateStr = getDateForDatabase(date);
                                const dayEntries = scheduleData.filter(entry => entry.schedule_date === dateStr);
                             return (
                                   <div key={dateStr} className="space-y-4">
                                  <div key={date.toISOString()}
                                        className="text-center p-2 text-slate-200"
                                    >
                                         {formatDate(date)}
                                    </div>
                                   {dayEntries.map(entry => (
                                        <div 
                                            key={`${dateStr}-${entry.id}`}
                                            className={`rounded-lg border border-slate-600 overflow-hidden w-full max-w-[300px] ${getGymGroupStyle(entry.gym_id)}`}
                                        >
                                            <div className={`p-2 font-medium text-slate-200 border-b border-slate-600 bg-slate-800/50 text-center`}>
                                                {getGymName(entry.gym_id)}
                                            </div>
                                            <div className="p-3 space-y-3">
                                                {entry.gym_id !== 'vacation' && entry.walls.length > 0 && (
                                                    <>
                                                        <div className="flex justify-between items-center text-xs text-slate-200 bg-slate-700/30 rounded px-2 py-1">
                                                            <span>Difficulty: {calculateMetrics(entry).difficulty}</span>
                                                            <span>Climbs: {calculateMetrics(entry).totalClimbs}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-slate-400">Walls:</div>
                                                            <div className="text-xs text-slate-200 flex flex-wrap gap-1">
                                                                {entry.walls.map(wall => (
                                                                    <span key={wall} className="px-1.5 py-0.5 rounded bg-slate-700/50">
                                                                        {cleanWallId(wall)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {entry.setters.length > 1 && (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-slate-400">Crew:</div>
                                                        <div className="text-xs text-slate-200 flex flex-wrap gap-1">
                                                            {getSetterNames(entry.setters).join(", ")}
                                                        </div>
                                                    </div>
                                                )}

                                                {entry.comments && (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-slate-400">Comments:</div>
                                                        <div className="text-xs text-slate-200">
                                                            {entry.comments}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        ))}
                                </div>
                                  )
                                })}
                     
                        {scheduleData.length === 0 && (
                            <div className="col-span-full text-center py-8 text-slate-400">
                                No schedule entries for this period
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        </div>
    )}
    </>
    );
};

export default MyScheduleView;