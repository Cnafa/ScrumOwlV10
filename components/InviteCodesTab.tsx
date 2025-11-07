// components/InviteCodesTab.tsx
import React, { useState } from 'react';
import CreateInviteModal from './CreateInviteModal';
import { InviteCode } from '../types';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

interface InviteCodesTabProps {
    codes: InviteCode[];
    onCreate: (invite: Omit<InviteCode, 'code' | 'createdBy' | 'createdAt' | 'uses'>) => void;
    onRevoke: (code: string) => void;
}

export const InviteCodesTab: React.FC<InviteCodesTabProps> = ({ codes, onCreate, onRevoke }) => {
    const { t } = useLocale();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { roles } = useBoard();
    const { user } = useAuth();

    const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown';
    const getCreatorName = (userId: string) => user?.id === userId ? user.name : 'Another Admin';

    const handleCopy = (code: string) => {
        const joinUrl = `${window.location.origin}/join/${code}`;
        navigator.clipboard.writeText(joinUrl);
        // In a real app, you'd show a toast notification here.
        alert(t('inviteCodes_copied').replace('{url}', joinUrl));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t('inviteCodes_title')}</h3>
                <button onClick={() => setIsCreateModalOpen(true)} className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                    {t('inviteCodes_create_button')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inviteCodes_header_code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inviteCodes_header_role')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inviteCodes_header_uses')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inviteCodes_header_expires')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inviteCodes_header_createdBy')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {codes.map(invite => (
                            <tr key={invite.code}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-800">{invite.code}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getRoleName(invite.roleId)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{invite.uses}/{invite.maxUses || '∞'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : t('inviteCodes_neverExpires')}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getCreatorName(invite.createdBy)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3">
                                    <button onClick={() => handleCopy(invite.code)} className="text-indigo-600 hover:text-indigo-900">{t('inviteCodes_action_copy')}</button>
                                    <button onClick={() => onRevoke(invite.code)} className="text-red-600 hover:text-red-900">{t('inviteCodes_action_revoke')}</button>
                                </td>
                            </tr>
                        ))}
                         {codes.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-sm text-gray-500">{t('inviteCodes_empty')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {isCreateModalOpen && <CreateInviteModal roles={roles.filter(r => r.name !== 'Owner')} onCreate={onCreate} onClose={() => setIsCreateModalOpen(false)} />}
        </div>
    );
};