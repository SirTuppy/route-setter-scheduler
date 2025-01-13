import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MultiSelectProps<T> {
    items: T[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    getDisplayValue: (item: T) => string;
    getId: (item: T) => string;
    isHeadSetter?: (item: T) => boolean;
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
    isHeadSetter,
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

    const isFullyDisabled = typeof disabled === 'boolean' && disabled;

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

    const sortedSelectedItems = useMemo(() => {
        if(groups.length > 1 && !activeGroup.includes('Crew')){
            return [...selectedItems].sort((a,b) => getDisplayValue(a).localeCompare(getDisplayValue(b)))
        }
        const headSetters = selectedItems.filter(item => isHeadSetter?.(item));
        const normalSetters = selectedItems.filter(item => !isHeadSetter?.(item)).sort((a,b) => getDisplayValue(a).localeCompare(getDisplayValue(b)))
        return [...headSetters, ...normalSetters];
    }, [selectedItems, getDisplayValue, isHeadSetter, activeGroup, groups]);

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

    const sortItems = (itemsToSort: T[]) => {
        if (activeGroup && !activeGroup.includes('Crew')) {
            return [...itemsToSort].sort((a, b) => {
                const aValue = getDisplayValue(a);
                const bValue = getDisplayValue(b);

                const aMatch = aValue.match(/(\D+)(\d+)?/);
                const bMatch = bValue.match(/(\D+)(\d+)?/);

                if (aMatch && bMatch) {
                    const aPrefix = aMatch[1] || '';
                    const bPrefix = bMatch[1] || '';
                    const aNum = parseInt(aMatch[2] || '0', 10);
                    const bNum = parseInt(bMatch[2] || '0', 10);


                    if (aPrefix < bPrefix) return -1;
                    if (aPrefix > bPrefix) return 1;

                    return aNum - bNum;
                }

                return aValue.localeCompare(bValue)
            });
        }
        return [...itemsToSort].sort((a, b) => {
            const aIsHeadSetter = isHeadSetter?.(a) ?? false;
            const bIsHeadSetter = isHeadSetter?.(b) ?? false;

            // Prioritize head setters
            if (aIsHeadSetter && !bIsHeadSetter) {
                return -1;
            }
            if (!aIsHeadSetter && bIsHeadSetter) {
                return 1;
            }

            const aValue = getDisplayValue(a);
            const bValue = getDisplayValue(b);

            const aMatch = aValue.match(/(\D+)(\d+)?/);
            const bMatch = bValue.match(/(\D+)(\d+)?/);

            if (aMatch && bMatch) {
                const aPrefix = aMatch[1] || '';
                const bPrefix = bMatch[1] || '';
                const aNum = parseInt(aMatch[2] || '0', 10);
                const bNum = parseInt(bMatch[2] || '0', 10);


                if (aPrefix < bPrefix) return -1;
                if (aPrefix > bPrefix) return 1;

                return aNum - bNum;
            }

            return aValue.localeCompare(bValue)
        });
    };

    const textAlignment = useRef({} as Record<string, boolean>).current

    const buttonRefs = useRef({} as Record<string, React.RefObject<HTMLButtonElement>>).current

    const isTextOverflowing = (id: string) => {
        if (!buttonRefs[id] || !buttonRefs[id].current) {
            return false;
        }
    
        const buttonElement = buttonRefs[id].current;
    
        return buttonElement.scrollWidth > buttonElement.clientWidth;
      };



    return (
        <div className={cn("relative", className)} ref={wrapperRef}>
            <div
                className={`border border-slate-700 p-2 min-h-[2.5rem] ${isFullyDisabled ? 'cursor-not-allowed bg-slate-700' : 'cursor-pointer bg-slate-800'} rounded-md text-slate-200`}
                onClick={() => !isFullyDisabled && setIsOpen(!isOpen)}
            >
                {sortedSelectedItems.length ? sortedSelectedItems.map(getDisplayValue).join(', ') : placeholder}
            </div>
            {!isFullyDisabled && isOpen && (
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
                            {sortItems(groupedItems[activeGroup] || []).map(item => {
                                const id = getId(item);
                                const displayValue = getDisplayValue(item);
                                const isSelected = selectedIds.includes(id);
                                const isItemDisabled = typeof disabled === 'object' && disabled?.[id];
                                const buttonRef = buttonRefs[id] = buttonRefs[id] || React.createRef<HTMLButtonElement>()

                                return (
                                    <Button
                                        key={id}
                                        variant={isSelected ? "secondary" : variant}
                                        size={size}
                                        className={cn(
                                          "text-sm h-8 bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-700",
                                          isItemDisabled ? "opacity-60 pointer-events-none" : "",
                                          isSelected ? "bg-cyan-400/50" : "", // Add overlay for selected items,
                                          "overflow-hidden",
                                          "whitespace-nowrap",
                                          "inline-block",
                                            `flex ${isTextOverflowing(id) ? 'justify-start' : 'justify-center'}`,
                                           buttonClassName,
                                            textAlignment[id] ? 'text-left' : 'text-center'
                                      )}
                                        ref={buttonRef}
                                        onLayout={() => {
                                            textAlignment[id] = isTextOverflowing(id)
                                        }}
                                        onClick={() => {
                                            if (isItemDisabled) return;
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