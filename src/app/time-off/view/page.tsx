'use client';
// src/app/time-off/view/page.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { dataManager, TimeOffRequest } from '../../components/DataManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ViewTimeOffPage() {
  const router = useRouter();
  const { user } = useAuth();
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

  const isHeadSetter = user?.role === 'head_setter';

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // If head setter, fetch all requests, otherwise fetch only user's requests
      const fetchedRequests = await dataManager.fetchTimeOffRequests(
        isHeadSetter ? undefined : user?.id
      );

      setRequests({
        pending: fetchedRequests.filter(r => r.status === 'pending'),
        approved: fetchedRequests.filter(r => r.status === 'approved'),
        denied: fetchedRequests.filter(r => r.status === 'denied'),
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: TimeOffRequest) => {
    try {
      await dataManager.updateTimeOffRequest(
        request.id,
        'approved',
        user?.id || '',
      );
      await loadRequests();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest || !denyReason) return;

    try {
      await dataManager.updateTimeOffRequest(
        selectedRequest.id,
        'denied',
        user?.id || '',
        denyReason
      );
      setShowDenyDialog(false);
      setDenyReason('');
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      setError(error.message);
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
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Setter Name Header */}
                <div className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">
                  {request.users?.name}'s Request
                </div>
                
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-slate-200">
                      <span className="text-slate-400">Dates: </span>
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </p>
                    {request.hours > 0 && (
                      <p className="text-slate-200">
                        <span className="text-slate-400">Hours: </span>
                        {request.hours}
                      </p>
                    )}
                    <p className="text-slate-200">
                      <span className="text-slate-400">Type: </span>
                      {request.type}
                    </p>
                    <p className="text-slate-200">
                      <span className="text-slate-400">Reason: </span>
                      {request.reason}
                    </p>
                    {status === 'denied' && (
                      <p className="text-red-400 mt-2">
                        <span className="text-slate-400">Denial Reason: </span>
                        {request.reason}
                      </p>
                    )}
                  </div>
                  
                  {status === 'pending' && isHeadSetter && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDenyDialog(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
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
              className="border-slate-700 hover:bg-slate-700 text-slate-200"
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
    </div>
  );
}