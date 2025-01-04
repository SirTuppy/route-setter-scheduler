"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { dataManager, Wall } from '../components/DataManager';
import { usePermissions } from '../hooks/usePermissions';
import { useRouter } from 'next/navigation';

const GYM_GROUPS = [
  { name: 'North Gyms', gyms: ['design', 'denton'] },
  { name: 'East Gyms', gyms: ['plano', 'hill'] },
  { name: 'West Gyms', gyms: ['grapevine', 'fortWorth'] },
  { name: 'Training Centers', gyms: ['carrolltonTC', 'planoTC'] }
];

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

export default function WallEditor() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isHeadSetter } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const loadWalls = async () => {
      try {
        const allWalls = await dataManager.fetchWalls();
        setWalls(allWalls);
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
    return walls.filter(wall => 
      wall.name.toLowerCase().includes(query) ||
      (GYM_NAMES[wall.gym_id]?.toLowerCase() || '').includes(query) ||
      wall.wall_type.toLowerCase().includes(query)
    );
  }, [walls, searchQuery]);

  const handleSave = async (wall: Wall) => {
    try {
      console.log('Saving wall:', wall);
      const { data, error } = await dataManager.updateWall(wall);
      
      if (error) {
        console.error('Error saving wall:', error);
        throw error;
      }

      console.log('Wall saved successfully:', data);
      setWalls(walls.map(w => w.id === wall.id ? wall : w));
      setEditingWall(null);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setError('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const WallTable = ({ groupWalls }: { groupWalls: Wall[] }) => (
    <table className="w-full text-slate-200">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="text-left p-2">Wall</th>
          <th className="text-left p-2">Type</th>
          <th className="text-left p-2">Difficulty</th>
          <th className="text-left p-2">Climbs/Setter</th>
          <th className="text-left p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {groupWalls.map(wall => (
          <tr key={wall.id} className="border-b border-slate-700">
            {editingWall?.id === wall.id ? (
              <>
                <td className="p-2">{wall.name}</td>
                <td className="p-2">
                  <select
                    value={editingWall.wall_type}
                    onChange={e => setEditingWall({...editingWall, wall_type: e.target.value as 'boulder' | 'rope'})}
                    className="bg-slate-700 border border-slate-600 rounded p-1 text-slate-200"
                  >
                    <option value="boulder">Boulder</option>
                    <option value="rope">Rope</option>
                  </select>
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={editingWall.difficulty}
                    onChange={e => setEditingWall({...editingWall, difficulty: Number(e.target.value)})}
                    className="w-20 bg-slate-700 border-slate-600 text-slate-200"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={editingWall.climbs_per_setter}
                    onChange={e => setEditingWall({...editingWall, climbs_per_setter: Number(e.target.value)})}
                    className="w-20 bg-slate-700 border-slate-600 text-slate-200"
                  />
                </td>
                <td className="p-2 space-x-2">
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
                <td className="p-2">{wall.name}</td>
                <td className="p-2">{wall.wall_type}</td>
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
  );

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
          <div className="space-y-8">
            {GYM_GROUPS.map((group) => {
              const groupWalls = filteredWalls.filter(wall => 
                group.gyms.includes(wall.gym_id)
              );
              
              if (groupWalls.length === 0) return null;

              return (
                <div key={group.name} className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-600 pb-2">
                    {group.name}
                  </h2>
                  {group.gyms.map(gymId => {
                    const gymWalls = groupWalls.filter(wall => wall.gym_id === gymId);
                    if (gymWalls.length === 0) return null;
                    
                    return (
                      <div key={gymId} className="space-y-2">
                        <h3 className="text-lg font-medium text-slate-300">{GYM_NAMES[gymId]}</h3>
                        <WallTable groupWalls={gymWalls} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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