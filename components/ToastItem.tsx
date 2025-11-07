// components/ToastItem.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ToastNotification } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon } from './icons';

interface ToastItemProps {
    toast: ToastNotification;
    onDismiss: (id: string) => void;
    onOpen: (itemId: string, highlightSection?: string) => void;
    style?: React.CSSProperties;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, onOpen, style }) => {
    const { t } = useLocale();
    const timerRef = useRef<number | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleDismiss = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onDismiss(toast.id);
    };
    
    const handleOpen = () => {
        if (toast.itemId) {
            onOpen(toast.itemId, toast.highlightSection);
        }
        handleDismiss();
    };

    const handleUndo = () => {
        if(toast.undoAction) {
            toast.undoAction();
        }
        handleDismiss();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'o' && toast.itemId) {
                handleOpen();
            } else if (e.key === 'Escape') {
                handleDismiss();
            }
        };

        const toastElement = document.getElementById(toast.id);
        toastElement?.addEventListener('keydown', handleKeyDown);

        return () => {
            toastElement?.removeEventListener('keydown', handleKeyDown);
        };
    }, [toast.id, handleOpen, handleDismiss]);

    useEffect(() => {
        if (!isHovered) {
            timerRef.current = window.setTimeout(() => {
                handleDismiss();
            }, 8000); // EP-DEL-001: Increased to 8 seconds for Undo
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [toast.id, isHovered]);

    return (
        <div
            id={toast.id}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full bg-white rounded-lg shadow-lg p-4 border border-gray-200 flex items-start gap-3"
            role="status"
            aria-atomic="true"
        >
            <div className="flex-1 min-w-0">
                <p 
                    className="font-semibold text-gray-800 text-left truncate w-full"
                    title={toast.title}
                >
                    {toast.title}
                </p>
                {toast.changes.length > 0 && (
                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                        {toast.changes.map((change, index) => (
                            <li key={index}>{change}</li>
                        ))}
                    </ul>
                )}
                <div className="mt-3 flex gap-2">
                    {toast.undoAction ? (
                        <button
                            onClick={handleUndo}
                            className="text-xs font-bold text-white bg-[#486966] hover:bg-[#3a5a58] px-3 py-1 rounded-md"
                        >
                            {t('toast_undo')}
                        </button>
                    ) : toast.itemId ? (
                        <button
                            onClick={handleOpen}
                            className="text-xs font-bold text-white bg-[#486966] hover:bg-[#3a5a58] px-3 py-1 rounded-md"
                        >
                            {t('toast_open')} (O)
                        </button>
                    ) : null}
                    <button
                        onClick={handleDismiss}
                        className="text-xs font-semibold text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-md"
                    >
                        {t('toast_dismiss')}
                    </button>
                </div>
            </div>
             <button
                onClick={handleDismiss}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                aria-label={t('toast_dismiss')}
             >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};