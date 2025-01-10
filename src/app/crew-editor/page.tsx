"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePermissions } from '../hooks/usePermissions';
import { dataManager } from '../components/DataManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Crew {
  id: string;
  name: string;
  head_setter_id: string | null;
  gyms: string[];
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  head_setter?: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Update the HEAD_SETTER_PAIRS to mark which ones are assistants
const HEAD_SETTER_CONFIG = {
    'Design/Denton': [
      { name: 'Evan', isAssistant: false },
      { name: 'Luke S.', isAssistant: true }
    ],
    'Plano/Hill': [
      { name: 'Canon', isAssistant: false },
      { name: 'Jack S.', isAssistant: true }
    ],
    'Grapevine/Fort Worth': [
      { name: 'Austin', isAssistant: false },
      { name: 'Nicole', isAssistant: true }
    ],
    'Training Centers': [
      { name: 'Henry', isAssistant: false }
    ]
  };

const CrewEditor = () => {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [selectedSetters, setSelectedSetters] = useState<Record<string, string>>({});
    const [selectedHeadSetters, setSelectedHeadSetters] = useState<Record<string, string | null>>({});
  const { isHeadSetter } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    loadCrewData();
  }, []);

  const loadCrewData = async () => {
    try {
      const crewsData = await dataManager.fetchCrews();
      const usersData = await dataManager.fetchUsers();
      setCrews(crewsData);
      setUsers(usersData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading crew data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load crew data');
    } finally {
      setLoading(false);
    }
  };

    const handleHeadSetterChange = async (crewId: string, headSetterId: string | null) => {
        try {
            await dataManager.updateCrewHeadSetter(crewId, headSetterId);
            setSelectedHeadSetters(prev => ({ ...prev, [crewId]: headSetterId }));
            loadCrewData();
        } catch (error) {
            console.error('Error updating head setter', error);
        }
    };

    const getHeadSettersForCrew = (crewName: string, allUsers: User[]) => {
        const configList = HEAD_SETTER_CONFIG[crewName] || [];
        return allUsers.filter(user =>
            configList.some(config => config.name === user.name) &&
            user.role === 'head_setter'
        ).map(user => ({
            ...user,
            isAssistant: configList.find(config => config.name === user.name)?.isAssistant || false
        }));
    };

    const getRegularSetters = (allUsers: User[], currentCrew: Crew) => {
      // Helper to check if user is an M2 for this crew
      const isM2ForCrew = (userName: string) => 
        HEAD_SETTER_CONFIG[currentCrew.name]?.find(hs => 
          hs.name === userName && hs.isAssistant
        );
    
      return allUsers.filter(user => {
        // Include if user is:
        // 1. A regular setter OR
        // 2. An M2 for this crew
        return user.role !== 'head_setter' || isM2ForCrew(user.name);
      });
    };

  const handleAddCrewMember = async (crewId: string) => {
    const selectedSetterId = selectedSetters[crewId];
    if (!selectedSetterId) return;

    try {
      await dataManager.addCrewMember(crewId, selectedSetterId);
      
      // Clear the selection and reload data
      setSelectedSetters(prev => ({ ...prev, [crewId]: '' }));
      loadCrewData();
    } catch (error) {
      console.error('Error adding crew member:', error);
    }
  };

  const handleRemoveCrewMember = async (crewId: string, userId: string) => {
    try {
      await dataManager.removeCrewMember(crewId, userId);
      
      loadCrewData();
    } catch (error) {
      console.error('Error removing crew member:', error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="text-slate-200">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-slate-100">Crew Editor</CardTitle>
          <Button 
            variant="outline" 
            className="bg-slate-700 text-slate-200"
            onClick={() => router.push('/')}
          >
            Back to Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crews.map(crew => {
              const headSetters = getHeadSettersForCrew(crew.name, users);
              const regularSetters = getRegularSetters(users, crew);

              return (
                <Card key={crew.id} className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-200">
                      {crew.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-2">Head Setter</h3>
                            <div className="space-y-2">
                                <Select
                                    value={selectedHeadSetters[crew.id] || crew.head_setter_id || ''}
                                    onValueChange={async (value) => {
                                        await handleHeadSetterChange(crew.id, value);
                                    }}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                                        <SelectValue placeholder="Select a head setter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {headSetters.map(headSetter => (
                                            <SelectItem key={headSetter.id} value={headSetter.id}>
                                                {headSetter.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem key="no-head-setter" value={null}>
                                            No Head Setter
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Crew Members</h3>
                        <div className="space-y-2">
                        {crew.users && crew.users.length > 0 ? (
  crew.users
    .filter(user => {
      // Show user if they're:
      // 1. Not the lead head setter AND
      // 2. Either not a head setter OR they're the M2 for this crew
      const isLeadHeadSetter = headSetters.find(hs => 
        hs.id === user.id && !hs.isAssistant
      );
      const isM2ForThisCrew = HEAD_SETTER_CONFIG[crew.name]?.find(hs => 
        hs.name === user.name && hs.isAssistant
      );
      
      return !isLeadHeadSetter && (user.role !== 'head_setter' || isM2ForThisCrew);
    })
    .map(user => (
      <div 
        key={user.id}
        className="bg-slate-800 p-2 rounded-md flex justify-between items-center"
      >
        <span className="text-slate-200">{user.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveCrewMember(crew.id, user.id)}
          className="text-red-400 hover:text-red-300 hover:bg-slate-700 h-7"
        >
          Remove
        </Button>
      </div>
    ))
) : (
  <div className="text-slate-400 text-sm">No crew members assigned</div>
)}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Add Crew Member</h3>
                        <div className="flex gap-2">
                          <Select
                            value={selectedSetters[crew.id] || ''}
                            onValueChange={(value) => setSelectedSetters(prev => ({
                              ...prev,
                              [crew.id]: value
                            }))}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                              <SelectValue placeholder="Select a setter" />
                            </SelectTrigger>
                            <SelectContent>
                              {regularSetters.map(setter => (
                                <SelectItem key={setter.id} value={setter.id}>
                                  {setter.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            onClick={() => handleAddCrewMember(crew.id)}
                            disabled={!selectedSetters[crew.id]}
                            className="bg-green-700/30 hover:bg-green-700/50 text-green-300 border-green-700"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrewEditor;