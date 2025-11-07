import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorkItem, WorkItemType, User, Priority } from '../types';
import { UserRoundIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface WorkItemCardProps {
  workItem: WorkItem;
  onSelect: (workItem: WorkItem) => void;
}

const typeConfig: Record<string, { label: string; classes: string; border: string }> = {
    [WorkItemType.STORY]: { label: "Story", classes: 'bg-label-neutral-bg text-label-neutral-text', border: 'border-l-gray-500' },
    [WorkItemType.TASK]: { label: "Task", classes: 'bg-label-blue-bg text-label-blue-text', border: 'border-l-blue-500' },
    [WorkItemType.BUG_URGENT]: { label: "Urgent Bug", classes: 'bg-label-red-bg text-label-red-text', border: 'border-l-red-600' },
    [WorkItemType.BUG_MINOR]: { label: "Bug", classes: 'bg-label-amber-bg text-label-amber-text', border: 'border-l-amber-500' },
    [WorkItemType.TICKET]: { label: "Ticket", classes: 'bg-label-neutral-bg text-label-neutral-text', border: 'border-l-gray-400' },
};

const getDueDateInfo = (dueDate: string | null | undefined, locale: string) => {
    if (!dueDate) {
        return {
            displayText: 'No due date',
            fullDateText: 'No due date set.',
            classes: 'bg-gray-100 text-gray-600'
        };
    }
    
    const due = new Date(dueDate);
    const today = new Date();
    
    const dueStartOfDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = dueStartOfDay.getTime() - todayStartOfDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let relativeText = '';
    let classes = '';

    if (diffDays > 14) {
        classes = 'bg-due-far text-due-far-text border border-green-700/20';
        relativeText = `in ${diffDays}d`;
    } else if (diffDays >= 8) {
        classes = 'bg-due-midfar text-due-midfar-text border border-green-600/20';
        relativeText = `in ${diffDays}d`;
    } else if (diffDays >= 4) {
        classes = 'bg-due-approaching text-due-approaching-text border border-amber-600/20';
        relativeText = `in ${diffDays}d`;
    } else if (diffDays >= 2) {
        classes = 'bg-due-near text-due-near-text border border-orange-500/20';
        relativeText = `in ${diffDays}d`;
    } else if (diffDays === 1) {
        classes = 'bg-due-today text-white';
        relativeText = 'Tomorrow';
    } else if (diffDays === 0) {
        classes = 'bg-due-today text-white';
        relativeText = 'Today';
    } else { // Overdue
        if (diffDays <= -7) {
            classes = 'bg-due-overdue-strong text-white';
        } else {
            classes = 'bg-due-overdue text-white';
        }
        relativeText = `Overdue ${-diffDays}d`;
    }
    
    const localeCode = locale.split('-')[0];
    const formattedDate = new Intl.DateTimeFormat(localeCode, { month: 'short', day: 'numeric' }).format(due);
    const fullDateText = new Intl.DateTimeFormat(localeCode, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(dueDate));

    return {
        displayText: `${formattedDate} (${relativeText})`,
        fullDateText: `Due: ${fullDateText}`,
        classes: classes,
    };
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

const AssigneeAvatars: React.FC<{ assignees: User[], primary?: User }> = ({ assignees = [], primary }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, () => setIsPopoverOpen(false));

    const orderedAssignees = useMemo(() => {
        if (assignees.length === 0) return [];
        const primaryAssignee = primary || assignees[0];
        return [
            primaryAssignee,
            ...assignees.filter(a => a.id !== primaryAssignee.id)
        ];
    }, [assignees, primary]);

    if (orderedAssignees.length === 0) {
        return (
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center" title="Unassigned">
                <UserRoundIcon className="w-4 h-4 text-slate-500" />
            </div>
        );
    }
    
    const tooltipText = orderedAssignees.map((u, i) => i === 0 ? `${u.name} (Primary)` : u.name).join(', ');
    const visibleAssignees = orderedAssignees.slice(0, 3);
    const hiddenAssignees = orderedAssignees.slice(3);

    return (
        <div className="flex items-center -space-x-2" title={!isPopoverOpen ? tooltipText : undefined} ref={popoverRef}>
            {visibleAssignees.map((assignee) => (
                <img
                    key={assignee.id}
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    className="w-6 h-6 rounded-full border-2 border-white"
                />
            ))}
            {hiddenAssignees.length > 0 && (
                <div className="relative">
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(p => !p); }}
                        className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 hover:bg-slate-300"
                    >
                        +{hiddenAssignees.length}
                    </button>
                    {isPopoverOpen && (
                        <div className="absolute bottom-full mb-2 right-0 transform translate-x-1/4 bg-white p-2 rounded-md shadow-lg border z-10 w-48">
                            <ul className="space-y-1">
                                {hiddenAssignees.map(user => (
                                    <li key={user.id} className="flex items-center gap-2 text-sm">
                                        <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
                                        <span className="truncate">{user.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export const WorkItemCard: React.FC<WorkItemCardProps> = ({ workItem, onSelect }) => {
  const { locale } = useLocale();
  
  const config = typeConfig[workItem.type] || typeConfig[WorkItemType.TASK];

  const highlightClass = workItem.isUpdated ? 'shadow-lg shadow-blue-300 animate-pulse-once ring-2 ring-primary' : 'shadow-sm';

  const dueDateInfo = getDueDateInfo(workItem.dueDate, locale);

  return (
    <div
      onClick={() => onSelect(workItem)}
      className={`bg-white rounded-lg p-2.5 border-s-4 ${config.border.replace('border-l-','border-s-')} cursor-pointer hover:shadow-md transition-all duration-300 ${highlightClass} space-y-1.5`}
      aria-label={`View details for ${workItem.title}`}
    >
      <div className="flex justify-between items-start">
        <p className="text-xs font-medium text-slate-500">{workItem.id}</p>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config.classes}`}>{config.label}</span>
      </div>
      <h3 title={workItem.title} className="font-medium text-slate-800 text-sm leading-snug text-start truncate">{workItem.title}</h3>
      <div className="flex justify-between items-center pt-1">
        <div/>
        <div className="flex items-center gap-2">
            <span title={dueDateInfo.fullDateText} className={`px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${dueDateInfo.classes}`}>
                {dueDateInfo.displayText}
            </span>
            <AssigneeAvatars assignees={workItem.assignees} primary={workItem.assignee} />
        </div>
      </div>
    </div>
  );
};