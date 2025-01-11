import React, { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import MultiSelect from './MultiSelect';
import { SchedulerError, ErrorCodes } from '../errors/types';
import { User } from './DataManager';
import { dataManager } from './DataManager';
import { getStandardizedDateKey, getDateForDatabase } from '../utils/dateUtils';
import { useAuth } from '@/providers/auth-provider';
import LiveCell from './LiveCell';
import { Button }  from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Trash2 } from 'lucide-react';
  import { holidays, Holiday } from '../config/holidays';


interface Wall {
    id: string;
    name: string;
    wall_type: 'boulder' | 'rope';
    difficulty: number;
    climbsPerSetter: number;
}

interface ScheduleCellProps {
    gym: string;
    walls: Wall[];
    setters: User[];
    date: Date;
    scheduleData: Record<string, any>;
    updateData: (updater: (prev: any) => any) => void;
    groupColor: string;
     isActive: boolean;
}

const ScheduleCell: React.FC<ScheduleCellProps> = ({
    gym,
    walls,
    setters,
    date,
    scheduleData,
    updateData,
    groupColor,
    isActive
}) => {
    const [isLocked, setIsLocked] = useState(false);
    const [localComment, setLocalComment] = useState('');
    const [isCommentModified, setIsCommentModified] = useState(false);
    const { user } = useAuth();
    
    const dateKey = getStandardizedDateKey(date);
    const gymKey = `${gym}-${dateKey}`;
    const currentData = scheduleData[gymKey] || {};
    const [clearDayDialogOpen, setClearDayDialogOpen] = useState(false);
    
    const dateString = getDateForDatabase(date);

    // Determine if user is head setter based on JWT claims
    const isHeadSetter = useMemo(() => {
        return user?.user_metadata?.role === 'head_setter';
    }, [user]);

    const isHoliday = useMemo(() => {
        return holidays.find((holiday) => holiday.date === dateString);
    }, [dateString]);


    // Initialize local comment when currentData changes
    useEffect(() => {
        setLocalComment(currentData.comments || '');
        setIsCommentModified(false);
    }, [currentData.comments]);

    const handleCommentBlur = async () => {
        if (isCommentModified) {
            await updateLocalData('comments', localComment);
            setIsCommentModified(false);
        }
    };

    const updateLocalData = async (key: string, value: any) => {
      try {
          // Validate selections
          if (key === 'walls') {
            const invalidWalls = value.filter((id: string) => !walls.find(w => w.id === id));
            if (invalidWalls.length > 0) {
                throw new SchedulerError('Invalid wall selection', ErrorCodes.WALL_NOT_FOUND);
            }
        }

        if (key === 'setters') {
            const invalidSetters = value.filter((id: string) => !setters.find(s => s.id === id));
            if (invalidSetters.length > 0) {
                throw new SchedulerError('Invalid setter selection', ErrorCodes.SETTER_NOT_FOUND);
            }
        }

            // Create the new data object with the update
            const newData = {
                ...currentData,
                [key]: value
            };

            // Update local state immediately
            updateData(prev => ({
                ...prev,
                [gymKey]: newData
            }));
            
            const entry = {
                schedule_date: getDateForDatabase(date),
                gym_id: gym,
                comments: newData.comments || '',
                walls: newData.walls || [],
                setters: newData.setters || []
            };
    
            if (newData.id) {
                await dataManager.updateScheduleEntry({
                    ...entry,
                    id: newData.id,
                    created_at: currentData.created_at,
                    updated_at: new Date().toISOString()
                });
            } else {
                const createdEntry = await dataManager.createScheduleEntry(entry);
                updateData(prev => ({
                    ...prev,
                    [gymKey]: {
                        ...prev[gymKey],
                        id: createdEntry.id
                    }
                }));
            }
        }
        catch (error) {
            console.error('Error in updateLocalData:', error);
            throw error instanceof SchedulerError ? error : new SchedulerError(
                'Failed to update schedule',
                ErrorCodes.DATA_UPDATE_ERROR
            );
        }
    };

    const metrics = calculateMetrics(currentData.walls || [], currentData.setters || [], walls);

    const getWallDisplayValue = (wall: Wall) => wall.name;
    const getWallId = (wall: Wall) => wall.id;
    const getSetterDisplayValue = (setter: User) => setter.name;
    const getSetterId = (setter: User) => setter.id;

    const setterGrouping = (setter: User) => {
        if (gym === 'vacation') return 'All Setters';
        return setter.primary_gyms.includes(gym) ? `${getGymName(gym)} Crew` : 'All Setters';
    };

    const conflictingSetters = useMemo(() => {
        if (!date || !scheduleData || !gym) return [];
        
        const targetDateKey = getStandardizedDateKey(date);
        const conflicts = new Set<string>();
        
        Object.entries(scheduleData).forEach(([key, data]) => {
            if (!data.setters) return;
            
            const firstHyphenIndex = key.indexOf('-');
            if (firstHyphenIndex === -1) return;
            
            const entryGym = key.substring(0, firstHyphenIndex);
            const entryDate = key.substring(firstHyphenIndex + 1);
            
            if (entryDate === targetDateKey && entryGym !== gym) {
                data.setters.forEach(id => conflicts.add(id));
            }
        });
        
        return Array.from(conflicts);
    }, [date, scheduleData, gym]);

    const getDifficultyColor = (difficulty: number) => {
        const normalized = (difficulty - 1) / 4.2;
        let red = 0;
        let green = 0;
    
        if (normalized < 0.5) {
            green = 255;
            red = Math.round(normalized * 2 * 255);
        } else {
            green = Math.round((1 - (normalized - 0.5) * 2) * 255);
            red = 255;
        }
    
        return `rgba(${red-25}, ${green+25}, 0, 0.55)`;
    };

    return (
        <LiveCell 
            gymId={gym} 
            date={getStandardizedDateKey(date)}
            onLockedStateChange={setIsLocked}
            isActive={isActive}
             isHoliday={isHoliday}
        >
            <div className={`relative border border-slate-700 rounded-md min-h-[200px] group ${groupColor} ${isHoliday ? 'bg-red-900/50' : ''}`}>
                  {isHoliday && (
                         <div className="left-0 right-0 bottom-0 flex flex-col justify-center items-center text-xl font-bold text-red-500 z-10 pointer-events-none">
                            {isHoliday.name}
                         </div>
                )}
                <div className="space-y-2 p-2">
                    {isLocked && !isHeadSetter && (
                        <div className="text-amber-500 text-sm mb-2">
                            This cell is being edited by another user
                        </div>
                    )}
                    
                    {gym !== 'vacation' && (
                        <>
                            <div className="flex items-center gap-2">
                                <MultiSelect<Wall>
                                    items={walls}
                                    selectedIds={currentData.walls || []}
                                    onChange={wallIds => updateLocalData('walls', wallIds)}
                                    getDisplayValue={getWallDisplayValue}
                                    getId={getWallId}
                                    groupBy={(wall) => wall.wall_type === 'boulder' ? 'Boulder Walls' : 'Rope Walls'}
                                     placeholder={isHeadSetter && !isHoliday ? "Select walls" : "Walls (view only)"}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    disabled={!isHeadSetter || isLocked || !!isHoliday}
                                />
                                {isHeadSetter && currentData.id && !isLocked && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setClearDayDialogOpen(true)}
                                        className="bg-slate-700/50 hover:bg-red-900/50 text-slate-200 h-8 w-8 shrink-0 flex-none"
                                         disabled={!isHeadSetter || !!isHoliday}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-slate-700 rounded text-slate-200"
                                    style={{ backgroundColor: getDifficultyColor(metrics.difficulty) }}>
                                    Difficulty: {metrics.difficulty}
                                </div>
                                <div className="p-2 bg-slate-700 rounded text-slate-200">
                                    Climbs: {metrics.climbs}
                                </div>
                            </div>
                        </>
                    )}
    
                    <MultiSelect<User>
                        items={setters}
                        selectedIds={currentData.setters || []}
                        onChange={setterIds => updateLocalData('setters', setterIds)}
                        getDisplayValue={getSetterDisplayValue}
                        getId={getSetterId}
                        groupBy={setterGrouping}
                        isHeadSetter={(item) => item.role === 'head_setter'}
                         placeholder={isHeadSetter && !isHoliday ? "Select setters" : "Setters (view only)"}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!isHeadSetter || isLocked || !!isHoliday || conflictingSetters.reduce((acc, id) => ({
                            ...acc,
                            [id]: true
                        }), {})}
                    />
    
                    <Input
                        className="bg-slate-800 text-slate-200 border-slate-700"
                        value={localComment}
                        onChange={e => {
                            if (!isHeadSetter || isLocked) return;
                            setLocalComment(e.target.value);
                            setIsCommentModified(true);
                        }}
                        onBlur={handleCommentBlur}
                        placeholder={isHeadSetter ? "Add comments..." : "Comments (view only)"}
                        readOnly={isLocked}
                    />             
                </div>
            </div>
    
            <Dialog open={clearDayDialogOpen} onOpenChange={setClearDayDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-200">Confirm Clear Day</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Are you sure you want to clear all schedule entries for {getGymName(gym)} on {formatDate(date)}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setClearDayDialogOpen(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (currentData.id) {
                                    try {
                                        await dataManager.deleteScheduleEntry(currentData.id);
                                        updateData(prev => {
                                            const newData = { ...prev };
                                            delete newData[gymKey];
                                            return newData;
                                        });
                                    } catch (error) {
                                        console.error('Error clearing day:', error);
                                        throw error instanceof SchedulerError ? error : new SchedulerError(
                                            'Failed to clear day',
                                            ErrorCodes.DATA_UPDATE_ERROR
                                        );
                                    }
                                }
                                setClearDayDialogOpen(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                             disabled={!isHeadSetter}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Day
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </LiveCell>
    );
};
const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};
const getGymName = (gym: string): string => {
    const gymNames: Record<string, string> = {
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
    return gymNames[gym] || 'Gym Crew';
};

interface Metrics {
    difficulty: number;
    climbs: number;
}

const calculateMetrics = (
    wallIds: string[],
    setterIds: string[],
    walls: Wall[]
): Metrics => {
    if (!wallIds.length || !setterIds.length) {
        return { difficulty: 0, climbs: 0 };
    }

    const selectedWalls = walls.filter(wall => wallIds.includes(wall.id));
    const totalDifficulty = selectedWalls.reduce((sum, wall) => sum + wall.difficulty, 0);
    const totalClimbsPerSetter = selectedWalls.reduce((sum, wall) => sum + wall.climbs_per_setter, 0);
    const wallCount = selectedWalls.length;

    const avgDifficulty = wallCount > 0 ? Number((totalDifficulty / wallCount).toFixed(1)) : 0;
    const avgClimbsPerSetter = wallCount > 0 ? Math.ceil(totalClimbsPerSetter / wallCount) : 0;
    const totalClimbs = avgClimbsPerSetter * setterIds.length;

    return { difficulty: avgDifficulty, climbs: totalClimbs };
};

export default ScheduleCell;