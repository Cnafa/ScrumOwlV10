import React, { useState } from 'react';
import { useSettings, AppSettings } from '../context/SettingsContext';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon } from './icons';
import { useAuth } from '../context/AuthContext';

interface UserSettingsModalProps {
    onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ onClose }) => {
    const { settings, setSettings } = useSettings();
    const { t } = useLocale();
    const { user } = useAuth();
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setLocalSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setLocalSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = () => {
        setSettings(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('settings')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                    </button>
                </header>
                <main className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#3B3936]">{t('notificationEmail')}</label>
                        <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-100 rounded-md select-all">{user?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('notificationEmailDesc')}</p>
                    </div>

                    <hr />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="enableRealtime" className="text-sm font-medium text-[#3B3936]">{t('settingsEnableRealtime')}</label>
                            <input type="checkbox" id="enableRealtime" name="enableRealtime" checked={localSettings.enableRealtime} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="enableIdleReminder" className="text-sm font-medium text-[#3B3936]">{t('settingsEnableIdle')}</label>
                            <input type="checkbox" id="enableIdleReminder" name="enableIdleReminder" checked={localSettings.enableIdleReminder} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="enableFinishDraftReminder" className="text-sm font-medium text-[#3B3936]">{t('settingsEnableFinishDraft')}</label>
                            <input type="checkbox" id="enableFinishDraftReminder" name="enableFinishDraftReminder" checked={localSettings.enableFinishDraftReminder} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                        </div>
                    </div>
                </main>
                 <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-50">{t('cancel')}</button>
                    <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]">{t('save')}</button>
                 </footer>
            </div>
        </div>
    );
};