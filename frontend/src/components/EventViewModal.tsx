// components/EventViewModal.tsx
import React, { useMemo } from 'react';
import { CalendarEvent, WorkItem, User, RSVPStatus, Team } from '../types';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

interface EventViewModalProps {
  event: CalendarEvent;
  workItems: WorkItem[];
  teams: Team[];
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onOpenWorkItem: (itemId: string) => void;
  onUpdateRSVP: (eventId: string, status: RSVPStatus) => void;
}

const DetailField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-medium text-[#889C9B] mb-1">{label}</p>
        <div className="text-sm text-[#3B3936]">{children}</div>
    </div>
);

const UserChip: React.FC<{ user: User, status?: RSVPStatus, t: Function }> = ({ user, status, t }) => {
    const statusStyles: Record<RSVPStatus, string> = {
        [RSVPStatus.GOING]: 'bg-green-100 text-green-800',
        [RSVPStatus.MAYBE]: 'bg-yellow-100 text-yellow-800',
        [RSVPStatus.DECLINED]: 'bg-red-100 text-red-800 line-through',
        [RSVPStatus.INVITED]: 'bg-gray-100 text-gray-800',
    };
    const statusKey = `rsvp_${(status || RSVPStatus.INVITED).toLowerCase()}` as any;
    return (
        <div className={`inline-flex items-center gap-2 rounded-full px-2 py-1 ${statusStyles[status || RSVPStatus.INVITED]}`}>
            <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs opacity-70">({t(statusKey)})</span>
        </div>
    );
};

export const EventViewModal: React.FC<EventViewModalProps> = ({ event, workItems, teams, onClose, onEdit, onOpenWorkItem, onUpdateRSVP }) => {
    const { t } = useLocale();
    const { user } = useAuth();
    const { can } = useBoard();

    const canEditEvent = user && (event.createdBy.id === user.id || can('sprint.manage'));
    const linkedWorkItem = event.linkedWorkItemId ? workItems.find(wi => wi.id === event.linkedWorkItemId) : null;
    
    const currentUserStatus = useMemo(() => 
        event.attendees.find(a => a.user.id === user?.id)?.status,
    [event, user]);

    const formattedDate = (start: Date, end: Date) => {
        return `${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`;
    };

    const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const invitedTeams = useMemo(() => 
        teams.filter(team => event.teamIds?.includes(team.id)),
    [teams, event.teamIds]);

    const RSVPButton: React.FC<{ status: RSVPStatus, label: string }> = ({ status, label }) => (
        <button
            onClick={() => onUpdateRSVP(event.id, status)}
            className={`py-1.5 px-3 text-sm font-medium rounded-md border ${currentUserStatus === status ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]" onMouseDown={handleBackdropMouseDown}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-[#3B3936]">{event.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEditEvent && (
                             <button onClick={() => onEdit(event)} className="py-2 px-3 text-sm font-medium rounded-md text-[#3B3936] border border-[#889C9B] hover:bg-gray-100">{t('edit')}</button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                            <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {currentUserStatus && (
                         <div className="p-3 border rounded-lg bg-slate-50 flex items-center justify-center gap-2">
                            <RSVPButton status={RSVPStatus.GOING} label={t('rsvp_going')} />
                            <RSVPButton status={RSVPStatus.MAYBE} label={t('rsvp_maybe')} />
                            <RSVPButton status={RSVPStatus.DECLINED} label={t('rsvp_declined')} />
                        </div>
                    )}
                    {event.onlineLink && (
                        <a 
                            href={event.onlineLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]"
                            aria-label={`Join online meeting for ${event.title}`}
                        >
                            {t('join_meeting')}
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                    )}
                    <DetailField label={t('eventView_time')}>
                        {formattedDate(event.start, event.end)}
                    </DetailField>
                    
                    {event.description && (
                        <DetailField label={t('description')}>
                            <p className="p-3 bg-gray-50 rounded-md">{event.description}</p>
                        </DetailField>
                    )}

                    {linkedWorkItem && (
                        <DetailField label={t('eventView_linkedItem')}>
                            <button 
                                onClick={() => onOpenWorkItem(linkedWorkItem.id)}
                                className="inline-flex items-center gap-1.5 text-sm text-[#486966] hover:underline"
                                aria-label={`Open task: ${linkedWorkItem.title}`}
                            >
                                <span>{`[${linkedWorkItem.id}] ${linkedWorkItem.title}`}</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </button>
                        </DetailField>
                    )}

                    <DetailField label={t('attendees')}>
                        <div className="flex flex-wrap gap-2">
                            {event.attendees.map(attendee => <UserChip key={attendee.user.id} user={attendee.user} status={attendee.status} t={t}/>)}
                        </div>
                    </DetailField>
                    
                    {invitedTeams.length > 0 && (
                        <DetailField label={t('eventView_teams')}>
                            <div className="flex flex-wrap gap-2">
                                {invitedTeams.map(team => (
                                    <span key={team.id} className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{team.name}</span>
                                ))}
                            </div>
                        </DetailField>
                    )}

                     <DetailField label={t('eventView_createdBy')}>
                        <UserChip user={event.createdBy} t={t} />
                    </DetailField>
                </main>
            </div>
        </div>
    );
};