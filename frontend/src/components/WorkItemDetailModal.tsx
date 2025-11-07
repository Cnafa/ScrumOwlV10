// components/WorkItemDetailModal.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkItem, ActivityItem, User, ChecklistItem, Sprint, TransitionLog, Status } from '../types';
import { XMarkIcon, StarIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ActivityFeed } from './ActivityFeed';
import { useBoard } from '../context/BoardContext';

interface WorkItemDetailModalProps {
  workItem: WorkItem;
  sprints: Sprint[];
  onClose: () => void;
  onEdit: (workItem: WorkItem) => void;
  onItemUpdate: (item: WorkItem) => void;
  onNewComment: (commentText: string) => void;
  highlightSection?: string;
}

const DetailField: React.FC<{ label: string; children: React.ReactNode, highlightKey?: string }> = ({ label, children, highlightKey }) => (
    <div data-highlight-key={highlightKey}>
        <p className="text-sm font-medium text-[#889C9B] mb-1">{label}</p>
        <div className="text-sm text-[#3B3936]">{children}</div>
    </div>
);

const UserChip: React.FC<{ user: User, isPrimary: boolean }> = ({ user, isPrimary }) => (
    <div className={`inline-flex items-center gap-2 rounded-full px-2 py-1 ${isPrimary ? 'bg-amber-100 border border-amber-300' : 'bg-gray-100'}`}>
        <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
        <span className="text-sm font-medium">{user.name}</span>
        {isPrimary && <StarIcon className="w-3 h-3 text-amber-600" fill="currentColor" />}
    </div>
);

const UserDisplay: React.FC<{ user?: User }> = ({ user }) => {
    if (!user) return <span className="text-gray-400">Unassigned</span>;
    return (
        <div className="flex items-center gap-2">
            <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
            <span>{user.name}</span>
        </div>
    );
};

export const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({ workItem, sprints, onClose, onEdit, onItemUpdate, onNewComment, highlightSection }) => {
  const { t } = useLocale();
  const { user } = useAuth();
  const { can } = useBoard();
  const [comment, setComment] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  const canEditItem = can('item.edit.any') || (can('item.edit.own') && workItem.assignee?.id === user?.id);
  
  const orderedAssignees = useMemo(() => {
    if (!workItem.assignees || workItem.assignees.length === 0) return [];
    const primary = workItem.assignee;
    if (!primary) return workItem.assignees;
    return [
        primary,
        ...workItem.assignees.filter(a => a.id !== primary.id)
    ];
  }, [workItem.assignees, workItem.assignee]);

  // Fetch item history (versions)
  useEffect(() => {
    if (!workItem) return;
    const fetchActivities = async () => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables and resolve TypeScript error.
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/item-versions/?work_item=${workItem.id}`);
            if (!response.ok) throw new Error('Failed to fetch item history');
            const data = await response.json();
            const versions = data.results || data;


            const mappedActivities: ActivityItem[] = versions.map((version: any): ActivityItem | null => {
                if (version.changes?.status) {
                    return {
                        type: 'TRANSITION',
                        data: {
                            id: version.id,
                            user: { name: version.user_name || 'System', avatarUrl: '' },
                            fromStatus: version.changes.status.from as Status,
                            toStatus: version.changes.status.to as Status,
                            timestamp: version.timestamp,
                        } as TransitionLog,
                    };
                }
                return null;
            }).filter((a): a is ActivityItem => !!a);
            
            setActivities(mappedActivities);
        } catch (e) {
            console.error("Failed to fetch activities:", e);
        }
    };
    fetchActivities();
  }, [workItem]);

  // US-42: Highlighting logic
  useEffect(() => {
    if (highlightSection && modalBodyRef.current) {
        const elementToHighlight = modalBodyRef.current.querySelector(`[data-highlight-key="${highlightSection}"]`);
        if (elementToHighlight) {
            elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elementToHighlight.classList.add('animate-highlight-pulse');
            const timer = setTimeout(() => {
                elementToHighlight.classList.remove('animate-highlight-pulse');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }
  }, [highlightSection, workItem]);
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && user) {
      const newComment: ActivityItem = {
        type: 'COMMENT',
        data: {
          id: `comment-${Date.now()}`,
          user: { name: user.name, avatarUrl: user.avatarUrl },
          content: comment,
          mentions: [],
          timestamp: new Date().toISOString(),
        }
      };
      setActivities(prev => [newComment, ...prev]);
      onNewComment(comment.trim());
      setComment('');
    }
  };

  const handleToggleChecklistItem = (checklistItemId: string) => {
    const newChecklist = workItem.checklist.map(item =>
        item.id === checklistItemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    const updatedWorkItem = { ...workItem, checklist: newChecklist };
    onItemUpdate(updatedWorkItem);
  };
  
  const sprintName = useMemo(() => {
    if (!workItem.sprintId) return 'N/A';
    return sprints.find(s => s.id === workItem.sprintId)?.name || workItem.sprintId;
  }, [workItem.sprintId, sprints]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onMouseDown={onClose}>
      <div 
        className="bg-[#F0F4F4] rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onMouseDown={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b bg-white/60 rounded-t-lg flex-shrink-0">
          <div>
             <p className="text-xs text-[#889C9B]" data-highlight-key="id">{workItem.id}</p>
             <h2 className="text-xl font-bold text-[#3B3936]" data-highlight-key="title">{workItem.title}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {canEditItem && (
                <button onClick={() => onEdit(workItem)} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]">{t('edit')}</button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
              <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <main ref={modalBodyRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div data-highlight-key="summary">
                    <h3 className="text-md font-semibold text-[#486966] mb-2">{t('aiPoweredSummary')}</h3>
                    <p className="text-sm text-[#3B3936] p-3 bg-[#B2BEBF]/50 rounded-lg">{workItem.summary || 'No summary available.'}</p>
                </div>
                <div data-highlight-key="description">
                    <h3 className="text-md font-semibold text-[#486966] mb-2">{t('description')}</h3>
                    <div className="prose prose-sm max-w-none text-[#3B3936]" dangerouslySetInnerHTML={{ __html: workItem.description.replace(/\n/g, '<br />') }} />
                </div>
                
                {workItem.checklist && workItem.checklist.length > 0 && (
                    <div data-highlight-key="checklist">
                        <h3 className="text-md font-semibold text-[#486966] mb-2">{t('checklist')}</h3>
                        <ul className="space-y-1">
                            {workItem.checklist.map(item => (
                                <li key={item.id} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={item.isCompleted} onChange={() => handleToggleChecklistItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                                    <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <hr className="border-t border-[#B2BEBF]" />

                <div data-highlight-key="activity">
                    <h3 className="text-md font-semibold text-[#486966] mb-4">{t('activity')}</h3>
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('addComment')}
                            className="w-full px-3 py-2 h-16 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#486966]"
                            rows={2}
                        />
                        <div className="flex justify-end mt-2">
                            <button type="submit" className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58] disabled:bg-gray-400" disabled={!comment.trim()}>{t('comment')}</button>
                        </div>
                    </form>
                    <ActivityFeed 
                        activities={activities} 
                        onUpdateComment={(id, content) => { /* Logic to update comment */ }}
                        onDeleteComment={(id) => { /* Logic to delete comment */ }}
                        highlightSection={highlightSection}
                    />
                </div>
            </main>
            
            {/* Sidebar with metadata */}
            <aside className="w-1/3 max-w-xs border-l border-[#B2BEBF] overflow-y-auto p-6 space-y-5 bg-white/50">
                 <DetailField label={t('status')} highlightKey="status"><span className="font-semibold px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{workItem.status}</span></DetailField>
                 <DetailField label={t('assignee')} highlightKey="assignee">
                    <div className="flex flex-wrap gap-1.5">
                      {orderedAssignees.length > 0 ? (
                          orderedAssignees.map(a => <UserChip key={a.id} user={a} isPrimary={a.id === workItem.assignee?.id} />)
                      ) : 'Unassigned'}
                    </div>
                 </DetailField>
                 <DetailField label={'Reporter'} highlightKey="reporter"><UserDisplay user={workItem.reporter} /></DetailField>
                 <DetailField label={t('priority')} highlightKey="priority"><span className="font-bold">{workItem.priority}</span></DetailField>
                 <DetailField label={'Sprint'} highlightKey="sprint">
                    <div className="flex items-center gap-2">
                        <span>{sprintName}</span>
                        {workItem.sprintId && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${workItem.sprintBinding === 'auto' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                                {workItem.sprintBinding === 'auto' ? 'Auto' : 'Manual'}
                            </span>
                        )}
                    </div>
                </DetailField>
                 <DetailField label={'Group'} highlightKey="group">{workItem.group}</DetailField>
                 <DetailField label={t('type')} highlightKey="type">{workItem.type}</DetailField>
                 <DetailField label={t('stack')} highlightKey="stack">{workItem.stack || 'N/A'}</DetailField>
                 <DetailField label={t('estimationPoints')} highlightKey="estimationPoints">{workItem.estimationPoints || 'N/A'}</DetailField>
                 <DetailField label={t('effortHours')} highlightKey="effortHours">{workItem.effortHours ? `${workItem.effortHours}h` : 'N/A'}</DetailField>
                 <DetailField label={t('dueDate')} highlightKey="dueDate">{workItem.dueDate ? new Date(workItem.dueDate).toLocaleDateString() : 'N/A'}</DetailField>
                 <DetailField label={t('labels')} highlightKey="labels">
                    {workItem.labels && workItem.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {workItem.labels.map(label => (
                                <span key={label} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#486966]/20 text-[#486966]">
                                    {label}
                                </span>
                            ))}
                        </div>
                    ) : 'None'}
                 </DetailField>
                  {workItem.branchName && (
                     <DetailField label={t('branchName')} highlightKey="branch">
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{workItem.branchName}</span>
                    </DetailField>
                 )}
            </aside>
        </div>
      </div>
    </div>
  );
}