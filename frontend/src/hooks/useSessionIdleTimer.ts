import { useEffect, useRef } from 'react';

const SEVEN_HOURS = 7 * 60 * 60 * 1000;
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

export const useSessionIdleTimer = (
    isActive: boolean,
    onIdleWarning: () => void,
    onIdleLogout: () => void,
) => {
    const warningTimer = useRef<number | null>(null);
    const logoutTimer = useRef<number | null>(null);

    const resetTimers = () => {
        if (warningTimer.current) clearTimeout(warningTimer.current);
        if (logoutTimer.current) clearTimeout(logoutTimer.current);

        warningTimer.current = window.setTimeout(onIdleWarning, SEVEN_HOURS);
        logoutTimer.current = window.setTimeout(onIdleLogout, EIGHT_HOURS);
    };

    useEffect(() => {
        if (!isActive) {
            if (warningTimer.current) clearTimeout(warningTimer.current);
            if (logoutTimer.current) clearTimeout(logoutTimer.current);
            return;
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        const eventListener = () => {
            resetTimers();
        };

        events.forEach(event => window.addEventListener(event, eventListener));
        resetTimers();

        return () => {
            if (warningTimer.current) clearTimeout(warningTimer.current);
            if (logoutTimer.current) clearTimeout(logoutTimer.current);
            events.forEach(event => window.removeEventListener(event, eventListener));
        };
    }, [isActive, onIdleWarning, onIdleLogout]);
};
