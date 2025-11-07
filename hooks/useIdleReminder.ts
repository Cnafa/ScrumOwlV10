import { useEffect, useRef, useState } from 'react';

// Custom hook to show an idle reminder toast
export const useIdleReminder = (
    isActive: boolean,
    onSave: () => void,
    isGloballyEnabled: boolean,
    timeout: number = 120000 // 120 seconds
) => {
    const idleTimer = useRef<number | null>(null);
    const [isIdle, setIsIdle] = useState(false);

    const resetTimer = () => {
        if (idleTimer.current) {
            clearTimeout(idleTimer.current);
        }
        idleTimer.current = window.setTimeout(() => {
            setIsIdle(true);
        }, timeout);
    };

    const handleContinue = () => {
        setIsIdle(false);
        resetTimer();
    };

    const handleSave = () => {
        onSave();
        setIsIdle(false);
    };

    const handleIgnore = () => {
        setIsIdle(false);
        // Optionally, you could mute for 10 minutes here
    };

    useEffect(() => {
        if (isActive && isGloballyEnabled) {
            const events = ['mousemove', 'keydown', 'mousedown'];
            
            const eventListener = () => {
                resetTimer();
                // If the toast is showing and user becomes active, dismiss it
                if (isIdle) {
                    setIsIdle(false);
                }
            };
            
            events.forEach(event => window.addEventListener(event, eventListener));
            resetTimer();

            return () => {
                if (idleTimer.current) {
                    clearTimeout(idleTimer.current);
                }
                events.forEach(event => window.removeEventListener(event, eventListener));
            };
        } else {
            setIsIdle(false);
            if(idleTimer.current) clearTimeout(idleTimer.current);
        }
    }, [isActive, isGloballyEnabled, isIdle, timeout]);

    return { isIdle, handleContinue, handleSave, handleIgnore };
};