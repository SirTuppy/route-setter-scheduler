// ViewTimeOffPage.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { dataManager, TimeOffRequest, User, ScheduleConflict } from '../../components/DataManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ViewTimeOffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [requests, setRequests] = useState<{
    pending: TimeOffRequest[];
    approved: TimeOffRequest[];
    denied: TimeOffRequest[];
  }>({
    pending: [],
    approved: [],
    denied: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [userCrew, setUserCrew] = useState<Crew | null>(null);

  const isHeadSetter = useMemo(() => 
    userDetails?.role === 'head_setter',
    [userDetails?.role]
  );
  console.log('userDetails:', userDetails);

  const refetchData = async () => {
    if (!user?.id) return;

    try {
      const fetchedRequests = await dataManager.fetchTimeOffRequests(
        isHeadSetter ? undefined : user.id
      );

      setRequests({
        pending: fetchedRequests.filter(r => r.status === 'pending'),
        approved: fetchedRequests.filter(r => r.status === 'approved'),
        denied: fetchedRequests.filter(r => r.status === 'denied'),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
        if (!user?.id) return;
        
        try {
            const details = await dataManager.fetchUserDetails(user.id);
            if (!mounted) return;
            
            setUserDetails(details);

            // If user is a head setter, fetch their crew
            if (details?.role === 'head_setter') {
                const crews = await dataManager.fetchCrews();
                const userCrew = crews.find(crew => crew.head_setter_id === user.id);
                if (mounted && userCrew) {
                    setUserCrew(userCrew);
                }
            }
            
            const fetchedRequests = await dataManager.fetchTimeOffRequests(
                user.id
            );
            
            if (!mounted) return;

            setRequests({
                pending: fetchedRequests.filter(r => r.status === 'pending'),
                approved: fetchedRequests.filter(r => r.status === 'approved'),
                denied: fetchedRequests.filter(r => r.status === 'denied'),
            });
        } catch (error) {
            if (mounted) {
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            }
        } finally {
            if (mounted) setLoading(false);
        }
    };

    if (user) {
        setLoading(true);
        loadData();
    }

    return () => {
        mounted = false;
    };
}, [user?.id]);

  const approveRequest = async (request: TimeOffRequest) => {
    if (!user?.id) return;

    try {
      await dataManager.updateTimeOffRequest(
        request.id,
        'approved',
        user.id
      );
      await refetchData();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleApprove = async (request: TimeOffRequest) => {
    if (!user?.id) return;
    
    try {
      const conflicts = await dataManager.checkTimeOffConflicts(
        request.user_id,
        request.start_date,
        request.end_date
      );
  
      if (conflicts.length > 0) {
        setConflicts(conflicts);
        setSelectedRequest(request);
        setShowConflictDialog(true);
        return;
      }
  
      await approveRequest(request);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleApproveWithConflicts = async () => {
    if (!selectedRequest || !user?.id) return;
    
    try {
      await approveRequest(selectedRequest);
      setShowConflictDialog(false);
      setSelectedRequest(null);
      setConflicts([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest || !denyReason || !user?.id) return;

    try {
      await dataManager.updateTimeOffRequest(
        selectedRequest.id,
        'denied',
        user.id,
        denyReason
      );

      await refetchData();
      setShowDenyDialog(false);
      setDenyReason('');
      setSelectedRequest(null);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const RequestSection = ({ title, requests, status }: { 
    title: string; 
    requests: TimeOffRequest[];
    status: 'pending' | 'approved' | 'denied';
  }) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
      {requests.length === 0 ? (
        <p className="text-slate-400">No requests</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="bg-slate-800 border-slate-700 max-w-default">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-md font-semibold text-slate-200 border-b border-slate-700 pb-2">
                    {request.users?.name}'s Request
                  </div>
                  
                  <div className="flex flex-col justify-between h-full">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-200">
                        <span className="text-slate-400">Dates: </span>
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                      {request.hours > 0 && (
                        <p className="text-sm text-slate-200">
                          <span className="text-slate-400">Hours: </span>
                          {request.hours}
                        </p>
                      )}
                      <p className="text-sm text-slate-200">
                        <span className="text-slate-400">Type: </span>
                        {request.type}
                      </p>
                      <p className="text-sm text-slate-200">
                        <span className="text-slate-400">Reason: </span>
                        {request.reason}
                      </p>
                      {status === 'denied' && (
                        <p className="text-sm text-red-400 mt-1">
                          <span className="text-slate-400">Denial Reason: </span>
                          {request.reason}
                        </p>
                      )}
                    </div>
                    
                    {status === 'pending' && isHeadSetter && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleApprove(request)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 h-8"
                          size="default"
                        >
                          Approve (send to Vacation)
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDenyDialog(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 h-8"
                          size="default"
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-slate-200">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-slate-900">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-slate-100">View Time Off Requests</CardTitle>
            <Button
              variant="outline"
              className="bg-slate-600 border-slate-700 hover:bg-slate-700 text-slate-200"
              onClick={() => router.push('/')}
            >
              Back to Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RequestSection title="Pending Requests" requests={requests.pending} status="pending" />
          <RequestSection title="Approved Requests" requests={requests.approved} status="approved" />
          <RequestSection title="Denied Requests" requests={requests.denied} status="denied" />
        </CardContent>
      </Card>

      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="bg-slate-800 text-slate-200 border-slate-700">
          <DialogHeader>
            <DialogTitle>Deny Time Off Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter reason for denial"
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDenyDialog(false);
                setDenyReason('');
                setSelectedRequest(null);
              }}
              className="border-slate-700 hover:bg-slate-700 text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeny}
              disabled={!denyReason}
              className="bg-red-600 hover:bg-red-700"
            >
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
  <DialogContent className="bg-slate-800 text-slate-200 border-slate-700">
    <DialogHeader>
      <DialogTitle>Schedule Conflicts Found</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <p>This setter is already scheduled on:</p>
      <ul className="list-disc pl-4 space-y-1">
        {conflicts.map((conflict, i) => (
          <li key={i}>
            {formatDate(conflict.date)} at {conflict.gym}
          </li>
        ))}
      </ul>
      <p>Approving will auto-remove them from these sessions.</p>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => {
          setShowConflictDialog(false);
          setSelectedRequest(null);
          setConflicts([]);
        }}
        className="border-slate-700 hover:bg-slate-700 text-slate-200"
      >
        Cancel
      </Button>
      <Button
        onClick={handleApproveWithConflicts}
        className="bg-green-600 hover:bg-green-700"
      >
        Approve Anyway
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}