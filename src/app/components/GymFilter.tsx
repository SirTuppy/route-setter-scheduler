import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, X } from 'lucide-react';

interface GymGroup {
  color: string;
  border: string;
  gyms: {
    [key: string]: {
      name: string;
      config: any;
    };
  };
}

interface GymFilterProps {
  gymGroups: Record<string, GymGroup>;
  hiddenGyms: Set<string>;
  onToggleGym: (gymId: string) => void;
}

const GymFilter: React.FC<GymFilterProps> = ({
  gymGroups,
  hiddenGyms,
  onToggleGym
}) => {
  const allGymIds = useMemo(() => {
    return Object.values(gymGroups)
      .flatMap(group => Object.keys(group.gyms));
  }, [gymGroups]);

  const isAllVisible = useMemo(() => {
    return allGymIds.every(gymId => !hiddenGyms.has(gymId));
  }, [allGymIds, hiddenGyms]);

  const handleToggleAll = useCallback(() => {
    if (isAllVisible) {
      allGymIds.forEach(gymId => onToggleGym(gymId)); // Hide all
    } else {
      allGymIds.forEach(gymId => {
        if(hiddenGyms.has(gymId)) onToggleGym(gymId); // Show all
      });
    }
  }, [isAllVisible, allGymIds, onToggleGym, hiddenGyms]);

  // Calculate which groups have all gyms visible
  const groupVisibility = useMemo(() => {
    return Object.entries(gymGroups).reduce((acc, [groupId, group]) => {
      const groupGymIds = Object.keys(group.gyms);
      acc[groupId] = groupGymIds.every(gymId => !hiddenGyms.has(gymId));
      return acc;
    }, {} as Record<string, boolean>);
  }, [gymGroups, hiddenGyms]);

  // Handle toggling all gyms in a group
  const handleToggleGroup = useCallback((groupId: string) => {
    const groupGymIds = Object.keys(gymGroups[groupId].gyms);
    const isGroupVisible = groupVisibility[groupId];
    
    groupGymIds.forEach(gymId => {
      if (isGroupVisible && !hiddenGyms.has(gymId)) {
        onToggleGym(gymId); // Hide all in group
      } else if (!isGroupVisible && hiddenGyms.has(gymId)) {
        onToggleGym(gymId); // Show all in group
      }
    });
  }, [gymGroups, groupVisibility, hiddenGyms, onToggleGym]);

  const visibleCount = useMemo(() => {
    return allGymIds.filter(gymId => !hiddenGyms.has(gymId)).length;
  }, [allGymIds, hiddenGyms]);

  return (
    <DropdownMenu closeOnSelect={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="border-emerald-700 hover:bg-emerald-900 text-slate-200 bg-emerald-800 gap-2"
        >
          <Building2 size={16} />
          Gyms ({visibleCount}/{allGymIds.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-slate-800 border-slate-700">
        <DropdownMenuItem 
          className="flex justify-between items-center text-slate-200 focus:bg-slate-700 focus:text-slate-200 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleAll();
          }}
        >
          <span>{isAllVisible ? 'Hide All' : 'Show All'}</span>
          {isAllVisible ? 
            <X className="h-4 w-4 text-red-400" /> : 
            <Check className="h-4 w-4 text-green-400" />
          }
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        
        {Object.entries(gymGroups).map(([groupId, group]) => (
          <React.Fragment key={groupId}>
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className={`flex justify-between items-center text-slate-200 focus:bg-slate-700 focus:text-slate-200 cursor-pointer ${group.color}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleGroup(groupId);
                }}
              >
                <span className="font-medium">
                  {(() => {
                    switch(groupId) {
                      case 'northernGyms': return 'Design/Denton';
                      case 'eastGyms': return 'Plano/Hill';
                      case 'westGyms': return 'Grapevine/Fort Worth';
                      case 'trainingCenters': return 'TCs';
                      case 'vacationGym': return 'Vacation';
                      default: return groupId;
                    }
                  })()}
                </span>
                {groupVisibility[groupId] ? 
                  <X className="h-4 w-4 text-red-400" /> : 
                  <Check className="h-4 w-4 text-green-400" />
                }
              </DropdownMenuItem>
              <div className="ml-4">
                {Object.entries(group.gyms).map(([gymId, gym]) => (
                  <DropdownMenuCheckboxItem
                    key={gymId}
                    checked={!hiddenGyms.has(gymId)}
                    onCheckedChange={(checked) => {
                      onToggleGym(gymId);
                    }}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    className="text-slate-200 focus:bg-slate-700 focus:text-slate-200"
                  >
                    {gymId === 'vacation' ? 'Vacation' : gym.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-700" />
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GymFilter;