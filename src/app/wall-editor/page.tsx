"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { dataManager, Wall, wallTo } from '../components/DataManager';
import { usePermissions } from '../hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

const GYM_NAMES: Record<string, string> = {
  design: 'Design District',
  denton: 'Denton',
  plano: 'Plano',
  hill: 'The Hill',
  grapevine: 'Grapevine',
  fortWorth: 'Fort Worth',
  carrolltonTC: 'Carrollton TC',
  planoTC: 'Plano TC'
};


const GYM_GROUPS = {
  design: { color: 'bg-blue-900/20', border: 'border-blue-600' },
  denton: { color: 'bg-blue-900/20', border: 'border-blue-600' },
  plano: { color: 'bg-green-900/20', border: 'border-green-600' },
  hill: { color: 'bg-green-900/20', border: 'border-green-600' },
  grapevine: { color: 'bg-purple-900/20', border: 'border-purple-600' },
  fortWorth: { color: 'bg-purple-900/20', border: 'border-purple-600' },
  carrolltonTC: { color: 'bg-orange-900/20', border: 'border-orange-600' },
  planoTC: { color: 'bg-orange-900/20', border: 'border-orange-600' }
} as const;

interface AddWallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWallAdded: () => void;
}

const generateWallId = (gymId: string, wallName: string) => {
  // Remove spaces and special characters, convert to lowercase
  const cleanName = wallName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${gymId}-${cleanName}`;
};

const AddWallDialog: React.FC<AddWallDialogProps> = ({ open, onOpenChange, onWallAdded }) => {
  const [selectedGym, setSelectedGym] = useState('');
  const [wallName, setWallName] = useState('');
  const [wallType, setWallType] = useState<'boulder' | 'rope'>('boulder');
  const [angle, setAngle] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [climbsPerSetter, setClimbsPerSetter] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setSelectedGym('');
    setWallName('');
    setWallType('boulder');
    setAngle('');
    setDifficulty(3);
    setClimbsPerSetter(4);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate inputs
      if (!selectedGym || !wallName || !wallType) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Additional validation
      if (difficulty < 1 || difficulty > 5) {
        toast({
          title: "Validation Error",
          description: "Difficulty must be between 1 and 5",
          variant: "destructive"
        });
        return;
      }

      if (climbsPerSetter < 1 || climbsPerSetter > 5) {
        toast({
          title: "Validation Error",
          description: "Climbs per setter must be between 1 and 5",
          variant: "destructive"
        });
        return;
      }

      // Create the wall in Supabase
      const newWall = {
        id: generateWallId(selectedGym, wallName),
        name: wallName,
        gym_id: selectedGym,
        difficulty,
        climbs_per_setter: climbsPerSetter,
        wall_type: wallType,
        angle: angle || null,
        active: true
      };

      const { error } = await dataManager.createWall(newWall);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Wall added successfully",
      });

      onWallAdded();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding wall:', error);
      toast({
        title: "Error",
        description: "Failed to add wall. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200">Add New Wall</DialogTitle>
          <DialogDescription className="text-slate-400">
            Fill in the wall details below
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Gym *</label>
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-slate-200"
              required
            >
              <option value="">Select a gym</option>
              {Object.entries(GYM_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Wall Name *</label>
            <Input
              value={wallName}
              onChange={(e) => setWallName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-200"
              placeholder="Enter wall name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Type *</label>
            <select
              value={wallType}
              onChange={(e) => setWallType(e.target.value as 'boulder' | 'rope')}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-slate-200"
              required
            >
              <option value="boulder">Boulder</option>
              <option value="rope">Rope</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Angle</label>
            <select
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-slate-200"
            >
              <option value="">Select angle</option>
              <option value="Slab">Slab</option>
              <option value="Vert">Vert</option>
              <option value="Overhang">Overhang</option>
              <option value="Steep">Steep</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Difficulty (1-5) *</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="bg-slate-700 border-slate-600 text-slate-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Climbs per Setter (1-5) *</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={climbsPerSetter}
              onChange={(e) => setClimbsPerSetter(Number(e.target.value))}
              className="bg-slate-700 border-slate-600 text-slate-200"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="border-slate-700 hover:bg-slate-700 text-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Adding...' : 'Add Wall'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WallTable = ({ walls, gymId, onWallDeleted }: { walls: Wall[], gymId: string, onWallDeleted: () => void }) => {
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const { toast } = useToast();
  
  const [wallToDelete, setWallToDelete] = useState<Wall | null>(null);

  interface WallTableProps {
    walls: Wall[];
    gymId: string;
    onWallDeleted: () => void;
  }

  const handleSave = async (wall: Wall) => {
    try {
      const { error } = await dataManager.updateWall(wall);
      if (error) throw error;
      setEditingWall(null);
      toast({
        title: "Success",
        description: "Wall updated successfully",
      });
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        title: "Error",
        description: "Failed to update wall. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`rounded-lg border ${GYM_GROUPS[gymId].border} ${GYM_GROUPS[gymId].color} p-4 overflow-x-auto`}>
      <table className="w-full text-slate-200 min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-2">Wall</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Angle</th>
            <th className="text-left p-2">Difficulty</th>
            <th className="text-left p-2">Climbs/Setter</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {walls.map(wall => (
            <tr key={wall.id} className="border-b border-slate-700">
              {editingWall?.id === wall.id ? (
                <>
                  <td className="p-2">{wall.name}</td>
                  <td className="p-2">
                    <select
                      value={editingWall.wall_type}
                      onChange={e => setEditingWall({...editingWall, wall_type: e.target.value as 'boulder' | 'rope'})}
                      className="bg-slate-700 border border-slate-600 rounded p-1 text-slate-200 w-full"
                    >
                      <option value="boulder">Boulder</option>
                      <option value="rope">Rope</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={editingWall.angle || ''}
                      onChange={e => setEditingWall({...editingWall, angle: e.target.value || null})}
                      className="bg-slate-700 border border-slate-600 rounded p-1 text-slate-200 w-full"
                    >
                      <option value="">Select</option>
                      <option value="Slab">Slab</option>
                      <option value="Vert">Vert</option>
                      <option value="Overhang">Overhang</option>
                      <option value="Steep">Steep</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={editingWall.difficulty}
                      onChange={e => setEditingWall({...editingWall, difficulty: Number(e.target.value)})}
                      className="w-full bg-slate-700 border-slate-600 text-slate-200"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={editingWall.climbs_per_setter}
                      onChange={e => setEditingWall({...editingWall, climbs_per_setter: Number(e.target.value)})}
                      className="w-full bg-slate-700 border-slate-600 text-slate-200"
                    />
                  </td>
                  <td className="p-2 space-x-1">
  <Button
    size="sm"
    onClick={() => handleSave(editingWall)}
    className="bg-green-600 hover:bg-green-700 text-white"
  >
    Save
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={() => setEditingWall(null)}
    className="border-slate-600 text-slate-200"
  >
    Cancel
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={() => setWallToDelete(wall)}
    className="border-red-600 text-red-400 hover:bg-red-900/50"
  >
    Delete
  </Button>
</td>
<Dialog open={!!wallToDelete} onOpenChange={(open) => !open && setWallToDelete(null)}>
  <DialogContent className="bg-slate-800 border-slate-700">
    <DialogHeader>
      <DialogTitle className="text-slate-200">⚠️ Delete Wall</DialogTitle>
      <DialogDescription className="text-slate-400">
        Are you SURE you want to delete {wallToDelete?.name}? This action CANNOT be undone.
      </DialogDescription>
    </DialogHeader>
    <div className="pt-4 text-red-400 font-medium">
      This will permanently remove the wall from the database.
    </div>
    <DialogFooter className="gap-2">
      <Button
        variant="outline"
        onClick={() => setWallToDelete(null)}
        className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
      >
        Cancel
      </Button>
      <Button
        onClick={async () => {
          if (!wallToDelete) return;
          try {
            const { error } = await dataManager.deleteWall(wallToDelete.id);
            if (error) throw error;
            
            toast({
              title: "Success",
              description: "Wall deleted successfully",
            });
            
            // Refresh the wall list
            onWallDeleted();
            setWallToDelete(null);
            setEditingWall(null);
          } catch (error) {
            console.error('Failed to delete wall:', error);
            toast({
              title: "Error",
              description: "Failed to delete wall. Please try again.",
              variant: "destructive"
            });
          }
        }}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Delete Wall
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
                </>
              ) : (
                <>
                  <td className="p-2">{wall.name}</td>
                  <td className="p-2">{wall.wall_type}</td>
                  <td className="p-2">{wall.angle || '-'}</td>
                  <td className="p-2">{wall.difficulty}</td>
                  <td className="p-2">{wall.climbs_per_setter}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingWall(wall)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Edit
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function WallEditor() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGyms, setExpandedGyms] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, Record<string, boolean>>>({});
  const [showAddWallDialog, setShowAddWallDialog] = useState(false);
  const { isHeadSetter } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();

  const loadWalls = async () => {
    try {
      const allWalls = await dataManager.fetchWalls();
      setWalls(allWalls);
      const initialGymState = Object.keys(GYM_NAMES).reduce((acc, gym) => ({
        ...acc, 
        [gym]: true
      }), {});
      setExpandedGyms(initialGymState);

      const initialTypeState = Object.keys(GYM_NAMES).reduce((acc, gym) => ({
        ...acc,
        [gym]: { boulder: true, rope: true }
      }), {});
      setExpandedTypes(initialTypeState);
    } catch (error) {
      setError('Failed to load walls');
      toast({
        title: "Error",
        description: "Failed to load walls. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalls();
  }, []);

  const sortWallsByName = (walls: Wall[]) => {
    return [...walls].sort((a, b) => {
      const aMatch = a.name.match(/(\D+)(\d+)?/);
      const bMatch = b.name.match(/(\D+)(\d+)?/);

      if (aMatch && bMatch) {
        const aPrefix = aMatch[1] || '';
        const bPrefix = bMatch[1] || '';
        const aNum = parseInt(aMatch[2] || '0', 10);
        const bNum = parseInt(bMatch[2] || '0', 10);

        if (aPrefix < bPrefix) return -1;
        if (aPrefix > bPrefix) return 1;

        return aNum - bNum;
      }
      
      return a.name.localeCompare(b.name);
    });
  };

  const filteredWalls = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filtered = walls.filter(wall => 
      wall.name.toLowerCase().includes(query) ||
      (GYM_NAMES[wall.gym_id]?.toLowerCase() || '').includes(query) ||
      wall.wall_type.toLowerCase().includes(query)
    );

    return filtered.reduce((acc, wall) => {
      if (!acc[wall.gym_id]) {
        acc[wall.gym_id] = {
          boulder: [],
          rope: []
        };
      }
      acc[wall.gym_id][wall.wall_type].push(wall);
      return acc;
    }, {} as Record<string, { boulder: Wall[], rope: Wall[] }>);
  }, [walls, searchQuery]);

  if (!isHeadSetter) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-200 text-center">Access denied. Head setter permissions required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const GymContent = ({ gymId, gymWalls }: { gymId: string, gymWalls: { boulder: Wall[], rope: Wall[] } }) => {
    const hasRopeWalls = gymWalls.rope.length > 0;

    if (hasRopeWalls) {
      return (
        <>
          {['boulder', 'rope'].map(type => {
            if (!gymWalls[type]?.length) return null;
            return (
              <Collapsible
                key={`${gymId}-${type}`}
                open={expandedTypes[gymId]?.[type]}
                onOpenChange={(isOpen) => 
                  setExpandedTypes({
                    ...expandedTypes,
                    [gymId]: {...expandedTypes[gymId], [type]: isOpen}
                  })
                }
                className="ml-6 space-y-2"
              >
                <CollapsibleTrigger className="flex items-center text-md font-medium text-slate-300 hover:text-slate-200">
                  {expandedTypes[gymId]?.[type] ? 
                    <ChevronDown className="h-4 w-4 mr-2" /> : 
                    <ChevronRight className="h-4 w-4 mr-2" />
                  }
                  {type.charAt(0).toUpperCase() + type.slice(1)} Walls
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <WallTable walls={sortWallsByName(gymWalls[type])} gymId={gymId} onWallDeleted={loadWalls} />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </>
      );
    }

    return (
      <div className="ml-6">
        <WallTable walls={sortWallsByName(gymWalls.boulder)} gymId={gymId} onWallDeleted={loadWalls} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <CardTitle className="text-2xl text-slate-100">Wall Editor</CardTitle>
            <Button
              onClick={() => setShowAddWallDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Wall
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search walls, gyms, or types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-slate-700 border-slate-600 text-slate-200 w-full"
              />
            </div>
            <Button 
              variant="outline" 
              className="bg-slate-700 text-slate-200 w-full sm:w-auto"
              onClick={() => router.push('/')}
            >
              Back to Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(GYM_NAMES).map(([gymId, gymName]) => (
              filteredWalls[gymId] && (
                <div key={gymId}>
                  <Collapsible
                    open={expandedGyms[gymId]}
                    onOpenChange={(isOpen) => setExpandedGyms({...expandedGyms, [gymId]: isOpen})}
                    className="space-y-2"
                  >
                    <CollapsibleTrigger className="flex items-center w-full text-lg font-medium text-slate-200 hover:text-slate-100">
                      {expandedGyms[gymId] ? 
                        <ChevronDown className="h-5 w-5 mr-2" /> : 
                        <ChevronRight className="h-5 w-5 mr-2" />
                      }
                      {gymName}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <GymContent 
                        gymId={gymId} 
                        gymWalls={filteredWalls[gymId]} 
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            ))}
          </div>
          {error && (
            <div className="mt-4 p-2 bg-red-600/20 border border-red-600 rounded text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <AddWallDialog
        open={showAddWallDialog}
        onOpenChange={setShowAddWallDialog}
        onWallAdded={loadWalls}
      />
    </div>
  );
}