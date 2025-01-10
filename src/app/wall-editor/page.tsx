"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { dataManager, Wall } from '../components/DataManager';
import { usePermissions } from '../hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

export default function WallEditor() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGyms, setExpandedGyms] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, Record<string, boolean>>>({});
  const { isHeadSetter } = usePermissions();
  const router = useRouter();

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    loadWalls();
  }, []);

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

  const handleSave = async (wall: Wall) => {
    try {
      const { data, error } = await dataManager.updateWall(wall);
      
      if (error) throw error;

      setWalls(walls.map(w => w.id === wall.id ? wall : w));
      setEditingWall(null);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setError('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const WallTable = ({ walls, gymId }: { walls: Wall[], gymId: string }) => (
    <div className={`rounded-lg border ${GYM_GROUPS[gymId].border} ${GYM_GROUPS[gymId].color} p-4`}>
      <table className="w-full text-slate-200">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-2 w-24">Wall</th>
            <th className="text-left p-2 w-24">Type</th>
            <th className="text-left p-2 w-24">Angle</th>
            <th className="text-left p-2 w-24">Difficulty</th>
            <th className="text-left p-2 w-28">Climbs/Setter</th>
            <th className="text-left p-2 w-24">Actions</th>
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
                      value={editingWall.difficulty}
                      onChange={e => setEditingWall({...editingWall, difficulty: Number(e.target.value)})}
                      className="w-full bg-slate-700 border-slate-600 text-slate-200"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
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
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2 truncate overflow-hidden whitespace-nowrap max-w-[150px]">{wall.name}</td>
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

  const GymContent = ({ gymId, gymWalls }: { gymId: string, gymWalls: { boulder: Wall[], rope: Wall[] } }) => {
    const hasRopeWalls = gymWalls.rope.length > 0;
    const hasBoulderWalls = gymWalls.boulder.length > 0;


    const showCollapsibles = hasRopeWalls || (['denton', 'hill', 'fortWorth', 'carrolltonTC', 'planoTC'].includes(gymId) && hasBoulderWalls);

    if(showCollapsibles){
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
                  <WallTable walls={sortWallsByName(gymWalls[type])} gymId={gymId} />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </>
      );
    }

     return (
          <div className="ml-6">
            <WallTable walls={sortWallsByName(gymWalls.boulder)} gymId={gymId} />
          </div>
        );
  };

  const GymGrid = () => {
    const gymPairs = Object.entries(GYM_NAMES).reduce<[string, string][]>((pairs, [gymId], index) => {
      if (index % 2 === 0) {
        pairs.push([gymId, Object.keys(GYM_NAMES)[index + 1]]);
      }
      return pairs;
    }, []);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gymPairs.map(([gym1Id, gym2Id], index) => (
          <div key={index} className="flex flex-col lg:flex-row gap-6 pt-6">
            {gym1Id && filteredWalls[gym1Id] && (
              <div className="flex-1">
                <Collapsible
                  open={expandedGyms[gym1Id]}
                  onOpenChange={(isOpen) => setExpandedGyms({...expandedGyms, [gym1Id]: isOpen})}
                  className="space-y-2"
                >
                  <CollapsibleTrigger className="flex items-center w-full text-lg font-medium text-slate-200 hover:text-slate-100">
                    {expandedGyms[gym1Id] ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                    {GYM_NAMES[gym1Id]}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-2">
                    <GymContent gymId={gym1Id} gymWalls={filteredWalls[gym1Id]} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            
            {gym2Id && filteredWalls[gym2Id] && (
              <div className="flex-1">
                <Collapsible
                  open={expandedGyms[gym2Id]}
                  onOpenChange={(isOpen) => setExpandedGyms({...expandedGyms, [gym2Id]: isOpen})}
                  className="space-y-2"
                >
                  <CollapsibleTrigger className="flex items-center w-full text-lg font-medium text-slate-200 hover:text-slate-100">
                    {expandedGyms[gym2Id] ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                    {GYM_NAMES[gym2Id]}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-2">
                    <GymContent gymId={gym2Id} gymWalls={filteredWalls[gym2Id]} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

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

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-slate-100">Wall Editor</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search walls, gyms, or types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-slate-700 border-slate-600 text-slate-200 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              className="bg-slate-700 text-slate-200"
              onClick={() => router.push('/')}
            >
              Back to Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <GymGrid />
          {error && (
            <div className="mt-4 p-2 bg-red-600/20 border border-red-600 rounded text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}