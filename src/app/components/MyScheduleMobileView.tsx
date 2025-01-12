import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useRouter } from 'next/navigation';

const MyScheduleMobileView = ({ 
  dateRange, 
  scheduleData,
  allUsers,
  adjustDate,
  getGymGroupStyle
}) => {
  const [expandedDates, setExpandedDates] = useState(new Set([dateRange[0]?.toISOString()]));

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const router = useRouter();

  const toggleDate = (dateKey) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => adjustDate(-1)}
              className="w-1/4 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Previous
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="w-2/4 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              View Full Schedule
            </Button>
            <Button
              onClick={() => adjustDate(1)}
              className="w-1/4 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {dateRange.map(date => {
            const dateEntries = scheduleData.filter(entry => 
              new Date(entry.schedule_date).toDateString() === date.toDateString()
            );
            
            const hasSchedule = dateEntries.length > 0;
            const isExpanded = expandedDates.has(date.toISOString());

            if (hasSchedule) {
              return (
                <Collapsible
                  key={date.toISOString()}
                  open={isExpanded}
                  onOpenChange={() => toggleDate(date.toISOString())}
                  className="rounded-lg border border-slate-600"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-3 ${
                      getGymGroupStyle(dateEntries[0].gym_id)
                    } rounded-t-lg`}>
                      <div className="flex items-center gap-2">
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4 text-slate-400" /> : 
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        }
                        <span className="text-slate-200 font-medium">{formatDate(date)}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {dateEntries.map(entry => 
                          entry.gym_id === 'design' ? 'Design District' : entry.gym_id
                        ).join(', ')}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 p-3">
                      {dateEntries.map(entry => (
                        <div 
                          key={entry.id} 
                          className={`p-4 rounded-lg ${getGymGroupStyle(entry.gym_id)} border border-slate-700`}
                        >
                          {entry.gym_id !== 'vacation' && (
                            <>
                              <div className="text-sm text-slate-300 mb-2">
                                <strong>Walls:</strong> {entry.walls.map(w => w.split('-')[1]).join(', ')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="p-2 bg-slate-700 rounded text-slate-200 text-sm">
                                  Difficulty: {entry.difficulty || 3}
                                </div>
                                <div className="p-2 bg-slate-700 rounded text-slate-200 text-sm">
                                  Climbs: {entry.climbs || 12}
                                </div>
                              </div>
                            </>
                          )}
                          
                          <div className="text-sm text-slate-300">
                            <strong>Crew:</strong> {entry.setters.map(id => allUsers[id]?.name).join(', ')}
                          </div>
                          
                          {entry.comments && (
                            <div className="mt-2 text-sm text-slate-400">
                              <strong>Comments:</strong> {entry.comments}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            } else {
              return (
                <div key={date.toISOString()} className="rounded-lg border border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium">{formatDate(date)}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      No schedule for this day
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyScheduleMobileView;