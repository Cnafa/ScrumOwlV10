import React, { useMemo, useState, useEffect } from 'react';
import { WorkItem, Status, Epic, Sprint, FilterSet, WorkItemType, EpicStatus } from '../types';
import { WorkItemCard } from './WorkItemCard';
import { KANBAN_COLUMNS, WORKFLOW_RULES } from '../constants';
import { useLocale } from '../context/LocaleContext';
import { useNavigation } from '../context/NavigationContext';
import { MountainIcon, ChevronRightIcon } from './icons';
import { BugPoolSection } from './BugPoolSection';

interface KanbanBoardProps {
  workItems: WorkItem[];
  onSelectWorkItem: (workItem: WorkItem) => void;
  onItemStatusChange: (itemId: string, newStatus: Status) => void;
  groupBy: 'status' | 'epic';
  epics: Epic[];
  collapsedEpics: Set<string>;
  onToggleEpic: (epicId: string) => void;
  activeSprint: Sprint | null;
  filterSet: FilterSet;
  onNewItem: (options?: { epicId?: string; }) => void;
}

const EpicGroupHeader: React.FC<{ epic?: Epic; onToggle: () => void; isCollapsed: boolean, itemsCount: number }> = ({ epic, onToggle, isCollapsed, itemsCount }) => {
    const { t } = useLocale();
    return (
        <button 
            onClick={onToggle} 
            className="w-full flex items-center gap-3 text-start p-2 border-b hover:bg-slate-100"
        >
             <ChevronRightIcon className={`h-4 w-4 transition-transform text-slate-500 rtl:scale-x-[-1] ${isCollapsed ? '' : 'rotate-90'}`} />
            {epic ? <div className="w-2 h-5 rounded-full" style={{backgroundColor: epic.color}}></div> : <MountainIcon className="w-5 h-5 text-slate-500" />}
            <span className="font-semibold text-slate-800 text-sm">{epic ? epic.name : t('kanban_itemsWithoutEpic')}</span>
            <span className="text-xs font-normal text-slate-500">({itemsCount})</span>
        </button>
    );
};


export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    workItems, 
    onSelectWorkItem,
    onItemStatusChange, 
    groupBy, 
    epics, 
    collapsedEpics, 
    onToggleEpic, 
    activeSprint,
    filterSet,
    onNewItem
}) => {
  const { t } = useLocale();
  const { setCurrentView } = useNavigation();

  // All hooks must be called at the top of the component, before any conditional returns.
  const [isBugPoolCollapsed, setIsBugPoolCollapsed] = useState(() => {
    try {
        const storedValue = localStorage.getItem('bugPoolCollapsed');
        return storedValue ? JSON.parse(storedValue) : true;
    } catch {
        return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('bugPoolCollapsed', JSON.stringify(isBugPoolCollapsed));
  }, [isBugPoolCollapsed]);

  const bugItems = useMemo(() =>
    workItems.filter(item => item.type === WorkItemType.BUG_MINOR || item.type === WorkItemType.BUG_URGENT),
  [workItems]);

  const showBugPool = useMemo(() => {
    // FIX: Corrected property access from filterSet.type to filterSet.typeIds.
    // The logic now correctly checks if bug-related types are included in the multi-select filter.
    if (filterSet.typeIds.length > 0 && !filterSet.typeIds.includes(WorkItemType.BUG_MINOR) && !filterSet.typeIds.includes(WorkItemType.BUG_URGENT)) {
        return false;
    }
    if (bugItems.length === 0) {
        return false;
    }
    return true;
  }, [filterSet.typeIds, bugItems.length]);

  const itemsByEpic = useMemo(() => {
        const grouped: Record<string, WorkItem[]> = { 'no-epic': [] };
        epics.forEach(e => grouped[e.id] = []);
        
        workItems.forEach(item => {
            if (item.epicId && grouped.hasOwnProperty(item.epicId)) {
                grouped[item.epicId].push(item);
            } else {
                grouped['no-epic'].push(item);
            }
        });
        return grouped;
    }, [workItems, epics]);

    const epicsWithItems = useMemo(() => {
        return epics
            .filter(e => (e.status === EpicStatus.ACTIVE || e.status === EpicStatus.ON_HOLD) && itemsByEpic[e.id]?.length > 0)
            .sort((a,b) => b.iceScore - a.iceScore);
    }, [epics, itemsByEpic]);

  // Conditional returns are now safe after all hooks have been called.
  if (!activeSprint) {
        return (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 bg-white/60 rounded-lg">
                    <h3 className="text-base font-semibold text-slate-800">{t('no_active_sprint_title')}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t('kanban_noActiveSprint_selectPrompt')}</p>
                    <button onClick={() => setCurrentView('SPRINTS')} className="mt-2 text-sm text-primary hover:underline">
                        {t('no_active_sprint_cta')}
                    </button>
                </div>
            </div>
        );
    }
    
    // US-43: Zero state for empty sprint. The workItems prop is already filtered.
    if (workItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 bg-white/60 rounded-lg">
                    <h3 className="text-base font-semibold text-slate-800">{t('kanban_emptySprint_title')}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t('kanban_emptySprint_body')}</p>
                    <button onClick={() => onNewItem()} className="mt-4 py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        {t('newItem')}
                    </button>
                </div>
            </div>
        );
    }

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('workItemId', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    e.stopPropagation();
    const workItemId = e.dataTransfer.getData('workItemId');
    const item = workItems.find((i) => i.id === workItemId);
    
    if (!item) return;

    const allowedTransitions = WORKFLOW_RULES[item.status];
    if (allowedTransitions && allowedTransitions.includes(newStatus)) {
        onItemStatusChange(workItemId, newStatus);
    } else if (item.status !== newStatus) {
        console.warn("Invalid status transition attempted.");
    }
  };
  
  if (groupBy === 'status') {
    return (
        <div className="flex-1 flex flex-col gap-3">
            {showBugPool && (
                 <BugPoolSection
                    isCollapsed={isBugPoolCollapsed}
                    onToggle={() => setIsBugPoolCollapsed(prev => !prev)}
                    bugItems={bugItems}
                    onSelectWorkItem={onSelectWorkItem}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                />
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {KANBAN_COLUMNS.map((column) => (
                <div
                    key={column.status}
                    className="bg-slate-100/70 rounded-lg p-2 flex flex-col"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, column.status)}
                >
                    <h2 className="text-base font-semibold text-slate-700 mb-3 px-1">{column.title} <span className="text-sm font-normal text-slate-500">({workItems.filter(item => item.status === column.status).length})</span></h2>
                    <div className="flex-1 space-y-2 overflow-y-auto h-full pr-1">
                        {workItems
                        .filter((item) => item.status === column.status)
                        .map((item) => (
                            <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)}>
                                <WorkItemCard 
                                    workItem={item} 
                                    onSelect={() => onSelectWorkItem(item)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
  }

  const noEpicItems = itemsByEpic['no-epic'];

  return (
    <div className="flex-1 flex flex-col gap-3">
        {showBugPool && (
            <BugPoolSection
                isCollapsed={isBugPoolCollapsed}
                onToggle={() => setIsBugPoolCollapsed(prev => !prev)}
                bugItems={bugItems}
                onSelectWorkItem={onSelectWorkItem}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
            />
        )}
        {epicsWithItems.map(epic => {
            const isCollapsed = collapsedEpics.has(epic.id);
            return (
                <div key={epic.id} className="bg-white/80 rounded-lg">
                    <EpicGroupHeader epic={epic} onToggle={() => onToggleEpic(epic.id)} isCollapsed={isCollapsed} itemsCount={itemsByEpic[epic.id].length} />
                    {!isCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-2">
                            {KANBAN_COLUMNS.map(col => (
                                <div key={col.status} className="bg-slate-100/50 rounded p-2 min-h-[80px]" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.status)}>
                                    <h3 className="text-xs font-semibold text-slate-600 mb-2 px-1">{col.title} <span className="font-normal text-slate-500">({itemsByEpic[epic.id].filter(i => i.status === col.status).length})</span></h3>
                                    <div className="space-y-2">
                                        {itemsByEpic[epic.id]
                                            .filter(item => item.status === col.status)
                                            .map(item => <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)}><WorkItemCard workItem={item} onSelect={() => onSelectWorkItem(item)} /></div>)
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        })}
        {noEpicItems.length > 0 && (
            <div className="bg-white/80 rounded-lg">
                <EpicGroupHeader onToggle={() => onToggleEpic('no-epic')} isCollapsed={collapsedEpics.has('no-epic')} itemsCount={noEpicItems.length} />
                {!collapsedEpics.has('no-epic') && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-2">
                        {KANBAN_COLUMNS.map(col => (
                            <div key={col.status} className="bg-slate-100/50 rounded p-2 min-h-[80px]" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.status)}>
                                <h3 className="text-xs font-semibold text-slate-600 mb-2 px-1">{col.title} <span className="font-normal text-slate-500">({noEpicItems.filter(i => i.status === col.status).length})</span></h3>
                                <div className="space-y-2">
                                    {noEpicItems
                                        .filter(item => item.status === col.status)
                                        .map(item => <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)}><WorkItemCard workItem={item} onSelect={() => onSelectWorkItem(item)} /></div>)
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};