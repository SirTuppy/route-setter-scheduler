import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { NavigationButton } from './NavigationButton';
import { ViewTimeOffButton } from './ViewTimeOffButton';
import { WallEditorButton } from './WallEditorButton';

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
      onDateChange(date);
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
      <div className="flex gap-2">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-700"
            >
              Select date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto bg-slate-800 border-slate-700">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleDateSelect}
              classNames={{
                day: "text-slate-200",
                month: "text-slate-200",
                year: "text-slate-200",
                day_selected: "bg-blue-500 text-white"
              }}
            />
          </PopoverContent>
        </Popover>
        <NavigationButton />
        <ViewTimeOffButton />
        <WallEditorButton />
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