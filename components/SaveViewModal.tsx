import React, { useState, useEffect } from 'react';
import { SavedView, ViewVisibility, User } from '../types';
import { XMarkIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface SaveViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, visibility: ViewVisibility) => void;
    savedViews: SavedView[];
    currentUser: User | null;
}

export const SaveViewModal: React.FC<SaveViewModalProps> = ({ isOpen, onClose, onSave, savedViews, currentUser }) => {
    const { t } = useLocale();
    const [name, setName] = useState('');
    const [visibility, setVisibility] = useState<ViewVisibility>(ViewVisibility.PRIVATE);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset state when modal opens/closes
        if (!isOpen) {
            setName('');
            setVisibility(ViewVisibility.PRIVATE);
            setError(null);
        }
    }, [isOpen]);
    
    const handleSave = () => {
        if (!name.trim()) {
            setError('View name cannot be empty.');
            return;
        }
        if (currentUser) {
            const isDuplicate = savedViews.some(v => v.name.toLowerCase() === name.trim().toLowerCase() && v.ownerId === currentUser.id);
            if (isDuplicate) {
                setError(`A view named "${name}" already exists.`);
                return;
            }
        }
        onSave(name.trim(), visibility);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('saveView')}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="viewName" className="block text-sm font-medium text-[#486966] mb-1">{t('viewName')}</label>
                        <input
                            type="text"
                            id="viewName"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(null); }}
                            required
                            autoFocus
                            className={`w-full px-3 py-2 h-10 bg-white border rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-500' : 'border-[#B2BEBF] focus:ring-[#486966]'}`}
                        />
                         {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[#486966] mb-2">{t('visibility')}</label>
                        <div className="space-y-2">
                             <label className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="visibility" value={ViewVisibility.PRIVATE} checked={visibility === ViewVisibility.PRIVATE} onChange={() => setVisibility(ViewVisibility.PRIVATE)} className="h-4 w-4 text-[#486966] focus:ring-[#486966] border-gray-300"/>
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{t('private')}</span>
                                    <p className="text-xs text-gray-500">{t('visibilityPrivateDesc')}</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="visibility" value={ViewVisibility.GROUP} checked={visibility === ViewVisibility.GROUP} onChange={() => setVisibility(ViewVisibility.GROUP)} className="h-4 w-4 text-[#486966] focus:ring-[#486966] border-gray-300"/>
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{t('group')}</span>
                                    <p className="text-xs text-gray-500">{t('visibilityGroupDesc')}</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]">{t('save')}</button>
                </footer>
            </div>
        </div>
    );
};