// app/admin/user-management/page.tsx
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
import { useRouter } from 'next/navigation';
import { dataManager, Gym, User } from '@/app/components/DataManager';
import { usePermissions } from '../../hooks/usePermissions';

interface UserDialogData {
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'head_setter' | 'setter';
  primary_gyms: string[];
}

export default function UserManagementPage() {
  const { isAdmin } = usePermissions();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogData, setDialogData] = useState<UserDialogData>({
    email: '',
    name: '',
    password: '',
    role: 'setter',
    primary_gyms: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedUsers, fetchedGyms] = await Promise.all([
          dataManager.fetchUsers(),
          dataManager.fetchGyms(),
        ]);
        setUsers(fetchedUsers);
        setGyms(fetchedGyms);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await dataManager.updateUser({
          id: editingUser.id,
          name: dialogData.name,
          role: dialogData.role,
          primary_gyms: dialogData.primary_gyms,
        });
      } else {
        await dataManager.createUser(dialogData);
      }
      
      // Refresh users list
      const updatedUsers = await dataManager.fetchUsers();
      setUsers(updatedUsers);
      setDialogOpen(false);
      resetDialog();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogData({
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'head_setter' | 'setter',
      primary_gyms: user.primary_gyms || [],
    });
    setDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingUser(null);
    setDialogData({
      email: '',
      name: '',
      password: '',
      role: 'setter',
      primary_gyms: [],
    });
  };

  const getGymName = (gymId: string) => {
    const gym = gyms.find(g => g.id === gymId);
    return gym?.name || gymId;
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
          <CardTitle className="text-2xl text-slate-100">User Management</CardTitle>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                resetDialog();
                setDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create User
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-slate-700 border-slate-600 text-slate-200"
            >
              Back to Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-200">Name</TableHead>
                <TableHead className="text-slate-200">Email</TableHead>
                <TableHead className="text-slate-200">Role</TableHead>
                <TableHead className="text-slate-200">Primary Gyms</TableHead>
                <TableHead className="text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-slate-300">{user.name}</TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell className="text-slate-300">{user.role}</TableCell>
                  <TableCell className="text-slate-300">
                    {user.primary_gyms?.map(getGymName).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(user)}
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
              {editingUser ? 'Edit User' : 'Create User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Email</label>
              <Input
                type="email"
                value={dialogData.email}
                onChange={(e) => setDialogData({ ...dialogData, email: e.target.value })}
                disabled={!!editingUser}
                required={!editingUser}
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Name</label>
              <Input
                value={dialogData.name}
                onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <label className="text-sm text-slate-200">Password (Optional)</label>
                <Input
                  type="password"
                  value={dialogData.password}
                  onChange={(e) => setDialogData({ ...dialogData, password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Role</label>
              <Select
                value={dialogData.role}
                onValueChange={(value: 'admin' | 'head_setter' | 'setter') =>
                  setDialogData({ ...dialogData, role: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="head_setter">Head Setter</SelectItem>
                  <SelectItem value="setter">Setter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Primary Gyms</label>
              <Select
                value={dialogData.primary_gyms.join(',')}
                onValueChange={(value) =>
                  setDialogData({
                    ...dialogData,
                    primary_gyms: value ? value.split(',') : [],
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {gyms.map((gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}