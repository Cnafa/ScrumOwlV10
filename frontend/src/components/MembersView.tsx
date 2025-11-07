// components/MembersView.tsx
import React, { useState, useEffect } from 'react';
import { MembersTab } from './MembersTab';
import { JoinRequestsTab } from './JoinRequestsTab';
import { InviteCodesTab } from './InviteCodesTab';
import { TeamsTab } from './TeamsTab';
import { Team, InviteCode, JoinRequest, BoardMember } from '../types';
import { useBoard } from '../context/BoardContext';
import { useLocale } from '../context/LocaleContext';

type Tab = 'MEMBERS' | 'TEAMS' | 'JOIN_REQUESTS' | 'INVITE_CODES';

export const MembersView: React.FC = () => {
    const { activeBoardMembers, activeBoard } = useBoard();
    const { t } = useLocale();
    
    const [activeTab, setActiveTab] = useState<Tab>('MEMBERS');
    const [isLoading, setIsLoading] = useState(true);
    
    // Manage local state for admin data
    const [boardMembers, setBoardMembers] = useState<BoardMember[]>(activeBoardMembers);
    const [teams, setTeams] = useState<Team[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);

    useEffect(() => {
      setBoardMembers(activeBoardMembers);
    }, [activeBoardMembers]);

    // Data fetching
    useEffect(() => {
        if (!activeBoard) return;
        
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [teamsRes, joinRes, inviteRes] = await Promise.all([
                    // FIX: Cast `import.meta` to `any` to access Vite environment variables
                    fetch(`${(import.meta as any).env.VITE_API_URL}/teams/?project=${activeBoard.id}`),
                    fetch(`${(import.meta as any).env.VITE_API_URL}/join-requests/?project=${activeBoard.id}&status=PENDING`),
                    fetch(`${(import.meta as any).env.VITE_API_URL}/invite-codes/?project=${activeBoard.id}`)
                ]);
                
                if (!teamsRes.ok || !joinRes.ok || !inviteRes.ok) {
                    throw new Error('Failed to fetch data for members view');
                }

                const teamsData = await teamsRes.json();
                const joinData = await joinRes.json();
                const inviteData = await inviteRes.json();

                setTeams(teamsData.results || teamsData);
                setJoinRequests(joinData.results || joinData);
                setInviteCodes(inviteData.results || inviteData);

            } catch (error) {
                console.error("Failed to fetch members view data:", error);
                // In a real app, show a toast notification
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeBoard]);

    // API Handlers
    const handleUpdateRole = async (userId: string, roleId: string) => {
        const membership = boardMembers.find(m => m.user.id === userId);
        if (!membership) return;
        // In a real app, membership would have its own ID. We'll simulate finding it.
        // Let's assume the API can find the membership by user & project.
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/project-memberships/set-role/`, { // Fictional endpoint for this action
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project: activeBoard!.id, user: userId, role: roleId })
            });
            if (response.ok) {
                setBoardMembers(prev => prev.map(m => m.user.id === userId ? { ...m, roleId } : m));
            } else {
                 alert('Failed to update role.'); // Simple error handling
            }
        } catch (e) { console.error(e); }
    };
    
    const handleSaveTeam = async (teamToSave: Partial<Team>, memberIds: string[]) => {
        const isNew = !teamToSave.id;
        // FIX: Cast `import.meta` to `any` to access Vite environment variables
        const url = isNew ? `${(import.meta as any).env.VITE_API_URL}/teams/` : `${(import.meta as any).env.VITE_API_URL}/teams/${teamToSave.id}/`;
        const method = isNew ? 'POST' : 'PATCH';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...teamToSave, members: memberIds, project: activeBoard!.id })
            });
            if (response.ok) {
                const savedTeam = await response.json();
                if (isNew) {
                    setTeams(prev => [savedTeam, ...prev]);
                } else {
                    setTeams(prev => prev.map(t => t.id === savedTeam.id ? savedTeam : t));
                }
            }
        } catch (e) { console.error(e); }
    };
    
    const handleDeleteTeam = async (teamId: string) => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/teams/${teamId}/`, { method: 'DELETE' });
            if (response.status === 204) {
                 setTeams(prev => prev.filter(t => t.id !== teamId));
            }
        } catch(e) { console.error(e); }
    };
    
    const handleApproveRequest = async (request: JoinRequest) => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/join-requests/${request.id}/approve/`, { method: 'POST' });
             if (response.ok) {
                const newMembership = await response.json();
                setBoardMembers(prev => [...prev, newMembership]);
                setJoinRequests(prev => prev.filter(r => r.id !== request.id));
            }
        } catch(e) { console.error(e); }
    };

    const handleRejectRequest = async (request: JoinRequest) => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/join-requests/${request.id}/reject/`, { method: 'POST' });
             if (response.ok) {
                setJoinRequests(prev => prev.filter(r => r.id !== request.id));
            }
        } catch(e) { console.error(e); }
    };

    const handleCreateInvite = async (invite: Omit<InviteCode, 'code' | 'createdBy' | 'createdAt' | 'uses'>) => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/invite-codes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...invite, project: activeBoard!.id })
            });
            if (response.ok) {
                const newCode = await response.json();
                setInviteCodes(prev => [newCode, ...prev]);
            }
        } catch(e) { console.error(e); }
    };
    
    const handleRevokeInvite = async (code: string) => {
        try {
            // FIX: Cast `import.meta` to `any` to access Vite environment variables
            const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/invite-codes/${code}/`, { method: 'DELETE' });
            if (response.status === 204) {
                setInviteCodes(prev => prev.filter(c => c.code !== code));
            }
        } catch(e) { console.error(e); }
    };
    
    const renderTabContent = () => {
        if (isLoading) {
            return <div className="text-center p-8">Loading...</div>
        }
        switch (activeTab) {
            case 'MEMBERS':
                return <MembersTab boardMembers={boardMembers} onUpdateRole={handleUpdateRole} />;
            case 'TEAMS':
                return <TeamsTab teams={teams} onSaveTeam={handleSaveTeam} onDeleteTeam={handleDeleteTeam} allMembers={boardMembers} />;
            case 'JOIN_REQUESTS':
                return <JoinRequestsTab requests={joinRequests} onApprove={handleApproveRequest} onReject={handleRejectRequest} />;
            case 'INVITE_CODES':
                return <InviteCodesTab codes={inviteCodes} onCreate={handleCreateInvite} onRevoke={handleRevokeInvite} />;
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
         <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-[#486966] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-white rounded-lg shadow space-y-4">
            <h2 className="text-xl font-bold text-[#3B3936]">{t('membersAndRoles')}</h2>
            <div className="border-b border-gray-200">
                <nav className="flex space-x-2">
                    <TabButton tab="MEMBERS" label={t('membersView_tab_members')} />
                    <TabButton tab="TEAMS" label={t('teams')} />
                    <TabButton tab="JOIN_REQUESTS" label={t('membersView_tab_joinRequests')} />
                    <TabButton tab="INVITE_CODES" label={t('membersView_tab_inviteCodes')} />
                </nav>
            </div>
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};