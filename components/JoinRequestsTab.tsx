// components/JoinRequestsTab.tsx
import React from 'react';
import { JoinRequest } from '../types';
import { useLocale } from '../context/LocaleContext';

interface JoinRequestsTabProps {
    requests: JoinRequest[];
    onApprove: (request: JoinRequest) => void;
    onReject: (request: JoinRequest) => void;
}

export const JoinRequestsTab: React.FC<JoinRequestsTabProps> = ({ requests, onApprove, onReject }) => {
    const { t } = useLocale();
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">{t('joinRequests_title').replace('{count}', requests.length.toString())}</h3>
             {requests.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {requests.map(req => (
                            <li key={req.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img className="h-8 w-8 rounded-full" src={req.user.avatarUrl} alt={req.user.name} />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-indigo-600 truncate">{req.user.name}</p>
                                            <p className="text-sm text-gray-500">{req.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex gap-2">
                                        <button onClick={() => onApprove(req)} className="px-3 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-800 hover:bg-green-200">{t('joinRequests_approve')}</button>
                                        <button onClick={() => onReject(req)} className="px-3 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-800 hover:bg-red-200">{t('joinRequests_reject')}</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-sm text-center text-gray-500 py-8">{t('joinRequests_empty')}</p>
            )}
        </div>
    );
};