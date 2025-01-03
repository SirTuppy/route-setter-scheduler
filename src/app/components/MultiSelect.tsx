import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SchedulerError, ErrorCodes } from '../errors/types';

interface MultiSelectProps<T> {
  items: T[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  getDisplayValue: (item: T) => string;
  getId: (item: T) => string;
  placeholder: string;
  disabled?: Record<string, boolean>;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  buttonClassName?: string;
  groupBy?: (item: T) => string;
}

const MultiSelect = <T extends any>({
  items,
  selectedIds,
  onChange,
  getDisplayValue,
  getId,
  placeholder,
  disabled,
  variant = 'outline',
  size = 'sm',
  className,
  buttonClassName,
  groupBy
}: MultiSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const groupedItems = useMemo(() => {
    if (!groupBy) return { default: items };
    
    return items.reduce((acc, item) => {
      const group = groupBy(item);
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }, [items, groupBy]);

  const groups = useMemo(() => {
    // Get all groups
    const allGroups = Object.keys(groupedItems);
    
    // Sort so that "Crew" groups come before "All Setters"
    return allGroups.sort((a, b) => {
        if (a.includes('Crew')) return -1;
        if (b.includes('Crew')) return 1;
        return 0;
    });
}, [groupedItems]);

  // We should change it to prioritize the gym's crew group if it exists
const [activeGroup, setActiveGroup] = useState(() => {
    // Find the group that contains the gym name
    const gymGroup = groups.find(g => g.includes('Crew'));
    return gymGroup || groups[0] || '';
});

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(getId(item))),
    [items, selectedIds, getId]
  );

  useEffect(() => {
    if (!activeGroup && groups.length > 0) {
      setActiveGroup(groups[0]);
    }
  }, [groups, activeGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectionChange = (id: string, isSelected: boolean) => {
    const newIds = isSelected
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <div
        className="border border-slate-700 p-2 min-h-[2.5rem] cursor-pointer bg-slate-800 rounded-md text-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length ? selectedItems.map(getDisplayValue).join(', ') : placeholder}
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden">
          {groups.length > 1 && (
            <div className="p-2 border-b bg-slate-700">
              {groups.map(group => (
                <button
                  key={group}
                  className={cn(
                    "px-3 py-1 text-sm rounded mr-2",
                    activeGroup === group
                      ? "bg-blue-500 text-white"
                      : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGroup(group);
                  }}
                >
                  {group}
                </button>
              ))}
            </div>
          )}
          <div className="max-h-80 overflow-auto p-1">
            <div className="grid grid-cols-2 gap-1">
              {groupedItems[activeGroup]?.map(item => {
                const id = getId(item);
                const displayValue = getDisplayValue(item);
                const isSelected = selectedIds.includes(id);

                return (
                  <Button
                    key={id}
                    variant={isSelected ? "secondary" : variant}
                    size={size}
                    className={cn(
                      "text-left text-sm h-8 bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-700",
                      disabled?.[id] ? "opacity-50 pointer-events-none" : "",
                      buttonClassName
                    )}
                    onClick={() => {
                      if (disabled?.[id]) return;
                      handleSelectionChange(id, isSelected);
                    }}
                  >
                    {displayValue}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;