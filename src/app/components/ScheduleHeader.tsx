// app/components/ScheduleHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SubmitTimeOffButton } from './SubmitTimeOffButton';
import { ViewTimeOffButton } from './ViewTimeOffButton';
import { WallEditorButton } from './WallEditorButton';
import { YellowPageButton } from './YellowPageButton';
import { MyScheduleButton } from './myScheduleButton';
import { CrewEditorButton } from './CrewEditorButton';
import UserMenu from './UserMenu';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleHeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    datePickerOpen: boolean;
    setDatePickerOpen: (open: boolean) => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  currentDate,
  onDateChange,
  datePickerOpen,
  setDatePickerOpen
}) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Create a new Date object to avoid mutating the input
      const selectedDate = new Date(date);
      // If not Monday, find the next Monday
      while (selectedDate.getDay() !== 1) {
        selectedDate.setDate(selectedDate.getDate() + 1);
      }
      onDateChange(selectedDate);
      setDatePickerOpen(false);
    }
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
            <div className="flex items-center gap-2">
    <Input
      type="date"
      value={format(currentDate, 'yyyy-MM-dd')}
      onChange={(e) => {
        const selectedDate = new Date(e.target.value);
        // Check if it's a Monday (1)
        if (selectedDate.getDay() !== 1) {
          // Find the next Monday
          while (selectedDate.getDay() !== 1) {
            selectedDate.setDate(selectedDate.getDate() + 1);
          }
        }
        onDateChange(selectedDate);
      }}
      className="bg-slate-700 border-slate-600 text-slate-200 w-44"
      step={7}
    />
  </div>
        <UserMenu/>
        <MyScheduleButton />
        <SubmitTimeOffButton />
        <ViewTimeOffButton />
        <WallEditorButton />
        <CrewEditorButton />
        <YellowPageButton />
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