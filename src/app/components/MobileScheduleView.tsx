import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import UserMenu from './UserMenu';
import HeadSetterMenu from './HeadSetterMenu';
import ScheduleCell  from './ScheduleCell';
import { 
    Building2
 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const MobileScheduleView = ({
    dates,
    scheduleData,
    gymGroups,
    hiddenGyms,
    currentDate,
    onDateChange,
    onToggleGym,
    setters
}) => {
    const formatDate = (date) => {
        return format(date, 'EEE, MMM d');
    };
    const { isHeadSetter } = usePermissions();

    return (
        <div className="flex flex-col space-y-4 lg:hidden min-h-screen bg-slate-900">
            {/* Mobile Header */}
            <div className="flex flex-col space-y-2 p-4 bg-slate-900 sticky top-0 z-10 w-full">
                {/* Date navigation */}
                <div className="flex justify-between gap-2">
                    <Button
                        variant="outline"
                        className="w-1/2 bg-slate-700 border-slate-600 text-slate-200"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setDate(currentDate.getDate() - 14);
                            onDateChange(newDate);
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        className="w-1/2 bg-slate-700 border-slate-600 text-slate-200"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setDate(currentDate.getDate() + 14);
                            onDateChange(newDate);
                        }}
                    >
                        Next
                    </Button>
                </div>

                {/* Date picker */}
                <input
                    type="date"
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        if (selectedDate.getDay() !== 1) {
                            while (selectedDate.getDay() !== 1) {
                                selectedDate.setDate(selectedDate.getDate() + 1);
                            }
                        }
                        onDateChange(selectedDate);
                    }}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
                    step={7}
                />

               {/* Menu buttons - new layout */}
                <div className="flex gap-1 w-full">
                    <UserMenu  className="basis-1/2 w-full"/>
                    {isHeadSetter && <HeadSetterMenu />}
                </div>
            </div>


            {/* Scrollable content */}
            <div className="overflow-x-auto bg-slate-900 w-full">
                <div className="flex snap-x snap-mandatory touch-pan-x p-4 gap-3">
                    {dates.map(date => (
                        <div
                            key={date.toString()}
                            className="w-[90vw] flex-shrink-0 bg-slate-800/50 rounded-lg p-4 snap-center"
                        >
                            <h3 className="text-lg font-bold text-slate-200 mb-4">
                                {formatDate(date)}
                            </h3>

                            <div className="space-y-4">
                                {Object.entries(gymGroups)
                                    .map(([groupId, group]) => (
                                        Object.entries(group.gyms)
                                            .map(([gymId, gym]) => (
                                                <div key={`${date}-${gymId}`} className={`${group.color} rounded-lg`}>
                                                    <div className={`p-2 font-medium rounded-t-lg ${group.border} text-slate-200`}>
                                                        {gym.name}
                                                    </div>
                                                    <ScheduleCell
                                                        gym={gymId}
                                                        walls={gym.walls}
                                                        setters={setters}
                                                        date={date}
                                                        scheduleData={scheduleData}
                                                        groupColor=""
                                                    />
                                                </div>
                                            ))
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileScheduleView;