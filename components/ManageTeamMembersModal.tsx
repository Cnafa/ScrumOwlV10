// components/ManageTeamMembersModal.tsx
import React, { useState, useMemo } from 'react';
import { Team, User } from '../types';
import { XMarkIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface ManageTeamMembersModalProps {
    team: Team;
    onSave: (teamId: string, memberIds: string[]) => void;
    onClose: () => void;
    allMembers: User[];
}

const UserListItem: React.FC<{ user: User, onAction: () => void, actionIcon: React.ReactNode }> = ({ user, onAction, actionIcon }) => (
    <li className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
        <div className="flex items-center gap-2">
            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full"/>
            <span className="text-sm">{user.name}</span>
        </div>
        <button onClick={onAction} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
            {actionIcon}
        </button>
    </li>
);

export const ManageTeamMembersModal: React.FC<ManageTeamMembersModalProps> = ({ team, onSave, onClose, allMembers }) => {
    const { t } = useLocale();
    const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(new Set(team.members));
    const [search, setSearch] = useState('');

    const { teamMembers, availableMembers } = useMemo(() => {
        const lowercasedSearch = search.toLowerCase();
        const filteredMembers = allMembers.filter(m => m.name.toLowerCase().includes(lowercasedSearch));

        const teamMembers = filteredMembers.filter(m => teamMemberIds.has(m.id));
        const availableMembers = filteredMembers.filter(m => !teamMemberIds.has(m.id));
        
        return { teamMembers, availableMembers };

    }, [allMembers, teamMemberIds, search]);

    const addMember = (userId: string) => {
        setTeamMemberIds(prev => new Set(prev).add(userId));
    };

    const removeMember = (userId: string) => {
        setTeamMemberIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };
    
    const handleSave = () => {
        onSave(team.id, Array.from(teamMemberIds));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('manageMembers_title').replace('{teamName}', '')} <span className="text-[#486966]">{team.name}</span></h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                    </button>
                </header>
                <main className="p-6 flex-1 overflow-hidden grid grid-cols-2 gap-4">
                    {/* Available Members */}
                    <div className="flex flex-col border rounded-md">
                         <h3 className="p-3 text-sm font-semibold border-b">{t('manageMembers_boardMembers')}</h3>
                         <div className="p-2">
                            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('manageMembers_search')} className="w-full px-2 py-1 border rounded" />
                         </div>
                         <ul className="flex-1 overflow-y-auto p-2">
                            {availableMembers.map(user => (
                                <UserListItem 
                                    key={user.id}
                                    user={user}
                                    onAction={() => addMember(user.id)}
                                    actionIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                />
                            ))}
                         </ul>
                    </div>
                     {/* Team Members */}
                    <div className="flex flex-col border rounded-md">
                         <h3 className="p-3 text-sm font-semibold border-b">{t('manageMembers_teamMembers').replace('{count}', teamMembers.length.toString())}</h3>
                         <div className="p-2">
                            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('manageMembers_search')} className="w-full px-2 py-1 border rounded" />
                         </div>
                         <ul className="flex-1 overflow-y-auto p-2">
                            {teamMembers.map(user => (
                                <UserListItem 
                                    key={user.id}
                                    user={user}
                                    onAction={() => removeMember(user.id)}
                                    actionIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                />
                            ))}
                         </ul>
                    </div>
                </main>
                <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]">{t('saveChanges')}</button>
                </footer>
            </div>
        </div>
    );
};