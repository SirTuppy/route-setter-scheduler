'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { dataManager } from '../../app/components/DataManager';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

export default function TimeOffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [useHours, setUseHours] = useState(false);
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('vacation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date exists and is now invalid, clear it
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate('');
      setDateError('End date cannot be before start date');
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    
    if (startDate && new Date(newEndDate) < new Date(startDate)) {
      setDateError('End date cannot be before start date');
      setEndDate('');
    } else {
      setEndDate(newEndDate);
      setDateError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation before submission
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await dataManager.createTimeOffRequest({
        user_id: user?.id || '',
        start_date: startDate,
        end_date: endDate,
        hours: useHours ? parseInt(hours) : 0,
        reason,
        type: type as 'vacation' | 'sick' | 'other'
      });
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Failed to submit time off request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-slate-900">
      <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-slate-100">Submit Time Off Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-slate-200">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                required
                className="w-full bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-slate-200">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || new Date().toISOString().split('T')[0]} // Prevent dates before start date
                required
                className="w-full bg-slate-700 border-slate-600 text-slate-100"
              />
              {dateError && (
                <p className="text-red-400 text-sm mt-1">{dateError}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-hours"
                checked={useHours}
                onCheckedChange={(checked) => setUseHours(checked as boolean)}
                className="border-slate-500"
              />
              <Label htmlFor="use-hours" className="text-slate-200">Use hours</Label>
            </div>
            {useHours && (
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-slate-200">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  placeholder="Number of hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                  className="w-full bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-200">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-200">Reason</Label>
              <Input
                id="reason"
                type="text"
                placeholder="Reason for time off"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}
            <div className="flex gap-4">
              <Button
                type="button"
                className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}