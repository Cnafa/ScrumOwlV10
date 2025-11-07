import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, WorkItem, Team } from '../types';
import * as calendarService from '../services/calendarService';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';
import { useLocale } from '../context/LocaleContext';
import { CalendarGrid } from './CalendarGrid';

interface EventsViewProps {
    workItems: WorkItem[];
    teams: Team[];
    events: CalendarEvent[];
    onViewEvent: (event: CalendarEvent) => void;
    onAddNewEvent: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ workItems, teams, events, onViewEvent, onAddNewEvent }) => {
    const { user } = useAuth();
    const { can } = useBoard();
    const { t } = useLocale();
    
    // US-30 State
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [scope, setScope] = useState<'my' | 'all'>('my');
    const isScrumMaster = can('sprint.manage');

    const handleSelectEvent = (event: CalendarEvent) => {
        onViewEvent(event);
    };
    
    const ViewButton: React.FC<{ mode: 'calendar' | 'list', label: string }> = ({ mode, label }) => (
         <button 
            onClick={() => setView(mode)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${view === mode ? 'bg-[#486966] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const filteredEvents = useMemo(() => {
        if (!user) return [];
        const effectiveScope = isScrumMaster ? scope : 'my';
        if (effectiveScope === 'my') {
            return events.filter(e =>
                e.createdBy.id === user.id || e.attendees.some(a => a.id === user.id)
            );
        }
        return events; // for 'all' scope
    }, [events, scope, isScrumMaster, user]);

    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div className="flex items-center gap-4">
                     <h2 className="text-xl font-bold text-[#3B3936]">{t('eventsView')}</h2>
                     {isScrumMaster && (
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                             <button onClick={() => setScope('my')} className={`px-3 py-1 text-sm rounded-md ${scope === 'my' ? 'bg-white shadow-sm' : ''}`}>{t('my_events')}</button>
                             <button onClick={() => setScope('all')} className={`px-3 py-1 text-sm rounded-md ${scope === 'all' ? 'bg-white shadow-sm' : ''}`}>{t('all_events')}</button>
                        </div>
                     )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                        <ViewButton mode="calendar" label={t('calendar_view')} />
                        <ViewButton mode="list" label={t('list_view')} />
                    </div>
                    <button onClick={onAddNewEvent} className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        New Event
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {view === 'calendar' ? (
                     <CalendarGrid events={filteredEvents} onSelectEvent={handleSelectEvent} />
                ) : (
                    <div className="overflow-y-auto h-full">
                        {filteredEvents.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredEvents.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map(event => (
                                    <li key={event.id} onClick={() => handleSelectEvent(event)} className="p-3 border rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-sm text-[#3B3936] flex items-center gap-2">
                                                {event.title}
                                                {event.hasConflict && <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{t('conflict_badge')}</span>}
                                            </p>
                                            <p className="text-xs text-gray-600">{new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}</p>
                                        </div>
                                        <div className="text-xs text-gray-500">{event.attendees.length} attendees</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <h3 className="text-base font-semibold text-slate-800">No Events Scheduled</h3>
                                <p className="mt-2 text-sm text-slate-600">Create an event to see it on your calendar or list.</p>
                                <button onClick={onAddNewEvent} className="mt-4 py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                                    New Event
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};