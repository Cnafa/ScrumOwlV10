// components/ItemsView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { WorkItem, Epic, Sprint, SprintState, User, WorkItemType, Status } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, MountainIcon, MilestoneIcon } from './icons';
import { KANBAN_COLUMNS, WORK_ITEM_TYPES } from '../constants';

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const AssigneeAvatars: React.FC<{ assignees: User[] }> = ({ assignees }) => {
    if (assignees.length === 0) return <span className="text-slate-400">-</span>;
    return (
        <div className="flex -space-x-2">
            {assignees.slice(0, 3).map(user => (
                <img key={user.id} src={user.avatarUrl} alt={user.name} title={user.name} className="w-6 h-6 rounded-full border-2 border-white"/>
            ))}
            {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                    +{assignees.length - 3}
                </div>
            )}
        </div>
    );
};

const QuickScopePill: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm font-medium rounded-full ${isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
    >
        {label}
    </button>
);

// FIX: Define the missing ItemsViewProps interface.
interface ItemsViewProps {
    workItems: WorkItem[];
    epics: Epic[];
    sprints: Sprint[];
    onItemUpdate: (item: WorkItem) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
}

export const ItemsView: React.FC<ItemsViewProps> = ({ workItems, epics, sprints, onItemUpdate, onSelectWorkItem }) => {
    const { t } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCell, setEditingCell] = useState<{ itemId: string; column: 'epic' | 'sprint' } | null>(null);
    
    const [quickScope, setQuickScope] = useState<'ALL' | 'NO_EPIC' | 'WITH_EPIC'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const debouncedSearch = useDebounce(searchQuery, 300);

    const filteredItems = useMemo(() => {
        let items = [...workItems];

        // Apply quick scope
        if (quickScope === 'NO_EPIC') {
            items = items.filter(item => !item.epicId);
        } else if (quickScope === 'WITH_EPIC') {
            items = items.filter(item => !!item.epicId);
        }

        // Apply type filter
        if (typeFilter !== 'ALL') {
            items = items.filter(item => item.type === typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'ALL') {
            items = items.filter(item => item.status === statusFilter);
        }

        // Apply search query
        if (debouncedSearch) {
            const lowerQuery = debouncedSearch.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) || 
                item.id.toLowerCase().includes(lowerQuery)
            );
        }
        
        // Sort by updatedAt descending
        return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    }, [workItems, debouncedSearch, quickScope, typeFilter, statusFilter]);

    const handleInlineSave = (item: WorkItem, column: 'epic' | 'sprint', value: string) => {
        let updatedItem = { ...item };
        if (column === 'epic') {
            const epic = epics.find(e => e.id === value);
            updatedItem = { ...updatedItem, epicId: epic?.id, epicInfo: epic ? { id: epic.id, name: epic.name, color: epic.color } : undefined };
        } else if (column === 'sprint') {
            updatedItem = { ...updatedItem, sprintId: value || undefined };
        }
        onItemUpdate(updatedItem);
        setEditingCell(null);
    };

    const selectableSprints = useMemo(() => sprints.filter(s => s.state === SprintState.ACTIVE || s.state === SprintState.PLANNED), [sprints]);
    
    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <header className="flex-shrink-0 pb-4 border-b">
                <h2 className="text-xl font-bold text-[#3B3936]">{t('itemsView')}</h2>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-2">
                        <QuickScopePill label={t('items_quickScope_all')} isActive={quickScope === 'ALL'} onClick={() => setQuickScope('ALL')} />
                        <QuickScopePill label={t('items_quickScope_noEpic')} isActive={quickScope === 'NO_EPIC'} onClick={() => setQuickScope('NO_EPIC')} />
                        <QuickScopePill label={t('items_quickScope_withEpic')} isActive={quickScope === 'WITH_EPIC'} onClick={() => setQuickScope('WITH_EPIC')} />
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="ALL">{t('all_item_types')}</option>
                            {WORK_ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="ALL">{t('all_statuses')}</option>
                            {KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}
                        </select>
                        <div className="relative w-full sm:w-64">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
                            />
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 overflow-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            {['ID', t('title'), t('type'), t('status'), t('assignee'), t('epic'), t('sprint'), t('priority'), t('lastModified')].map(header => (
                                <th key={header} scope="col" className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map(item => (
                            <tr key={item.id} onClick={() => onSelectWorkItem(item)} className="cursor-pointer hover:bg-slate-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-500">{item.id}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate">{item.title}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">{item.status}</span></td>
                                <td className="px-3 py-2 whitespace-nowrap"><AssigneeAvatars assignees={item.assignees} /></td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                                    {editingCell?.itemId === item.id && editingCell?.column === 'epic' ? (
                                        <select
                                            value={item.epicId || ''}
                                            onChange={(e) => handleInlineSave(item, 'epic', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-sm p-1 border rounded"
                                        >
                                            <option value="">{t('noEpic')}</option>
                                            {epics.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    ) : (
                                        <button onClick={() => setEditingCell({ itemId: item.id, column: 'epic' })} className="flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-slate-200 w-full text-start truncate max-w-[150px] text-slate-800">
                                            {item.epicInfo ? <><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.epicInfo.color }}></div> <span className="truncate">{item.epicInfo.name}</span></> : <span className="text-slate-400">{t('items_assignEpic')}</span>}
                                        </button>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                                     {editingCell?.itemId === item.id && editingCell?.column === 'sprint' ? (
                                        <select
                                            value={item.sprintId || ''}
                                            onChange={(e) => handleInlineSave(item, 'sprint', e.target.value)}
                                            onBlur={() => setEditingCell(null)}
                                            autoFocus
                                            className="text-sm p-1 border rounded"
                                        >
                                            <option value="">{t('noSprint')}</option>
                                            {selectableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <button onClick={() => setEditingCell({ itemId: item.id, column: 'sprint' })} className="flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-slate-200 w-full text-start truncate max-w-[150px] text-slate-800">
                                            {item.sprintId ? <><MilestoneIcon className="w-3 h-3 text-slate-500" /> <span className="truncate">{sprints.find(s=>s.id === item.sprintId)?.name || '...'}</span></> : <span className="text-slate-400">{t('items_assignSprint')}</span>}
                                        </button>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.priority}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(item.updatedAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && (
                    <div className="text-center py-10 text-slate-500">{t('items_table_empty')}</div>
                )}
            </div>
        </div>
    );
};
