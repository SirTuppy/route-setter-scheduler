import React, { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import MultiSelect from './MultiSelect';
import { SchedulerError, ErrorCodes } from '../errors/types';
import { User } from './DataManager';
import { dataManager } from './DataManager';
import { getStandardizedDateKey, getDateForDatabase } from '../utils/dateUtils';
import { usePermissions } from '../hooks/usePermissions';

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
}

const ScheduleCell: React.FC<ScheduleCellProps> = ({
    gym,
    walls,
    setters,
    date,
    scheduleData,
    updateData,
    groupColor
}) => {
    const [localComment, setLocalComment] = useState('');
    const [isCommentModified, setIsCommentModified] = useState(false);
    const { isHeadSetter, loading } = usePermissions();
    
    const dateKey = getStandardizedDateKey(date);
    const gymKey = `${gym}-${dateKey}`;
    const currentData = scheduleData[gymKey] || {};

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
    
            // Save to database if we have any of: walls, setters, or comments
            if (key === 'comments' || newData.walls?.length || newData.setters?.length) {
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
                    // Update local state with the new ID
                    updateData(prev => ({
                        ...prev,
                        [gymKey]: {
                            ...prev[gymKey],
                            id: createdEntry.id
                        }
                    }));
                }
            }
        } catch (error) {
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
        
        // Use the standardized date key for the target date
        const targetDateKey = getStandardizedDateKey(date);
        
        const conflicts = new Set<string>();
        
        // Loop through all schedule entries
        Object.entries(scheduleData).forEach(([key, data]) => {
            if (!data.setters) return;
            
            // Extract gym and date using indexOf/substring to preserve full date string
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
        // Normalize difficulty to 0-1 range (1-5 -> 0-1)
        const normalized = (difficulty - 1) / 4.2;
    
        // Create a color transition from green to yellow to red
        let red = 0;
        let green = 0;
    
        if (normalized < 0.5) {
            // From green to yellow
            green = 255;
            red = Math.round(normalized * 2 * 255);
        } else {
            // From yellow to red
            green = Math.round((1 - (normalized - 0.5) * 2) * 255);
            red = 255;
        }
    
        return `rgba(${red-25}, ${green+25}, 0, 0.6)`;
    };

    return (
        <div className={`${groupColor} border border-slate-700 rounded-md min-h-[200px]`}>
            <div className="space-y-2 p-2">
                {gym !== 'vacation' && (
                    <>
                        <MultiSelect<Wall>
    items={walls}
    selectedIds={currentData.walls || []}
    onChange={wallIds => updateLocalData('walls', wallIds)}
    getDisplayValue={getWallDisplayValue}
    getId={getWallId}
    groupBy={(wall) => wall.wall_type === 'boulder' ? 'Boulder Walls' : 'Rope Walls'}
    placeholder={isHeadSetter ? "Select walls" : "Walls (view only)"}
    variant="outline"
    size="sm"
    className="w-full"
    disabled={!isHeadSetter} // Changed to boolean
/>
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
    placeholder={isHeadSetter ? "Select setters" : "Setters (view only)"}
    variant="outline"
    size="sm"
    className="w-full"
    disabled={!isHeadSetter || conflictingSetters.reduce((acc, id) => ({
        ...acc,
        [id]: true
    }), {})}
/>

<Input
    className="bg-slate-800 text-slate-200 border-slate-700"
    value={localComment}
    onChange={e => {
        if (!isHeadSetter) return;
        setLocalComment(e.target.value);
        setIsCommentModified(true);
    }}
    onBlur={handleCommentBlur}
    placeholder={isHeadSetter ? "Add comments..." : "Comments (view only)"}
    readOnly={!isHeadSetter}
/>             
            </div>
        </div>
    );
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