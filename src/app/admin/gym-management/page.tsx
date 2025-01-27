// app/admin/gym-management/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { dataManager, Gym } from '@/app/components/DataManager';
import { usePermissions } from '../../hooks/usePermissions';

interface GymDialogData {
  name: string;
  location: string;
  paired_gym_id: string | null;
  active: boolean;
}

export default function GymManagementPage() {
  const { isAdmin } = usePermissions();
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [dialogData, setDialogData] = useState<GymDialogData>({
    name: '',
    location: '',
    paired_gym_id: null,
    active: true,
    });

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      const fetchedGyms = await dataManager.fetchGyms();
      setGyms(fetchedGyms);
    } catch (error) {
      console.error('Error loading gyms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGym) {
        await dataManager.updateGym(editingGym.id, dialogData);
      } else {
        await dataManager.createGym(dialogData);
      }
      
      await loadGyms();
      setDialogOpen(false);
      resetDialog();
    } catch (error) {
      console.error('Error saving gym:', error);
    }
  };

  const handleEdit = (gym: Gym) => {
    setEditingGym(gym);
    setDialogData({
      name: gym.name,
      location: gym.location,
      paired_gym_id: gym.paired_gym_id,
      active: gym.active,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (gym: Gym) => {
    try {
      await dataManager.updateGym(gym.id, { active: !gym.active });
      await loadGyms();
    } catch (error) {
      console.error('Error toggling gym status:', error);
    }
  };

  const resetDialog = () => {
    setEditingGym(null);
    setDialogData({
      name: '',
      location: '',
      paired_gym_id: null,
      active: true,
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-200 text-center">Access denied. Admin permissions required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-slate-100">Gym Management</CardTitle>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                resetDialog();
                setDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Gym
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-slate-700 border-slate-600 text-slate-200"
            >
              Back to Schedule
            </Button>
            <Button
    onClick={async () => {
      try {
        const gyms = await dataManager.fetchGyms();
        
        // Convert gyms to CSV format
        const csvContent = [
          // Headers
          ['ID', 'Name', 'Location', 'Paired Gym', 'Active', 'Created At', 'Updated At'].join(','),
          // Data rows
          ...gyms.map(gym => [
            gym.id,
            gym.name,
            gym.location,
            gym.paired_gym_id || '',
            gym.active,
            gym.created_at,
            gym.updated_at
          ].join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gyms-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error exporting gyms:', error);
      }
    }}
    className="bg-green-600 hover:bg-green-700"
  >
    Export CSV
  </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-200">Name</TableHead>
                <TableHead className="text-slate-200">Location</TableHead>
                <TableHead className="text-slate-200">Paired Gym</TableHead>
                <TableHead className="text-slate-200">Status</TableHead>
                <TableHead className="text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gyms.map((gym) => (
                <TableRow key={gym.id}>
                  <TableCell className="text-slate-300">{gym.name}</TableCell>
                  <TableCell className="text-slate-300">{gym.location}</TableCell>
                  <TableCell className="text-slate-300">
                    {gym.paired_gym_id ? gyms.find(g => g.id === gym.paired_gym_id)?.name : '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={gym.active}
                      onCheckedChange={() => handleToggleActive(gym)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(gym)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-200">
              {editingGym ? 'Edit Gym' : 'Create Gym'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Name</label>
              <Input
                value={dialogData.name}
                onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Location</label>
              <Input
                value={dialogData.location}
                onChange={(e) => setDialogData({ ...dialogData, location: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Paired Gym</label>
              <Select
  value={dialogData.paired_gym_id || 'none'}
  onValueChange={(value) =>
    setDialogData({ 
      ...dialogData, 
      paired_gym_id: value === 'none' ? null : value 
    })
  }
>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                  <SelectValue placeholder="Select a paired gym" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none">None</SelectItem>
                  {gyms
                    .filter((g) => g.id !== editingGym?.id)
                    .map((gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={dialogData.active}
                onCheckedChange={(checked) =>
                  setDialogData({ ...dialogData, active: checked })
                }
                className="data-[state=checked]:bg-green-600"
              />
              <label className="text-sm text-slate-200">Active</label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="bg-slate-700 border-slate-600 text-slate-200"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingGym ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}