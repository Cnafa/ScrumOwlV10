// components/DeleteSprintModal.tsx
import React, { useState, useMemo } from 'react';
import { Sprint, SprintState } from '../types';
import { XMarkIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface DeleteSprintModalProps {
    sprint: Sprint;
    sprints: Sprint[];
    onClose: () => void;
    onConfirm: (sprintId: string, itemAction: 'unassign' | 'move', targetSprintId?: string) => void;
}

export const DeleteSprintModal: React.FC<DeleteSprintModalProps> = ({ sprint, sprints, onClose, onConfirm }) => {
    const { t } = useLocale();
    const [confirmation, setConfirmation] = useState('');
    const [itemAction, setItemAction] = useState<'unassign' | 'move'>('unassign');
    const [targetSprintId, setTargetSprintId] = useState<string>('');

    const movableSprints = useMemo(() => 
        sprints.filter(s => s.id !== sprint.id && (s.state === SprintState.ACTIVE || s.state === SprintState.PLANNED)),
    [sprints, sprint.id]);

    const isConfirmed = confirmation === sprint.name;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConfirmed) {
            onConfirm(sprint.id, itemAction, targetSprintId);
        }
    };
    
    // Set default target sprint if move is selected and list is not empty
    useState(() => {
        if(movableSprints.length > 0) {
            setTargetSprintId(movableSprints[0].id);
        }
    });

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-sprint-title" aria-describedby="delete-sprint-desc" className="fixed inset-0 bg-black bg-opacity-60 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 id="delete-sprint-title" className="text-xl font-bold text-red-700">{t('deleteSprint_title')}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p id="delete-sprint-desc" dangerouslySetInnerHTML={{ __html: t('deleteSprint_body').replace('{sprintName}', sprint.name) }} />
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md space-y-2">
                         <label className="flex items-center gap-2">
                            <input type="radio" name="itemAction" value="unassign" checked={itemAction === 'unassign'} onChange={() => setItemAction('unassign')} className="h-4 w-4 text-[#486966] focus:ring-[#486966]" />
                            <span className="text-sm">{t('deleteSprint_items_action_unassign')}</span>
                        </label>
                         <label className="flex items-center gap-2">
                            <input type="radio" name="itemAction" value="move" checked={itemAction === 'move'} onChange={() => setItemAction('move')} disabled={movableSprints.length === 0} className="h-4 w-4 text-[#486966] focus:ring-[#486966]" />
                            <span className={`text-sm ${movableSprints.length === 0 ? 'text-gray-400' : ''}`}>{t('deleteSprint_items_action_move')}</span>
                        </label>
                        {itemAction === 'move' && (
                            <select value={targetSprintId} onChange={e => setTargetSprintId(e.target.value)} className="w-full mt-1 ml-6 p-1 border rounded-md text-sm">
                                {movableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                     <div>
                        <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
                           {t('deleteSprint_confirm_label').replace('{sprintName}', '')} <span className="font-mono text-sm">{sprint.name}</span>
                        </label>
                        <input
                            type="text"
                            id="confirmation"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            className="w-full mt-1 px-3 py-2 h-10 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </main>
                <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md">{t('cancel')}</button>
                    <button type="submit" disabled={!isConfirmed || (itemAction === 'move' && !targetSprintId)} className="py-2 px-4 bg-red-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {t('deleteSprint_confirm_button')}
                    </button>
                </footer>
            </form>
        </div>
    );
};