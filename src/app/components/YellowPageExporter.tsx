// YellowPageExporter.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dataManager } from './DataManager';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider'; // Import the auth hook
import { 
  getStandardizedDateKey, 
  getDateForDatabase, 
  createStandardizedDate,
  getMondayOfWeekForPicker
} from '../utils/dateUtils';

const YellowPageExporter = () => {
  const [selectedGym, setSelectedGym] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth(); // Get the user data from the auth provider


   // Helper function to adjust for timezone
const createLocalDate = (dateString: string) => {
  // Create date from the input string
  const date = new Date(dateString);
  
  // Get UTC values
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDay = date.getUTCDate();
  
  // Create new date using local values
  return new Date(utcYear, utcMonth, utcDay);
};

  // Handle start date changes and validate it's a Monday
  // Update handleStartDateChange to be stricter about Mondays
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedDate = new Date(e.target.value + 'T00:00:00'); // Force midnight
  console.log('Selected date:', selectedDate, 'Day:', selectedDate.getDay());
  
  // Check if it's a Monday (1)
  if (selectedDate.getDay() !== 1) {
    setError('Please select a Monday as the start date');
    setStartDate('');
    setEndDate('');
    return;
  }

  // Calculate end date (13 days later for a 14-day period)
  const endDate = new Date(selectedDate);
  endDate.setDate(selectedDate.getDate() + 13);
  
  setStartDate(e.target.value);
  setEndDate(endDate.toISOString().split('T')[0]);
  setError(null);
};

  // Function to format date for display (M/D format)
  const formatDisplayDate = (dateString: string) => {
    const date = createLocalDate(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Function to get next Monday for min date attribute
  const getNextMonday = () => {
    const nextMonday = getMondayOfWeekForPicker();
    // Ensure we get YYYY-MM-DD in local timezone
    return nextMonday.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
  };

  const formatDateNoOffset = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Helper function to get dates in range (excluding weekends)
  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // No more weekend filtering - include all dates
      dates.push(createStandardizedDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const downloadTemplate = async (selectedGym: string) => {
      const templateFileName = `${selectedGym}-yellow-page.pdf`;
        console.log("Attempting to download:", templateFileName)

       const { data, error } = await supabase.storage
         .from('yellow-page-templates')
         .download(templateFileName);

        if (error) {
         console.error('Error loading template:', error);
         throw new Error(`Failed to load template: ${error.message}`);
       }

       if (!data) {
            console.error('No template data loaded.');
           throw new Error("No template data returned from Supabase.")
         }

      return data;
   }

   const generateYellowPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is head setter
      if (user?.user_metadata?.role !== 'head_setter') {
        setError('You must be a head setter to download the Yellow Page.');
        setLoading(false);
        return;
      }
  
      // Fetch all walls for the selected gym once at the start
      const gymWalls = await dataManager.fetchWalls(selectedGym);
      const wallsMap = new Map(gymWalls.map(wall => [wall.id, wall]));
      
      // Function to get wall info
      const getWallInfo = (wallId: string) => {
        const wall = wallsMap.get(wallId);
        if (!wall) return null;
        return {
          type: wall.wall_type,
          name: wall.name,
          angle: wall.angle
        };
      };
  
      const templateData = await downloadTemplate(selectedGym);
      const pdfDoc = await PDFDocument.load(await templateData.arrayBuffer(), {
        updateMetadata: false,
        ignoreEncryption: true,
      });
  
      const form = pdfDoc.getForm();
      
      // Create standardized dates
      const startDateTime = createStandardizedDate(new Date(startDate));
      const endDateTime = createStandardizedDate(new Date(endDate));
      
      // Add date range to both pages
      const dateRange = `${formatDateNoOffset(startDate)}-${formatDateNoOffset(endDate)}`;
      const dateRangeField1 = form.getTextField('Date Range');
      if (dateRangeField1) dateRangeField1.setText(dateRange);
  
      // Check if gym has rope walls
      const hasRopeWalls = gymWalls.some(wall => wall.wall_type === 'rope');
      
      if (hasRopeWalls) {
        const dateRangeField2 = form.getTextField('Date Range 2');
        if (dateRangeField2) dateRangeField2.setText(dateRange);
      }
  
      // Get all dates in range, standardized and excluding weekends
      const dates = getDatesInRange(startDateTime, endDateTime);
  
      // Fetch schedule data using database-formatted dates
      const scheduleData = await dataManager.fetchScheduleEntries(
        getDateForDatabase(startDateTime),
        getDateForDatabase(endDateTime)
      );
      const gymEntries = scheduleData.filter(entry => entry.gym_id === selectedGym);
      
      // Create entry map using standardized keys
      const entryMap = new Map(
        gymEntries.map(entry => [
          getStandardizedDateKey(new Date(entry.schedule_date)),
          entry
        ])
      );
  
      // Fill rope walls
      if (hasRopeWalls) {
        dates.forEach((date, index) => {
          const rowNumber = index + 1;
          if (rowNumber > 14) return;
  
          const dateField = form.getTextField(`Date ${rowNumber}`);
          const locationField = form.getTextField(`Location ${rowNumber}`);
          const typeField = form.getTextField(`Climb Type ${rowNumber}`);
          const settersField = form.getTextField(`# of Setters ${rowNumber}`);
  
          if (dateField) {
            dateField.setText(formatDateNoOffset(date.toISOString()));
          }
  
          const entry = entryMap.get(getStandardizedDateKey(date));
          
          if (entry) {
            const ropeWalls = entry.walls
              .map(wallId => getWallInfo(wallId))
              .filter(wall => wall && wall.type === 'rope');
  
            if (ropeWalls.length > 0) {
              const wallNames = ropeWalls.map(wall => wall.name);
              if (locationField) locationField.setText(wallNames.join(', '));
              
              // Set type field to angles in matching order
              if (typeField) {
                const angles = ropeWalls.map(wall => wall.angle || '—');
                typeField.setText(angles.join(', '));
              }
              
              if (settersField) settersField.setText(entry.setters.length.toString());
            } else {
              if (locationField) locationField.setText('—');
              if (typeField) typeField.setText('—');
              if (settersField) settersField.setText('—');
            }
          } else {
            if (locationField) locationField.setText('—');
            if (typeField) typeField.setText('—');
            if (settersField) settersField.setText('—');
          }
        });
      }
  
      // Fill boulder walls
      const boulderStartIndex = hasRopeWalls ? 15 : 1;
      dates.forEach((date, index) => {
        if (!hasRopeWalls && index >= 14) return;
        if (hasRopeWalls && index >= 14) return;
  
        const rowNumber = hasRopeWalls ? boulderStartIndex + index : index + 1;
        const dateField = form.getTextField(`Date ${rowNumber}`);
        const locationField = form.getTextField(`Location ${rowNumber}`);
        const typeField = form.getTextField(`Climb Type ${rowNumber}`);
        const settersField = form.getTextField(`# of Setters ${rowNumber}`);
  
        if (dateField) {
          dateField.setText(formatDateNoOffset(date.toISOString()));
        }
  
        const entry = entryMap.get(getStandardizedDateKey(date));
        
        if (entry) {
          const boulderWalls = entry.walls
            .map(wallId => getWallInfo(wallId))
            .filter(wall => wall && wall.type === 'boulder');
  
          if (boulderWalls.length > 0) {
            const wallNames = boulderWalls.map(wall => wall.name);
            if (locationField) locationField.setText(wallNames.join(', '));
            
            // Set type field to angles in matching order
            if (typeField) {
              const angles = boulderWalls.map(wall => wall.angle || '—');
              typeField.setText(angles.join(', '));
            }
            
            if (settersField) settersField.setText(entry.setters.length.toString());
          } else {
            if (locationField) locationField.setText('—');
            if (typeField) typeField.setText('—');
            if (settersField) settersField.setText('—');
          }
        } else {
          if (locationField) locationField.setText('—');
          if (typeField) typeField.setText('—');
          if (settersField) settersField.setText('—');
        }
      });
  
      // Save and download PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
      });
  
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedGym}-schedule-${dateRange}.pdf`;
      link.click();
  
      window.URL.revokeObjectURL(url);
  
    } catch (error) {
      console.error('Error in generateYellowPage:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-slate-900 text-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Yellow Page Creator</CardTitle>
        <Button 
          variant="outline" 
          className="bg-slate-700 text-slate-200"
          onClick={() => router.push('/')}
        >
          Back to Schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedGym} onValueChange={setSelectedGym}>
          <SelectTrigger className="bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select a gym" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design District</SelectItem>
            <SelectItem value="denton">Denton</SelectItem>
            <SelectItem value="hill">The Hill</SelectItem>
            <SelectItem value="plano">Plano</SelectItem>
            <SelectItem value="grapevine">Grapevine</SelectItem>
            <SelectItem value="fortWorth">Fort Worth</SelectItem>
             <SelectItem value="carrolltonTC">Carrollton TC</SelectItem>
            <SelectItem value="planoTC">Plano TC</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-4">
          <div className="space-y-2">
            <label>Start Date (Must be a Monday)</label>
            <Input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="bg-slate-800 border-slate-700"
              step={7} // Only allow selection in 7-day increments
              min={getNextMonday()} // Only allow future Mondays
            />
          </div>

          {startDate && endDate && (
            <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
              <p>Schedule Period: {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</p>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
        {!selectedGym && startDate && endDate && (
  <div className="text-amber-500 text-sm">Please select a gym to generate the Yellow Page.</div>
)}
        <Button
  onClick={generateYellowPage}
  className="w-full bg-blue-600 hover:bg-blue-700"
  disabled={loading || !startDate || !endDate || !selectedGym}  // Added !selectedGym check
>
  {loading ? 'Generating...' : 'Generate Yellow Page'}
</Button>
      </CardContent>
    </Card>
  );
};

export default YellowPageExporter;