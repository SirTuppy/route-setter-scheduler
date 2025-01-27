import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GymFilter from './GymFilter';
import UserMenu from './UserMenu';
import HeadSetterMenu from './HeadSetterMenu';
import AdminMenu from './AdminMenu';
import { usePermissions } from '../hooks/usePermissions';

interface ScheduleHeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    gymGroups: Record<string, any>;
    hiddenGyms: Set<string>;
    onToggleGym: (gymId: string) => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  currentDate,
  onDateChange,
  gymGroups,
  hiddenGyms,
  onToggleGym
}) => {
  const { isHeadSetter, isAdmin } = usePermissions();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value + 'T00:00:00');
    
    // Check if it's a Monday (1)
    if (selectedDate.getDay() !== 1) {
      // Find the next Monday
      while (selectedDate.getDay() !== 1) {
        selectedDate.setDate(selectedDate.getDate() + 1);
      }
    }
    
    onDateChange(selectedDate);
  };

  const adjustDate = (weeks: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (weeks * 14));
    onDateChange(newDate);
  };

  return (
    <div className="mb-4 flex justify-between items-center">
      <Button
        variant="outline"
        className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700"
        onClick={() => adjustDate(-1)}
      >
        Previous 2 Weeks
      </Button>
      <div className="flex gap-2 items-center">
        <Input
          type="date"
          value={currentDate.toISOString().split('T')[0]}
          onChange={handleDateChange}
          className="bg-slate-800 border-slate-700 text-slate-200 w-44"
          step={7}  // Only allow selection in 7-day increments
        />
        <GymFilter
          gymGroups={gymGroups}
          hiddenGyms={hiddenGyms}
          onToggleGym={onToggleGym}
        />
        <UserMenu />
        {isHeadSetter && <HeadSetterMenu />}
        {isAdmin && <AdminMenu />}
      </div>
      <Button
        variant="outline"
        className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700"
        onClick={() => adjustDate(1)}
      >
        Next 2 Weeks
      </Button>
    </div>
  );
};

export default ScheduleHeader;