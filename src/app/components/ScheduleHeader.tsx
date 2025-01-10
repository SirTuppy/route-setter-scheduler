// app/components/ScheduleHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="flex gap-2 items-center">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'bg-slate-700 text-slate-200 hover:bg-slate-600',
                                datePickerOpen && 'bg-slate-700'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4"/>
                            {format(currentDate, 'MMM dd, yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-700">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleDateSelect}
                            classNames={{
                              day: "text-slate-300",
                              month: "text-slate-300",
                              year: "text-slate-300",
                              day_selected: "bg-blue-500 text-white"
                            }}
                        />
                    </PopoverContent>
                </Popover>
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