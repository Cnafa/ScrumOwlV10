import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface QuickSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({ isOpen, onClose }) => {
    const { t } = useLocale();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 pt-20" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full p-4 border-b focus:outline-none"
                    autoFocus
                />
                <div className="p-4 text-center text-gray-500">
                    Quick switcher results would appear here.
                </div>
            </div>
        </div>
    );
};
