import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dataManager } from './DataManager';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/lib/supabase';
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

const YellowPageExporter = () => {
  const [selectedGym, setSelectedGym] = useState('design');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to adjust for timezone
  const createLocalDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  // Handle start date changes and validate it's a Monday
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = createLocalDate(e.target.value);
    
    // Check if it's a Monday (getDay() returns 0 for Sunday, 1 for Monday, etc.)
    if (inputDate.getDay() !== 1) {
      setError('Please select a Monday as the start date');
      setStartDate('');
      setEndDate('');
      return;
    }

    // Calculate end date (13 days later to make it a 14-day period)
    const endDate = new Date(inputDate);
    endDate.setDate(inputDate.getDate() + 13);

    // Format dates for state
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
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? 1 : 8 - day); // If Sunday, get next Monday, else get to next Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
  };

  const formatDateNoOffset = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const generateYellowPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const gymConfig = GYM_CONFIGS[selectedGym];
      if (!gymConfig) {
        throw new Error('No configuration found for selected gym');
      }
  
      const hasRopeWalls = Object.values(gymConfig.walls).some(wall => wall.type === 'rope');
  
      const { data: templateData, error: templateError } = await supabase
        .storage
        .from('yellow-page-templates')
        .download(`${selectedGym}-yellow-page.pdf`);
        
      if (templateError) throw new Error('Failed to load template');
      if (!templateData) throw new Error('No template found');
  
      const pdfDoc = await PDFDocument.load(await templateData.arrayBuffer(), {
        updateMetadata: false,
        ignoreEncryption: true,
      });
      
      const form = pdfDoc.getForm();
  
      // Add date range to both pages
      const dateRange = `${formatDateNoOffset(startDate)}-${formatDateNoOffset(endDate)}`;
      const dateRangeField1 = form.getTextField('Date Range');
      if (dateRangeField1) dateRangeField1.setText(dateRange);
  
      if (hasRopeWalls) {
        const dateRangeField2 = form.getTextField('Date Range 2');
        if (dateRangeField2) dateRangeField2.setText(dateRange);
      }
  
      // Generate all dates in the range
      const dates: Date[] = [];
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      while (currentDate <= endDateObj) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      const scheduleData = await dataManager.fetchScheduleEntries(startDate, endDate);
      const gymEntries = scheduleData.filter(entry => entry.gym_id === selectedGym);
  
      const cleanWallId = (wallId: string) => {
        const prefix = `${selectedGym}-`;
        return wallId.startsWith(prefix) ? wallId.slice(prefix.length) : wallId;
      };
  
      const getWallType = (wallId: string) => {
        const cleanId = cleanWallId(wallId);
        return gymConfig.walls[cleanId]?.type;
      };
  
      // Create a map of date strings to entries for easy lookup
      const entryMap = new Map(
        gymEntries.map(entry => [entry.schedule_date, entry])
      );
  
      // Fill all dates for rope page first
      if (hasRopeWalls) {
        dates.forEach((date, index) => {
          const rowNumber = index + 1;
          if (rowNumber > 14) return; // Only first 14 rows for first page
  
          const dateField = form.getTextField(`Date ${rowNumber}`);
          const locationField = form.getTextField(`Location ${rowNumber}`);
          const settersField = form.getTextField(`# of Setters ${rowNumber}`);
  
          if (dateField) {
            const dateStr = formatDateNoOffset(date.toISOString());
            dateField.setText(dateStr);
          }
  
          const entry = entryMap.get(date.toISOString().split('T')[0]);
          
          if (entry && entry.walls.some(wallId => getWallType(wallId) === 'rope')) {
            const wallNames = entry.walls
              .filter(wallId => getWallType(wallId) === 'rope')
              .map(wallId => cleanWallId(wallId));
  
            if (locationField) locationField.setText(wallNames.join(', '));
            if (settersField) settersField.setText(entry.setters.length.toString());
          } else {
            if (locationField) locationField.setText('—');
            if (settersField) settersField.setText('—');
          }
        });
      }
  
      // Fill all dates for boulder page
      const boulderStartIndex = hasRopeWalls ? 15 : 1;
      dates.forEach((date, index) => {
        if (!hasRopeWalls && index >= 14) return; // Only first 14 rows for boulder-only gyms
        if (hasRopeWalls && index >= 14) return; // Only second 14 rows for mixed gyms
  
        const rowNumber = hasRopeWalls ? boulderStartIndex + index : index + 1;
        const dateField = form.getTextField(`Date ${rowNumber}`);
        const locationField = form.getTextField(`Location ${rowNumber}`);
        const settersField = form.getTextField(`# of Setters ${rowNumber}`);
  
        if (dateField) {
          const dateStr = formatDateNoOffset(date.toISOString());
          dateField.setText(dateStr);
        }
  
        const entry = entryMap.get(date.toISOString().split('T')[0]);
        
        if (entry && entry.walls.some(wallId => getWallType(wallId) === 'boulder')) {
          const wallNames = entry.walls
            .filter(wallId => getWallType(wallId) === 'boulder')
            .map(wallId => cleanWallId(wallId));
  
          if (locationField) locationField.setText(wallNames.join(', '));
          if (settersField) settersField.setText(entry.setters.length.toString());
        } else {
          if (locationField) locationField.setText('—');
          if (settersField) settersField.setText('—');
        }
      });
  
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
    <Card className="w-full bg-slate-900 text-slate-200">
      <CardHeader>
        <CardTitle>Yellow Page Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedGym} onValueChange={setSelectedGym}>
          <SelectTrigger className="bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select a gym" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design District</SelectItem>
            <SelectItem value="denton">Denton</SelectItem>
            {/* Add other gyms */}
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

        <Button
          onClick={generateYellowPage}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={loading || !startDate || !endDate}
        >
          {loading ? 'Generating...' : 'Generate Yellow Page'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default YellowPageExporter;