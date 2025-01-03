import React from 'react';

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
  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex gap-4 flex-wrap">
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