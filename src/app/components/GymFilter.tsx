import React, { useMemo, useCallback } from 'react';

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


  return (
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-4 flex-wrap">
            <label
              className={`flex items-center gap-2 p-2 rounded-md border border-slate-700 text-slate-200`}
            >
                <input
                  type="checkbox"
                  checked={isAllVisible}
                  onChange={handleToggleAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-700"
                />
              <span>Show/Hide All</span>
            </label>
          {Object.entries(gymGroups).flatMap(([groupId, group]) =>
            Object.entries(group.gyms).map(([gymId, gym]) => (
              <label
                key={gymId}
                className={`flex items-center gap-2 p-2 rounded-md border border-slate-700 ${group.color}`}
              >
                <input
                  type="checkbox"
                  checked={!hiddenGyms.has(gymId)}
                  onChange={() => onToggleGym(gymId)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-700"
                />
                <span className="text-slate-200">{gym.name}</span>
              </label>
            ))
          )}
        </div>
      </div>
  );
};

export default GymFilter;