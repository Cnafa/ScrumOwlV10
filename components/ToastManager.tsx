// components/ToastManager.tsx
import React from 'react';
import { ToastNotification } from '../types';
import { ToastItem } from './ToastItem';

const MAX_TOASTS = 3;

interface ToastManagerProps {
    toasts: ToastNotification[];
    onDismiss: (id: string) => void;
    onOpen: (itemId: string, highlightSection?: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onDismiss, onOpen }) => {
    const activeToasts = toasts.slice(0, MAX_TOASTS);

    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed bottom-0 end-0 p-4 space-y-3 w-full max-w-sm z-[100]"
        >
            {activeToasts.map((toast, index) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={onDismiss}
                    onOpen={onOpen}
                    style={{ zIndex: 100 - index }}
                />
            ))}
        </div>
    );
};