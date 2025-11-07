// components/MembersView.tsx
import React, { useState, useEffect } from 'react';
import { MembersTab } from './MembersTab';
import { JoinRequestsTab } from './JoinRequestsTab';
import { InviteCodesTab } from './InviteCodesTab';
import { TeamsTab } from './TeamsTab';
import { Team, InviteCode, JoinRequest, BoardMember, User } from '../types';
import { useBoard } from '../context/BoardContext';
import { ROLES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

type Tab = 'MEMBERS' | 'TEAMS' | 'JOIN_REQUESTS' | 'INVITE_CODES';

interface MembersViewProps {
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}

export const MembersView: React.FC<MembersViewProps> = ({ teams, setTeams }) => {
    const { activeBoardMembers: initialMembers } = useBoard();
    const { user } = useAuth();
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<Tab>('MEMBERS');
    
    // Manage local state for admin data to make it mutable
    const [boardMembers, setBoardMembers] = useState<BoardMember[]>(initialMembers);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);

    useEffect(() => {
        // US-43: remove mock data fetching
        setBoardMembers(initialMembers);
    }, [initialMembers]);

    const handleApproveRequest = (request: JoinRequest) => {
        const newMember: BoardMember = {
            user: request.user,
            roleId: ROLES.find(r => r.name === 'Member')?.id || 'role-3' // Default to Member
        };
        setBoardMembers(prev => [...prev, newMember]);
        setJoinRequests(prev => prev.filter(r => r.id !== request.id));
        // Global toast will handle this
    };

    const handleRejectRequest = (request: JoinRequest) => {
        setJoinRequests(prev => prev.filter(r => r.id !== request.id));
        // Global toast will handle this
    };

    const handleCreateInvite = (invite: Omit<InviteCode, 'code' | 'createdBy' | 'createdAt' | 'uses'>) => {
        const newCode: InviteCode = {
            ...invite,
            code: `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            createdBy: user?.id || 'user-1', // Mock current user
            createdAt: new Date().toISOString(),
            uses: 0,
        };
        setInviteCodes(prev => [newCode, ...prev]);
        // Global toast will handle this
    };
    
    const handleRevokeInvite = (code: string) => {
        setInviteCodes(prev => prev.filter(c => c.code !== code));
        // Global toast will handle this
    };
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'MEMBERS':
                return <MembersTab boardMembers={boardMembers} setBoardMembers={setBoardMembers} />;
            case 'TEAMS':
                return <TeamsTab teams={teams} setTeams={setTeams} allMembers={boardMembers} />;
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