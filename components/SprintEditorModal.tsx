
// components/SprintEditorModal.tsx
import React, { useState, useMemo } from 'react';
import { Sprint, Epic, EpicStatus } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon } from './icons';
import { DateField } from './DateField';

interface SprintEditorModalProps {
    sprint: Partial<Sprint>;
    allEpics: Epic[];
    onSave: (sprint: Partial<Sprint>) => void;
    onClose: () => void;
    readOnly?: boolean;
}

const EpicListItem: React.FC<{ epic: Epic, onAction: () => void, actionIcon: React.ReactNode, disabled?: boolean }> = ({ epic, onAction, actionIcon, disabled }) => {
    const { t } = useLocale();
    return (
        <li className={`flex items-center justify-between p-2 rounded ${disabled ? 'opacity-60' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-4 rounded-full flex-shrink-0" style={{backgroundColor: epic.color}} />
                <div className="flex-1 truncate">
                    <p className="text-sm truncate text-slate-800" title={epic.name}>{epic.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-bold">ICE: {(epic.iceScore || 0).toFixed(1)}</span>
                        <span>|</span>
                        <span>{t('open_items_stat').replace('{count}', (epic.openItemsCount || 0).toString())}</span>
                        <span>|</span>
                        <span>{t('total_est_stat').replace('{sum}', (epic.totalEstimation || 0).toString())}</span>
                    </div>
                </div>
            </div>
            {!disabled && (
                <button type="button" onClick={onAction} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
                    {actionIcon}
                </button>
            )}
        </li>
    );
};

export const SprintEditorModal: React.FC<SprintEditorModalProps> = ({ sprint, allEpics, onSave, onClose, readOnly = false }) => {
    const { t } = useLocale();
    const [localSprint, setLocalSprint] = useState<Partial<Sprint>>(sprint);
    const [assignedEpicIds, setAssignedEpicIds] = useState<Set<string>>(new Set(sprint.epicIds || []));
    const [search, setSearch] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [nameError, setNameError] = useState('');
    const [dateError, setDateError] = useState('');

    const { availableEpics, assignedEpics } = useMemo(() => {
        const lowercasedSearch = search.toLowerCase();
        
        const relevantEpics = allEpics.filter(e => {
            const isArchived = e.status === EpicStatus.ARCHIVED;
            const isDeleted = e.status === EpicStatus.DELETED;
            const isDone = e.status === EpicStatus.DONE;
            if (isArchived || isDeleted) return false;
            if (isDone && !showCompleted) return false;
            return e.name.toLowerCase().includes(lowercasedSearch);
        });

        const available = relevantEpics
            .filter(e => !assignedEpicIds.has(e.id))
            .sort((a, b) => (b.iceScore || 0) - (a.iceScore || 0));

        const assigned = allEpics.filter(e => assignedEpicIds.has(e.id) && e.name.toLowerCase().includes(lowercasedSearch));
        
        return {
            availableEpics: available,
            assignedEpics: assigned,
        };
    }, [allEpics, assignedEpicIds, search, showCompleted]);

    const addEpic = (epicId: string) => setAssignedEpicIds(prev => new Set(prev).add(epicId));
    const removeEpic = (epicId: string) => {
        const newSet = new Set(assignedEpicIds);
        newSet.delete(epicId);
        setAssignedEpicIds(newSet);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setNameError('');
        }
        setLocalSprint(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (field: 'startAt' | 'endAt', value: string | null) => {
        setDateError('');
        const newSprint = { ...localSprint, [field]: value };

        // Validation logic
        if (newSprint.startAt && newSprint.endAt) {
            const start = new Date(newSprint.startAt);
            const end = new Date(newSprint.endAt);
            if (end <= start) {
                setDateError('End date must be after the start date.');
            }
        }
        setLocalSprint(newSprint);
    };

    const handleSave = () => {
        if (!localSprint.name?.trim()) {
            setNameError("Sprint name cannot be empty.");
            return;
        }
        if (dateError) return;
        onSave({ ...localSprint, epicIds: Array.from(assignedEpicIds) });
    };

    const minEndDate = useMemo(() => {
        if (!localSprint.startAt) return undefined;
        const start = new Date(localSprint.startAt);
        start.setDate(start.getDate() + 1); // must be at least one day after
        return start;
    }, [localSprint.startAt]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{sprint.id ? (readOnly ? t('sprintEditor_viewTitle').replace('{sprintName}', sprint.name!) : t('sprintEditor_editTitle').replace('{sprintName}', sprint.name!)) : t('newSprint')}</h2>
                    <button type="button" onClick={onClose}><XMarkIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Sprint Details Form */}
                    <div className="space-y-4 overflow-y-auto pr-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[#486966] mb-1">{t('sprintName')}</label>
                            <input type="text" id="name" name="name" value={localSprint.name || ''} onChange={handleChange} required disabled={readOnly} className={`w-full px-3 py-2 h-10 bg-white border rounded-md text-slate-900 ${nameError ? 'border-red-500 ring-1 ring-red-500' : 'border-[#B2BEBF] focus:ring-2 focus:ring-[#486966]'} disabled:bg-gray-100 disabled:cursor-not-allowed`} />
                            {nameError && <p className="text-red-600 text-xs mt-1">{t('sprintEditor_error_nameEmpty')}</p>}
                        </div>
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-[#486966] mb-1">{t('sprintEditor_goal_optional')}</label>
                            <textarea id="goal" name="goal" value={localSprint.goal || ''} onChange={handleChange} rows={3} disabled={readOnly} className="w-full px-3 py-2 bg-white border border-[#B2BEBF] rounded-md text-slate-900 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startAt" className="block text-sm font-medium text-[#486966] mb-1">{t('startDate')}</label>
                                <DateField value={localSprint.startAt!} onChange={(date) => handleDateChange('startAt', date)} disabled={readOnly} />
                            </div>
                            <div>
                                <label htmlFor="endAt" className="block text-sm font-medium text-[#486966] mb-1">{t('endDate')}</label>
                                <DateField value={localSprint.endAt!} onChange={(date) => handleDateChange('endAt', date)} minDate={minEndDate} disabled={readOnly} />
                            </div>
                        </div>
                        {dateError && <p className="text-red-600 text-xs -mt-2 col-span-2">{t('sprintEditor_error_endDate')}</p>}

                        <div className="!mt-8">
                             <h3 className="text-lg font-semibold border-b pb-2 text-[#3B3936]">{t('assignEpics')}</h3>
                        </div>
                    </div>
                    {/* Epic Assignment */}
                    <div className="flex flex-col border rounded-md overflow-hidden">
                        <div className="p-2 border-b flex items-center gap-4">
                            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('sprintEditor_searchEpics')} disabled={readOnly} className="w-full px-2 py-1 border rounded text-slate-900 disabled:bg-gray-100" />
                             <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} disabled={readOnly} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                                {t('show_completed_epics')}
                            </label>
                        </div>
                        <div className="flex-1 grid grid-rows-2 overflow-hidden">
                            <div className="flex flex-col row-span-1 overflow-hidden">
                                <h4 className="p-3 text-sm font-semibold border-b">{t('availableEpics')} ({availableEpics.length})</h4>
                                <ul className="flex-1 overflow-y-auto p-2">
                                    {availableEpics.map(epic => (
                                        <EpicListItem key={epic.id} epic={epic} onAction={() => addEpic(epic.id)} 
                                            disabled={epic.status === EpicStatus.DONE || readOnly}
                                            actionIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        />
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col row-span-1 overflow-hidden border-t">
                                <h4 className="p-3 text-sm font-semibold border-b">{t('assignedEpics')} ({assignedEpics.length})</h4>
                                <ul className="flex-1 overflow-y-auto p-2">
                                    {assignedEpics.map(epic => (
                                         <EpicListItem key={epic.id} epic={epic} onAction={() => removeEpic(epic.id)}
                                            disabled={readOnly}
                                            actionIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        />
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    {readOnly ? (
                         <button type="button" onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('close')}</button>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('cancel')}</button>
                            <button type="button" onClick={handleSave} disabled={!!dateError || !!nameError} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58] disabled:bg-gray-400">{t('save')}</button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};
