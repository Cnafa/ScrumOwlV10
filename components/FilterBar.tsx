// components/FilterBar.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilterSet, Team, Sprint, User, WorkItemType } from '../types';
import { ALL_USERS, WORK_ITEM_TYPES } from '../constants';
import { useLocale } from '../context/LocaleContext';
import { BookmarkPlusIcon, FolderCogIcon, XMarkIcon, MagnifyingGlassIcon } from './icons';

// --- Start of US-51 SelectedAssigneesChips Component ---

// A hook to get the window size category for responsiveness
const useWindowSize = () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>('lg');
    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 640) setSize('sm');
            else if (window.innerWidth < 1024) setSize('md');
            else setSize('lg');
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

interface SelectedAssigneesChipsProps {
  selectedUsers: User[];
  onRemove: (userId: string) => void;
  onClearAll: () => void;
}

const SelectedAssigneesChips: React.FC<SelectedAssigneesChipsProps> = ({ selectedUsers, onRemove, onClearAll }) => {
    const { t } = useLocale();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [search, setSearch] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, () => setIsPopoverOpen(false));
    const screenSize = useWindowSize();

    const maxVisible = useMemo(() => {
        if (screenSize === 'sm') return 0;
        if (screenSize === 'md') return 1;
        return 2;
    }, [screenSize]);

    const visibleUsers = selectedUsers.slice(0, maxVisible);
    const overflowCount = selectedUsers.length - maxVisible;

    const filteredPopoverUsers = useMemo(() => {
        if (!search) return selectedUsers;
        return selectedUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    }, [search, selectedUsers]);

    if (selectedUsers.length === 0) return null;

    return (
        <div className="flex items-center gap-1.5" ref={popoverRef}>
            {/* Visible Chips */}
            {visibleUsers.map(user => (
                <div key={user.id} className="h-7 px-2 rounded-full border bg-white text-xs flex items-center gap-1 shadow-sm">
                    <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="max-w-[96px] truncate" title={user.name}>{user.name}</span>
                    <button onClick={() => onRemove(user.id)} className="p-0.5 rounded-full hover:bg-gray-100" aria-label={`Remove ${user.name}`}>
                        <XMarkIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
            {/* Avatar Stack for small screens */}
            {screenSize === 'sm' && selectedUsers.slice(0, 2).map((user, index) => (
                <img key={user.id} src={user.avatarUrl} alt={user.name} title={user.name} className={`w-7 h-7 rounded-full object-cover border-2 border-white ${index > 0 ? '-ml-2' : ''}`} />
            ))}

            {/* Counter Chip */}
            {overflowCount > 0 && (
                 <button 
                    onClick={() => setIsPopoverOpen(true)}
                    className="h-7 px-2 rounded-full bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer text-xs font-medium"
                    aria-label={`Open selected assignees (${overflowCount} more)`}
                    title={t('filters_assignees_more').replace('{count}', overflowCount.toString())}
                 >
                    +{overflowCount > 99 ? '99+' : overflowCount}
                </button>
            )}

            {/* Popover */}
            {isPopoverOpen && (
                <div className="absolute top-full mt-2 z-20 w-72 bg-white rounded-lg shadow-lg border">
                    <div className="p-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-semibold">{t('filters_assignees_selected')}</h3>
                        <button onClick={onClearAll} className="text-xs text-primary hover:underline">{t('actions_clearAll')}</button>
                    </div>
                    <div className="p-2 border-b">
                         <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="w-full px-2 py-1 border rounded-md text-xs"/>
                    </div>
                    <ul className="max-h-60 overflow-auto p-1">
                        {filteredPopoverUsers.map(user => (
                            <li key={user.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                    <span className="text-sm">{user.name}</span>
                                </div>
                                <button onClick={() => onRemove(user.id)} className="p-1 rounded-full hover:bg-gray-200" aria-label={`Remove ${user.name}`}>
                                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
// --- End of US-51 Component ---


const FilterChip: React.FC<{ onRemove: () => void; children: React.ReactNode }> = ({ onRemove, children }) => (
    <div className="flex items-center gap-1 bg-primarySoft text-primary font-medium ps-2 pe-1 py-0.5 rounded-full text-xs">
        {children}
        <button onClick={onRemove} className="p-0.5 rounded-full hover:bg-blue-200">
            <XMarkIcon className="w-3 h-3"/>
        </button>
    </div>
);

const MultiSelectDropdown: React.FC<{
  buttonContent: React.ReactNode;
  items: { id: string, name: string, content: React.ReactNode }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}> = ({ buttonContent, items, selectedIds, onSelectionChange, searchable = false, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));
  const { t } = useLocale();

  const filteredItems = useMemo(() => {
    if (!searchable || !search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(lowerSearch));
  }, [items, search, searchable]);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    onSelectionChange(Array.from(newSet));
  };

  return (
    <div className="relative" ref={dropdownRef}>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-36 flex items-center justify-between px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary text-start">
           <span className="text-xs truncate">{buttonContent}</span>
           <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        {isOpen && (
            <div className="absolute z-10 w-64 mt-1 bg-white border rounded-md shadow-lg text-start">
                {searchable && <div className="p-1 border-b"><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder || t('search')} className="w-full px-2 py-1 border rounded-md text-xs"/></div>}
                <ul className="max-h-60 overflow-auto p-1">
                    {filteredItems.map(item => (
                        <li key={item.id} className="px-2 py-1 text-xs text-slate-900 cursor-pointer hover:bg-gray-100 rounded-md flex items-center gap-2">
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleToggle(item.id)} />
                            {item.content}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
};

interface FilterBarProps {
  filterSet: FilterSet;
  onFilterChange: (filters: FilterSet) => void;
  onResetFilters: () => void;
  onOpenSaveViewModal: () => void;
  onOpenManageViewsModal: () => void;
  teams: Team[];
  groupBy: 'status' | 'epic';
  onGroupByChange: (groupBy: 'status' | 'epic') => void;
  activeSprint: Sprint | null | undefined;
  includeUnassignedEpicItems: boolean;
  onIncludeUnassignedEpicItemsChange: (checked: boolean) => void;
}

const FILTERABLE_TYPES = [
    WorkItemType.STORY,
    WorkItemType.TASK,
    WorkItemType.BUG_URGENT,
    WorkItemType.BUG_MINOR,
];


export const FilterBar: React.FC<FilterBarProps> = ({ 
    filterSet, onFilterChange, onResetFilters, onOpenSaveViewModal, onOpenManageViewsModal, teams, groupBy, onGroupByChange,
    activeSprint, includeUnassignedEpicItems, onIncludeUnassignedEpicItemsChange
}) => {
  const { t } = useLocale();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filterSet, [e.target.name]: e.target.value });
  };
  
  const isFiltered = filterSet.searchQuery !== '' || filterSet.assigneeIds.length > 0 || filterSet.typeIds.length > 0 || filterSet.teamIds.length > 0;

  const selectedUsers = useMemo(() => 
    filterSet.assigneeIds.map(id => ALL_USERS.find(u => u.id === id)).filter((u): u is User => !!u),
    [filterSet.assigneeIds]
  );

  return (
    <div className="h-10 flex-shrink-0 bg-white/70 backdrop-blur-sm flex items-center justify-between px-2 border-b border-slate-200/80">
      <div className="flex items-center gap-2">
        <input
          type="search"
          name="searchQuery"
          value={filterSet.searchQuery}
          onChange={handleInputChange}
          placeholder={t('searchPlaceholder')}
          className="w-64 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        {/* Active Filters as Chips */}
        <SelectedAssigneesChips
            selectedUsers={selectedUsers}
            onRemove={(userId) => onFilterChange({ ...filterSet, assigneeIds: filterSet.assigneeIds.filter(id => id !== userId) })}
            onClearAll={() => onFilterChange({ ...filterSet, assigneeIds: [] })}
        />

        {filterSet.teamIds.map(id => {
          const team = teams.find(t => t.id === id);
          if (!team) return null;
          return <FilterChip key={id} onRemove={() => onFilterChange({...filterSet, teamIds: filterSet.teamIds.filter(i => i !== id)})}>
              {team.name}
          </FilterChip>
        })}

        {filterSet.typeIds.map(typeId => (
             <FilterChip key={typeId} onRemove={() => onFilterChange({ ...filterSet, typeIds: filterSet.typeIds.filter(id => id !== typeId) })}>
                {typeId}
            </FilterChip>
        ))}
        
        {isFiltered && (
            <button onClick={onResetFilters} className="text-xs font-medium text-primary hover:underline">
                {t('clearFilters')}
            </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <MultiSelectDropdown
            buttonContent={filterSet.assigneeIds.length > 0 ? t('filterbar_assignees_plural').replace('{count}', filterSet.assigneeIds.length.toString()) : t('allAssignees')}
            items={ALL_USERS.map(u => ({ id: u.id, name: u.name, content: <><img src={u.avatarUrl} alt={u.name} className="w-4 h-4 rounded-full" /><span>{u.name}</span></> }))}
            selectedIds={filterSet.assigneeIds}
            onSelectionChange={(ids) => onFilterChange({...filterSet, assigneeIds: ids})}
            searchable
            searchPlaceholder={t('search')}
        />
        {filterSet.assigneeIds.length > 0 && (
            <div className="flex items-center text-xs p-0.5 bg-slate-200 rounded-md">
                <button onClick={() => onFilterChange({...filterSet, assigneeMatch: 'any'})} className={`px-1.5 py-0.5 rounded ${filterSet.assigneeMatch === 'any' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{t('filterbar_match_any')}</button>
                <button onClick={() => onFilterChange({...filterSet, assigneeMatch: 'all'})} className={`px-1.5 py-0.5 rounded ${filterSet.assigneeMatch === 'all' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{t('filterbar_match_all')}</button>
            </div>
        )}
        
        <MultiSelectDropdown
            buttonContent={filterSet.teamIds.length > 0 ? t('filterbar_teams_plural').replace('{count}', filterSet.teamIds.length.toString()) : t('allTeams')}
            items={teams.map(t => ({ id: t.id, name: t.name, content: t.name }))}
            selectedIds={filterSet.teamIds}
            onSelectionChange={(ids) => onFilterChange({...filterSet, teamIds: ids})}
        />

        <MultiSelectDropdown
            buttonContent={filterSet.typeIds.length > 0 ? t('filterbar_types_plural').replace('{count}', filterSet.typeIds.length.toString()) : t('allTypes')}
            items={FILTERABLE_TYPES.map(type => ({id: type, name: type, content: type}))}
            selectedIds={filterSet.typeIds}
            onSelectionChange={(ids) => onFilterChange({...filterSet, typeIds: ids})}
        />

        <select
          name="groupBy"
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as 'status' | 'epic')}
          className="w-32 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="status">{t('filterbar_groupBy_status')}</option>
          <option value="epic">{t('filterbar_groupBy_epic')}</option>
        </select>

        {activeSprint && groupBy === 'epic' && (
            <div className="flex items-center gap-2 ps-2 ms-2 border-s">
                <input
                    type="checkbox"
                    id="include-unassigned"
                    checked={includeUnassignedEpicItems}
                    onChange={(e) => onIncludeUnassignedEpicItemsChange(e.target.checked)}
                />
                <label htmlFor="include-unassigned" className="text-xs font-medium text-slate-700">{t('include_items_without_epic')}</label>
            </div>
        )}
        
        <div className="h-4 w-px bg-slate-300 mx-1" />

         <button onClick={onOpenSaveViewModal} title={t('saveView')} className="p-1.5 rounded-md hover:bg-slate-200">
            <BookmarkPlusIcon className="w-4 h-4 text-slate-600" />
        </button>
        <button onClick={onOpenManageViewsModal} title={t('manageViews')} className="p-1.5 rounded-md hover:bg-slate-200">
            <FolderCogIcon className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
};