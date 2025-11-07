// components/BugPoolSection.tsx
import React, { useState, useMemo } from 'react';
import { WorkItem, Status, WorkItemType } from '../types';
import { BugIcon, ChevronRightIcon } from './icons';
import { KANBAN_COLUMNS } from '../constants';
import { WorkItemCard } from './WorkItemCard';
import { useLocale } from '../context/LocaleContext';

interface BugPoolSectionProps {
    isCollapsed: boolean;
    onToggle: () => void;
    bugItems: WorkItem[];
    onSelectWorkItem: (item: WorkItem) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, newStatus: Status) => void;
}

export const BugPoolSection: React.FC<BugPoolSectionProps> = ({
    isCollapsed,
    onToggle,
    bugItems,
    onSelectWorkItem,
    onDragStart,
    onDragOver,
    onDrop,
}) => {
    const { t } = useLocale();
    const [onlyUrgent, setOnlyUrgent] = useState(false);

    const openBugs = useMemo(() => bugItems.filter(b => b.status !== Status.DONE), [bugItems]);
    const urgentOpenBugs = useMemo(() => openBugs.filter(b => b.type === WorkItemType.BUG_URGENT), [openBugs]);

    const itemsToDisplay = useMemo(() => onlyUrgent ? urgentOpenBugs : bugItems, [onlyUrgent, urgentOpenBugs, bugItems]);

    return (
        <div className="mb-3 flex-shrink-0 bg-white/80 rounded-lg shadow-sm border">
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 text-left p-2 hover:bg-slate-100"
                aria-expanded={!isCollapsed}
                aria-controls="bug-pool-content"
            >
                <ChevronRightIcon className={`h-4 w-4 transition-transform text-slate-500 ${isCollapsed ? '' : 'rotate-90'}`} />
                <BugIcon className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-slate-800 text-sm">{t('bugpool_title')}</span>

                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            openBugs.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}
                        title={`${openBugs.length} open bugs`}
                    >
                        {t('bugpool_open')}: {openBugs.length}
                    </span>
                    {urgentOpenBugs.length > 0 && (
                         <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white"
                            title={`${urgentOpenBugs.length} urgent bugs`}
                        >
                            {t('bugpool_urgent')}: {urgentOpenBugs.length}
                        </span>
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {!isCollapsed && (
                <div id="bug-pool-content" className="border-t">
                    <div className="p-2 flex justify-end">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={onlyUrgent}
                                onChange={(e) => setOnlyUrgent(e.target.checked)}
                            />
                            {t('bugpool_showUrgentOnly')}
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-2">
                        {KANBAN_COLUMNS.map(col => (
                            <div 
                                key={col.status} 
                                className="bg-slate-100/50 rounded p-2 min-h-[80px]" 
                                onDragOver={onDragOver} 
                                onDrop={(e) => onDrop(e, col.status)}
                            >
                                <h3 className="text-xs font-semibold text-slate-600 mb-2 px-1">
                                    {col.title} 
                                    <span className="font-normal text-slate-500">
                                        ({itemsToDisplay.filter(i => i.status === col.status).length})
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {itemsToDisplay
                                        .filter(item => item.status === col.status)
                                        .map(item => (
                                            <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)}>
                                                <WorkItemCard workItem={item} onSelect={() => onSelectWorkItem(item)} />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};