// components/WorkItemEditor.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorkItem, Status, Priority, WorkItemType, Epic, Team, User, Sprint, SprintState } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon, TypeIcon, FileTextIcon, UserRoundIcon, MilestoneIcon, BoxesIcon, TimerIcon, CalendarIcon, FlagIcon, PaperclipIcon, CheckSquareIcon, GitBranchIcon, TagIcon, UsersRoundIcon, MountainIcon, LayoutKanbanIcon, ClipboardCheckIcon, StarIcon, LockClosedIcon } from './icons';
import { PRIORITIES, STACKS, WORK_ITEM_TYPES, WORKFLOW_RULES } from '../constants';
import { LabelInput } from './LabelInput';
import { ChecklistInput } from './ChecklistInput';
import { AttachmentsManager } from './AttachmentsManager';
import { generateSummary } from '../services/geminiService';
import { isEqual } from 'lodash-es';
import { RichTextEditor } from './RichTextEditor';
import { DateField } from './DateField';
import { Editor } from '@tiptap/react';

interface WorkItemEditorProps {
  workItem: Partial<WorkItem>;
  epics: Epic[];
  teams: Team[];
  sprints: Sprint[];
  onSave: (item: Partial<WorkItem>) => void;
  onCancel: () => void;
  isNew: boolean;
  highlightSection?: string;
  boardUsers: User[];
  workItems: WorkItem[]; // Pass all items to find parent stories
}

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

const UserSelect: React.FC<{
  icon: React.ReactNode;
  selectedUser: User | undefined;
  onChange: (userId: string) => void;
  highlightKey: string;
  disabled?: boolean;
  users: User[];
}> = ({ icon, selectedUser, onChange, highlightKey, disabled, users }) => {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));
  
  return (
    <div className="relative" ref={dropdownRef} data-highlight-key={highlightKey}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className="w-full flex items-center gap-2 ps-2 pe-3 py-1.5 min-h-[34px] bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-50 text-start">
        <span className="text-slate-500">{icon}</span>
        {selectedUser ? (
          <>
            <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-5 h-5 rounded-full" />
            <span className="text-sm">{selectedUser.name}</span>
          </>
        ) : (
          <span className="text-sm text-slate-500">{t('workItemEditor_selectUser')}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto text-start">
          <ul>
            {users.map(user => (
              <li key={user.id} onClick={() => { onChange(user.id); setIsOpen(false); }} className="px-3 py-2 text-sm text-slate-900 cursor-pointer hover:bg-gray-100 flex items-center gap-2">
                <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
                <span>{user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const FieldWrapper: React.FC<{ icon: React.ReactNode, children: React.ReactNode, highlightKey?: string }> = ({ icon, children, highlightKey }) => (
  <div className="grid grid-cols-[28px_1fr] items-center gap-x-2" data-highlight-key={highlightKey}>
      <div className="flex items-center justify-center text-slate-500">{icon}</div>
      <div>{children}</div>
  </div>
);

const SideFieldWrapper: React.FC<{ label: string, children: React.ReactNode, highlightKey?: string }> = ({ label, children, highlightKey }) => (
  <div className="space-y-1" data-highlight-key={highlightKey}>
      <label className="text-xs font-medium text-slate-600 px-1">{label}</label>
      <div>{children}</div>
  </div>
);

const SelectWithIcon: React.FC<{ icon: React.ReactNode, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, name: string, disabled?: boolean, className?: string }> = ({ icon, value, onChange, children, name, disabled, className }) => (
  <div className={`relative ${className || 'w-full'}`}>
      <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none text-slate-500">{icon}</div>
      <select name={name} value={value} onChange={onChange} disabled={disabled} className="w-full ps-9 pe-3 py-1.5 min-h-[34px] bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-50">
          {children}
      </select>
  </div>
);

const AssigneeChip: React.FC<{ user: User, isPrimary: boolean, onRemove: () => void, onSetPrimary: () => void }> = ({ user, isPrimary, onRemove, onSetPrimary }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className={`relative flex items-center gap-1.5 rounded-full pl-1 pr-2 py-0.5 text-sm font-medium ${isPrimary ? 'bg-amber-100 text-amber-800' : 'bg-primarySoft text-primary'}`}>
            <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
            <span>{user.name}</span>
            {isHovered && (
                <div className="absolute -top-1 -right-1 flex items-center bg-white rounded-full shadow-md z-10">
                    {!isPrimary && <button type="button" title="Make primary" onClick={onSetPrimary} className="p-0.5 text-amber-600 hover:bg-amber-100 rounded-full"><StarIcon className="w-4 h-4" /></button>}
                    <button type="button" title="Remove" onClick={onRemove} className="p-0.5 text-red-600 hover:bg-red-100 rounded-full"><XMarkIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

export const WorkItemEditor: React.FC<WorkItemEditorProps> = ({ workItem, workItems, epics, teams, sprints, onSave, onCancel, isNew, highlightSection, boardUsers }) => {
  const { t } = useLocale();
  const [localWorkItem, setLocalWorkItem] = useState<Partial<WorkItem>>(workItem);
  const [originalWorkItem, setOriginalWorkItem] = useState<Partial<WorkItem>>(workItem);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDescriptionOverLimit, setIsDescriptionOverLimit] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(assigneeDropdownRef, () => setIsAssigneeDropdownOpen(false));

  const selectableSprints = useMemo(() => sprints.filter(s => (s.state === SprintState.ACTIVE || s.state === SprintState.PLANNED) && s.state !== SprintState.DELETED), [sprints]);
  
  const availableAssignees = useMemo(() => {
    const selectedIds = new Set(localWorkItem.assignees?.map(a => a.id) || []);
    return boardUsers.filter(u => !selectedIds.has(u) && u.name.toLowerCase().includes(assigneeSearch.toLowerCase()));
  }, [assigneeSearch, localWorkItem.assignees, boardUsers]);

  const parentStories = useMemo(() => workItem.id ? workItems.filter(i => i.type === WorkItemType.STORY && i.id !== workItem.id) : workItems.filter(i => i.type === WorkItemType.STORY), [workItems, workItem.id]);


  useEffect(() => {
    setLocalWorkItem(workItem);
    setOriginalWorkItem(workItem);
  }, [workItem]);

  useEffect(() => {
    if (highlightSection && editorContainerRef.current) {
        const elementToHighlight = editorContainerRef.current.querySelector(`[data-highlight-key="${highlightSection}"]`);
        if (elementToHighlight) {
            elementToHighlight.classList.add('animate-highlight-pulse');
            (elementToHighlight as HTMLElement).focus?.();
            const timer = setTimeout(() => {
                elementToHighlight.classList.remove('animate-highlight-pulse');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }
  }, [highlightSection]);

  const hasChanges = !isEqual(originalWorkItem, localWorkItem);

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      onCancel();
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    onCancel();
  };

  const handleKeepEditing = () => {
    setShowConfirmModal(false);
  };
  
  const handleSave = () => {
    if (localWorkItem.branchRequired && !localWorkItem.branchName?.trim()) {
        alert("Branch name is required when 'Branch Required' is checked.");
        return;
    }
    onSave(localWorkItem);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: any = value;
    if (type === 'number') {
        const parsed = parseInt(value, 10);
        finalValue = isNaN(parsed) ? 0 : parsed;
    }
    
    setLocalWorkItem(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleDescriptionChange = (editor: Editor) => {
    setLocalWorkItem(prev => ({
        ...prev, 
        description: editor.getText(),
        description_rich: editor.getJSON(),
    }));
  };

  const handleUserChange = (fieldName: 'reporter', userId: string) => {
    const user = boardUsers.find(u => u.id === userId);
    if (user) {
      setLocalWorkItem(prev => ({ ...prev, [fieldName]: user }));
    }
  };

  const handleAddAssignee = (user: User) => {
    const currentAssignees = localWorkItem.assignees || [];

    // Prevent adding if already assigned
    if (currentAssignees.find(a => a.id === user.id)) {
      setAssigneeSearch('');
      setIsAssigneeDropdownOpen(false);
      return;
    }

    if (currentAssignees.length >= 10) return;
    const newAssignees = [...currentAssignees, user];
    const newPrimary = localWorkItem.assignee || user;
    setLocalWorkItem(prev => ({ ...prev, assignees: newAssignees, assignee: newPrimary }));
    setAssigneeSearch('');
    setIsAssigneeDropdownOpen(false);
  };

  const handleRemoveAssignee = (userId: string) => {
      let newAssignees = (localWorkItem.assignees || []).filter(a => a.id !== userId);
      let newPrimary = localWorkItem.assignee;
      if (newPrimary?.id === userId) {
          newPrimary = newAssignees[0];
      }
      setLocalWorkItem(prev => ({ ...prev, assignees: newAssignees, assignee: newPrimary }));
  };

  const handleSetPrimary = (user: User) => {
      setLocalWorkItem(prev => ({ ...prev, assignee: user }));
  };

  const handleSprintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sprintId = e.target.value;
    setLocalWorkItem(prev => ({
        ...prev,
        sprintId: sprintId || undefined,
        sprintBinding: 'manual', // EP-SSR-01: Manual change sets binding to manual
    }));
  };

  const handleToggleBinding = () => {
    const newBinding = localWorkItem.sprintBinding === 'manual' ? 'auto' : 'manual';
    setLocalWorkItem(prev => ({ ...prev, sprintBinding: newBinding }));
  };
  
  const handleGenerateSummary = async () => {
    if (!localWorkItem.title || !localWorkItem.description) {
      alert(t('workItemEditor_alert_summary_titleDesc'));
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummary(localWorkItem.title, localWorkItem.description);
      setLocalWorkItem(prev => ({ ...prev, summary }));
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert(t('workItemEditor_alert_summary_fail'));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

    const handleSelectEpic = (epic?: Epic) => {
        setLocalWorkItem(prev => ({ ...prev, epicId: epic?.id, epicInfo: epic ? { id: epic.id, name: epic.name, color: epic.color } : undefined }));
    };

    const handleSelectTeam = (team?: Team) => {
        setLocalWorkItem(prev => ({ ...prev, teamId: team?.id, teamInfo: team ? { id: team.id, name: team.name } : undefined }));
    };
  
  const availableStatuses = isNew ? [Status.BACKLOG, Status.TODO] : [originalWorkItem.status, ...(WORKFLOW_RULES[originalWorkItem.status!] || [])];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onMouseDown={handleBackdropMouseDown}>
      <div ref={editorContainerRef} className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-2 border-b bg-white rounded-t-lg">
          <h2 className="text-base font-bold text-slate-800">
            {isNew ? t('createNewItem') : `${t('editing')} ${originalWorkItem.id}`}
          </h2>
          <button onClick={handleCancel} className="p-1 rounded-full hover:bg-slate-200">
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>
        
        <main className="flex-1 flex overflow-hidden p-2 gap-2">
          <div className="flex-[3] overflow-y-auto pe-2 space-y-3">
            <FieldWrapper icon={<TypeIcon className="w-4 h-4"/>} highlightKey="title">
                <input
                  type="text" name="title" value={localWorkItem.title || ''} onChange={handleChange}
                  placeholder={t('title')} required
                  className="w-full text-base font-semibold px-2 py-1 border-b-2 border-transparent focus:border-primary focus:outline-none bg-transparent text-slate-800 rounded"
                />
            </FieldWrapper>

            <FieldWrapper icon={<FileTextIcon className="w-4 h-4"/>} highlightKey="summary">
              <div>
                <textarea
                    name="summary" value={localWorkItem.summary || ''} onChange={handleChange}
                    placeholder={t('summaryPlaceholder')} rows={2}
                    className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary}
                    className="mt-1 text-xs text-primary hover:underline disabled:text-slate-400">
                    {isGeneratingSummary ? t('workItemEditor_generating') : t('generateSummary')}
                </button>
              </div>
            </FieldWrapper>
            
            <RichTextEditor
                value={localWorkItem.description_rich || localWorkItem.description || ''}
                onChange={handleDescriptionChange}
                onValidityChange={setIsDescriptionOverLimit}
            />
            
            <FieldWrapper icon={<CheckSquareIcon className="w-4 h-4"/>} highlightKey="checklist">
              <ChecklistInput items={localWorkItem.checklist || []} onChange={(items) => setLocalWorkItem(prev => ({...prev, checklist: items}))} />
            </FieldWrapper>

             <FieldWrapper icon={<PaperclipIcon className="w-4 h-4"/>} highlightKey="attachments">
              <AttachmentsManager attachments={localWorkItem.attachments || []} onChange={(atts) => setLocalWorkItem(prev => ({...prev, attachments: atts}))} />
            </FieldWrapper>
            
          </div>
          
          <div className="flex-1 overflow-y-auto pe-2 space-y-2.5 bg-white/50 p-2 rounded-lg">
            
            <SideFieldWrapper label={t('status')} highlightKey="status">
              <SelectWithIcon icon={<LayoutKanbanIcon className="w-4 h-4" />} name="status" value={localWorkItem.status || ''} onChange={handleChange}>
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('assignee')} highlightKey="assignee">
              <div ref={assigneeDropdownRef} className="relative">
                <div className="flex flex-wrap gap-1 p-1.5 border border-slate-300 rounded-lg bg-white min-h-[34px] items-center">
                  {(localWorkItem.assignees || []).map(user => (
                    <AssigneeChip
                      key={user.id}
                      user={user}
                      isPrimary={user.id === localWorkItem.assignee?.id}
                      onRemove={() => handleRemoveAssignee(user.id)}
                      onSetPrimary={() => handleSetPrimary(user)}
                    />
                  ))}
                  <input
                    type="text"
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                    onFocus={() => setIsAssigneeDropdownOpen(true)}
                    placeholder={t('searchOrAddAssignee')}
                    className="flex-grow text-sm focus:outline-none min-w-[100px] p-1 placeholder-slate-500"
                  />
                </div>
                {isAssigneeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto text-start">
                    <ul>
                      {availableAssignees.map(user => (
                        <li key={user.id} onClick={() => handleAddAssignee(user)} className="px-3 py-2 text-sm text-slate-900 cursor-pointer hover:bg-gray-100 flex items-center gap-2">
                          <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
                          <span>{user.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('reporter')} highlightKey="reporter">
              <UserSelect icon={<UserRoundIcon className="w-4 h-4" />} selectedUser={localWorkItem.reporter} onChange={(userId) => handleUserChange('reporter', userId)} highlightKey="reporter" disabled={!isNew} users={boardUsers} />
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('type')} highlightKey="type">
              <SelectWithIcon icon={<ClipboardCheckIcon className="w-4 h-4" />} name="type" value={localWorkItem.type || ''} onChange={handleChange}>
                  {WORK_ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>

            {(localWorkItem.type === WorkItemType.TASK || localWorkItem.type === WorkItemType.BUG_MINOR || localWorkItem.type === WorkItemType.BUG_URGENT) && (
                 <SideFieldWrapper label={t('parentStory')} highlightKey="parentStory">
                    <SelectWithIcon icon={<FileTextIcon className="w-4 h-4"/>} name="parentId" value={localWorkItem.parentId || ''} onChange={handleChange}>
                        <option value="">{t('noParentStory')}</option>
                        {parentStories.map(story => <option key={story.id} value={story.id}>{story.title}</option>)}
                    </SelectWithIcon>
                </SideFieldWrapper>
            )}

            <SideFieldWrapper label={t('priority')} highlightKey="priority">
              <SelectWithIcon icon={<FlagIcon className="w-4 h-4" />} name="priority" value={localWorkItem.priority || ''} onChange={handleChange}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('teams')} highlightKey="teamId">
              <SelectWithIcon icon={<UsersRoundIcon className="w-4 h-4" />} name="teamId" value={localWorkItem.teamId || ''} onChange={e => handleSelectTeam(teams.find(t => t.id === e.target.value))}>
                  <option value="">{t('noTeam')}</option>
                  {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('epic')} highlightKey="epicId">
              <SelectWithIcon icon={<MountainIcon className="w-4 h-4" />} name="epicId" value={localWorkItem.epicId || ''} onChange={e => handleSelectEpic(epics.find(epic => epic.id === e.target.value))}>
                   <option value="">{t('noEpic')}</option>
                  {epics.map(item => <option key={item.id} value={item.id}>[{item.id}] {item.name}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>

            <SideFieldWrapper label={t('sprint')} highlightKey="sprint">
                <div className="flex items-center gap-2">
                   <SelectWithIcon className="flex-grow" icon={<MilestoneIcon className="w-4 h-4" />} name="sprintId" value={localWorkItem.sprintId || ''} onChange={handleSprintChange}>
                        <option value="">{t('noSprint')}</option>
                        {selectableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </SelectWithIcon>
                  <button
                    type="button"
                    onClick={handleToggleBinding}
                    title={localWorkItem.sprintBinding === 'manual' ? 'Unpin to allow auto-assignment by epic' : 'Pin to prevent auto-assignment'}
                    className="p-2 rounded-lg hover:bg-slate-200"
                  >
                    {localWorkItem.sprintBinding === 'manual' 
                        ? <LockClosedIcon className="w-5 h-5 text-slate-600" /> 
                        : <GitBranchIcon className="w-5 h-5 text-blue-600" />}
                  </button>
                </div>
            </SideFieldWrapper>
            
            <SideFieldWrapper label="Branch Info" highlightKey="branch">
                <div className="p-2 border rounded-md space-y-2 bg-slate-100/50">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="branchRequired" checked={!!localWorkItem.branchRequired} onChange={e => setLocalWorkItem(p => ({...p, branchRequired: e.target.checked}))} />
                        {t('branchRequired')}
                    </label>
                    <input 
                        type="text" 
                        name="branchName" 
                        value={localWorkItem.branchName || ''} 
                        onChange={handleChange} 
                        placeholder={t('branchName')} 
                        disabled={!localWorkItem.branchRequired} 
                        className="w-full text-sm ps-2 pe-2 py-1.5 min-h-[34px] bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-200" 
                    />
                </div>
            </SideFieldWrapper>

            <SideFieldWrapper label={t('stack')} highlightKey="stack">
               <SelectWithIcon icon={<BoxesIcon className="w-4 h-4" />} name="stack" value={localWorkItem.stack || ''} onChange={handleChange}>
                  {STACKS.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectWithIcon>
            </SideFieldWrapper>

            <SideFieldWrapper label={t('dueDate')} highlightKey="dueDate">
              <div className="relative">
                  <DateField 
                      value={localWorkItem.dueDate || null}
                      onChange={(date) => setLocalWorkItem(prev => ({ ...prev, dueDate: date || '' }))}
                      minDate={new Date()}
                  />
              </div>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('estimationPoints')} highlightKey="estimationPoints">
              <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none text-slate-500"><TimerIcon className="w-4 h-4" /></div>
                  <input type="number" name="estimationPoints" value={localWorkItem.estimationPoints ?? ''} onChange={handleChange} className="w-full text-sm ps-9 pe-3 py-1.5 min-h-[34px] bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </SideFieldWrapper>
            
            <SideFieldWrapper label={t('labels')} highlightKey="labels">
              <LabelInput labels={localWorkItem.labels || []} onChange={(labels) => setLocalWorkItem(prev => ({...prev, labels }))} />
            </SideFieldWrapper>
            
          </div>
        </main>
        
        <footer className="p-2 border-t bg-slate-100 flex justify-end gap-2 rounded-b-lg">
          <button onClick={handleCancel} className="py-1.5 px-3 border border-slate-400 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-200">{t('cancel')}</button>
          <button onClick={handleSave} disabled={!hasChanges || isDescriptionOverLimit} className="py-1.5 px-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-[#3a5a58] disabled:bg-slate-400 disabled:cursor-not-allowed">{t('saveChanges')}</button>
        </footer>
      </div>
      
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="bg-white p-6 rounded-lg shadow-xl text-center" onMouseDown={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2 text-slate-800">{t('discardChangesTitle')}</h3>
                <p className="mb-4 text-slate-700">{t('discardChangesBody')}</p>
                <div className="flex justify-center gap-3">
                    <button onClick={handleConfirmDiscard} className="bg-red-600 text-white px-4 py-2 rounded-lg">{t('yesDiscard')}</button>
                    <button onClick={handleKeepEditing} className="bg-slate-200 px-4 py-2 rounded-lg text-slate-800">{t('noKeepEditing')}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};