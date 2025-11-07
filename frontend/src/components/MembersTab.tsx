// components/MembersTab.tsx
import React from 'react';
import { useBoard } from '../context/BoardContext';
import { BoardMember, Role } from '../types';
import { useLocale } from '../context/LocaleContext';

interface MembersTabProps {
    boardMembers: BoardMember[];
    onUpdateRole: (userId: string, roleId: string) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({ boardMembers, onUpdateRole }) => {
    const { roles, can } = useBoard();
    const { t } = useLocale();
    const canManageMembers = can('member.manage');

    const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || t('membersTab_unknownRole');
    
    const editableRoles = roles.filter(r => r.name !== 'Scrum Master');

    const handleRoleChange = (userId: string, newRoleId: string) => {
        // Last admin check
        const admins = boardMembers.filter(m => {
            const role = roles.find(r => r.id === m.roleId);
            return role?.name === 'Scrum Master';
        });

        if (admins.length === 1 && admins[0].user.id === userId) {
            const newRole = roles.find(r => r.id === newRoleId);
            if (newRole?.name !== 'Scrum Master') {
                alert(t('membersTab_error_lastAdmin'));
                return;
            }
        }
        
        onUpdateRole(userId, newRoleId);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t('membersTab_title')}</h3>
                <div className="text-right">
                    <button disabled className="py-2 px-4 text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed">
                        {t('membersTab_invite_button')}
                    </button>
                     <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: t('membersTab_invite_desc') }} />
                </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('membersTab_header_name')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('membersTab_header_email')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('membersTab_header_role')}</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('actions')}</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {boardMembers.map(({ user, roleId }) => {
                        const isScrumMaster = getRoleName(roleId) === 'Scrum Master';
                        return (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {canManageMembers && !isScrumMaster ? (
                                    <select
                                        value={roleId}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="w-full p-1 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {editableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                ) : (
                                    getRoleName(roleId)
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {/* Actions like remove could go here */}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};