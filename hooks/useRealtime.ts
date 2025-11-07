import { useState, useEffect, useRef } from 'react';
import { WorkItem, User, ItemUpdateEvent, ConnectionStatus, Status } from '../types';

export const useRealtime = (
    isEnabled: boolean,
    workItems: WorkItem[],
    currentUser: User | null,
    onMessage: (message: ItemUpdateEvent) => void
) => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
    
    useEffect(() => {
        if (isEnabled && currentUser) {
            setConnectionStatus('CONNECTING');
            
            const connectTimeout = setTimeout(() => {
                setConnectionStatus('CONNECTED');
            }, 1500);

            return () => {
                clearTimeout(connectTimeout);
                setConnectionStatus('DISCONNECTED');
            };
        } else {
            setConnectionStatus('DISCONNECTED');
        }
    }, [isEnabled, currentUser, onMessage]);

    return { connectionStatus };
};