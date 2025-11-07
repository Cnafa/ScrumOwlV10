import { CalendarEvent, WorkItem, User, Conflict, Team } from '../types';
import { ALL_USERS } from '../constants';
import { load, save } from './persistence';

// --- Conflict Detection Logic (US-30) ---
const isOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
    return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

const detectConflictsForEvent = (eventToCheck: CalendarEvent, allEvents: CalendarEvent[]): Conflict[] => {
    const conflictsMap = new Map<string, Conflict>();
    const otherEvents = allEvents.filter(e => e.id !== eventToCheck.id);

    for (const attendee of eventToCheck.attendees) {
        const overlappingEvents = otherEvents.filter(otherEvent => {
            if (!otherEvent.attendees.some(a => a.id === attendee.id)) {
                return false;
            }
            return isOverlap(eventToCheck.start, eventToCheck.end, otherEvent.start, otherEvent.end);
        });

        if (overlappingEvents.length > 0) {
            if (!conflictsMap.has(attendee.id)) {
                conflictsMap.set(attendee.id, { user: attendee, overlappingEvents: [] });
            }
            conflictsMap.get(attendee.id)!.overlappingEvents.push(...overlappingEvents.map(e => ({
                id: e.id, title: e.title, start: e.start, end: e.end
            })));
        }
    }
    return Array.from(conflictsMap.values());
};

const updateAllConflicts = (allEvents: CalendarEvent[]): CalendarEvent[] => {
    return allEvents.map(event => {
        const conflicts = detectConflictsForEvent(event, allEvents);
        return { ...event, conflicts, hasConflict: conflicts.length > 0 };
    });
};

const rehydrateDates = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
    }));
};

export const getEvents = async (scope: 'my' | 'all', currentUser: User): Promise<CalendarEvent[]> => {
    await new Promise(res => setTimeout(res, 100));
    const events = rehydrateDates(load<CalendarEvent[]>('events', []));
    if (scope === 'my') {
        return events.filter(e =>
            e.createdBy.id === currentUser.id || e.attendees.some(a => a.id === currentUser.id)
        );
    }
    return events; // for 'all' scope (SMs)
};

// FIX-08: Get today's events for the banner
export const getTodaysEvents = async (currentUser: User): Promise<CalendarEvent[]> => {
    await new Promise(res => setTimeout(res, 100));
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const events = rehydrateDates(load<CalendarEvent[]>('events', []));

    return events
        .filter(e => {
            const eventStart = new Date(e.start);
            const isToday = eventStart >= todayStart && eventStart <= todayEnd;
            const isAttendee = e.attendees.some(a => a.id === currentUser.id);
            const isUpcoming = eventStart > now;
            return isToday && isAttendee && isUpcoming;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

const expandTeamsToAttendees = (attendees: User[], teamIds: string[] = [], allTeams: Team[]): User[] => {
    const teamMemberIds = teamIds.flatMap(tid => allTeams.find(t => t.id === tid)?.members || []);
    const attendeeIds = new Set([...(attendees || []).map(u => u.id), ...teamMemberIds]);
    return ALL_USERS.filter(u => attendeeIds.has(u.id));
};

export const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdBy' | 'hasConflict' | 'conflicts'>, createdBy: User, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));

    const finalAttendees = expandTeamsToAttendees(eventData.attendees, eventData.teamIds, allTeams);

    const newEvent: CalendarEvent = {
        ...eventData,
        id: `event-${Date.now()}`,
        attendees: finalAttendees,
        createdBy,
    };
    events.push(newEvent);
    events = updateAllConflicts(events);
    save('events', events);
    return events.find(e => e.id === newEvent.id)!;
};

export const updateEvent = async (updatedEventData: CalendarEvent, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));
    const finalAttendees = expandTeamsToAttendees(updatedEventData.attendees, updatedEventData.teamIds, allTeams);
    const finalEvent = { ...updatedEventData, attendees: finalAttendees };

    events = events.map(e => e.id === finalEvent.id ? finalEvent : e);
    events = updateAllConflicts(events);
    save('events', events);
    return events.find(e => e.id === finalEvent.id)!;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));
    events = events.filter(e => e.id !== eventId);
    events = updateAllConflicts(events);
    save('events', events);
};

export const getConflictsPreview = async (eventData: Partial<CalendarEvent>, allTeams: Team[]): Promise<Conflict[]> => {
    await new Promise(res => setTimeout(res, 50));
    if (!eventData.start || !eventData.end) return [];
    
    const events = rehydrateDates(load<CalendarEvent[]>('events', []));
    const finalAttendees = expandTeamsToAttendees(eventData.attendees || [], eventData.teamIds, allTeams);

    const eventToTest: CalendarEvent = {
        id: eventData.id || 'temp-id',
        title: eventData.title || '',
        start: eventData.start,
        end: eventData.end,
        attendees: finalAttendees,
        allDay: false,
        createdBy: ALL_USERS[0],
    };

    return detectConflictsForEvent(eventToTest, events);
};
