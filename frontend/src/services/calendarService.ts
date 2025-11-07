import { CalendarEvent, User, Conflict, Team, EventAttendee, RSVPStatus } from '../types';
import { ALL_USERS } from '../constants';
import { load, save } from './persistence';

// --- Conflict Detection Logic (US-30) ---
const isOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
    return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

const detectConflictsForEvent = (eventToCheck: Partial<CalendarEvent>, allEvents: CalendarEvent[], allTeams: Team[]): Conflict[] => {
    const conflictsMap = new Map<string, Conflict>();
    const otherEvents = allEvents.filter(e => e.id !== eventToCheck.id);
    
    const finalAttendees = expandToUsers(eventToCheck.attendees as any, eventToCheck.teamIds, allTeams);

    for (const attendee of finalAttendees) {
        const overlappingEvents = otherEvents.filter(otherEvent => {
            if (!otherEvent.attendees.some(a => a.user.id === attendee.id)) {
                return false;
            }
            return isOverlap(eventToCheck.start!, eventToCheck.end!, otherEvent.start, otherEvent.end);
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

const updateAllConflicts = (allEvents: CalendarEvent[], allTeams: Team[]): CalendarEvent[] => {
    return allEvents.map(event => {
        const conflicts = detectConflictsForEvent(event, allEvents, allTeams);
        return { ...event, conflicts, hasConflict: conflicts.length > 0 };
    });
};

const rehydrateDates = (events: any[]): CalendarEvent[] => {
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
            e.createdBy.id === currentUser.id || e.attendees.some(a => a.user.id === currentUser.id)
        );
    }
    return events;
};

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
            const isAttendee = e.attendees.some(a => a.user.id === currentUser.id);
            const isUpcoming = eventStart > now;
            return isToday && isAttendee && isUpcoming;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

const expandToUsers = (attendees: User[] = [], teamIds: string[] = [], allTeams: Team[]): User[] => {
    const teamMemberIds = teamIds.flatMap(tid => allTeams.find(t => t.id === tid)?.members || []);
    const attendeeIds = new Set([...attendees.map(u => u.id), ...teamMemberIds]);
    return ALL_USERS.filter(u => attendeeIds.has(u.id));
};

const expandToEventAttendees = (attendees: User[], teamIds: string[] = [], allTeams: Team[]): EventAttendee[] => {
    const uniqueUsers = expandToUsers(attendees, teamIds, allTeams);
    return uniqueUsers.map(user => ({
        user,
        status: RSVPStatus.INVITED,
    }));
};

export const createEvent = async (eventData: Partial<CalendarEvent>, createdBy: User, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));

    const finalAttendees = expandToEventAttendees(eventData.attendees as any, eventData.teamIds, allTeams);

    const newEvent: CalendarEvent = {
        ...(eventData as any),
        id: `event-${Date.now()}`,
        attendees: finalAttendees,
        createdBy,
    };
    events.push(newEvent);
    events = updateAllConflicts(events, allTeams);
    save('events', events);
    return events.find(e => e.id === newEvent.id)!;
};

export const updateEvent = async (updatedEventData: CalendarEvent, allTeams: Team[]): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));
    
    const oldEvent = events.find(e => e.id === updatedEventData.id);
    const newUsers = expandToUsers(updatedEventData.attendees as any, updatedEventData.teamIds, allTeams);

    const finalAttendees: EventAttendee[] = newUsers.map(user => {
        const oldAttendee = oldEvent?.attendees.find(a => a.user.id === user.id);
        return oldAttendee || { user, status: RSVPStatus.INVITED };
    });
    
    const finalEvent = { ...updatedEventData, attendees: finalAttendees };

    events = events.map(e => e.id === finalEvent.id ? finalEvent : e);
    events = updateAllConflicts(events, allTeams);
    save('events', events);
    return events.find(e => e.id === finalEvent.id)!;
};

export const updateRSVP = async (eventId: string, userId: string, status: RSVPStatus): Promise<CalendarEvent> => {
    await new Promise(res => setTimeout(res, 200));
    let events = rehydrateDates(load<any[]>('events', []));
    let eventToUpdate: CalendarEvent | undefined;

    const updatedEvents = events.map(e => {
        if (e.id === eventId) {
            const newAttendees = e.attendees.map((attendee: EventAttendee) => {
                if (attendee.user.id === userId) {
                    return { ...attendee, status: status };
                }
                return attendee;
            });
            eventToUpdate = { ...e, attendees: newAttendees };
            return eventToUpdate;
        }
        return e;
    });

    save('events', updatedEvents);
    if (!eventToUpdate) throw new Error("Event not found");
    return eventToUpdate;
};

export const deleteEvent = async (eventId: string, allTeams: Team[]): Promise<void> => {
    await new Promise(res => setTimeout(res, 300));
    let events = rehydrateDates(load<CalendarEvent[]>('events', []));
    events = events.filter(e => e.id !== eventId);
    events = updateAllConflicts(events, allTeams);
    save('events', events);
};

export const getConflictsPreview = async (eventData: Partial<CalendarEvent>, allTeams: Team[]): Promise<Conflict[]> => {
    await new Promise(res => setTimeout(res, 50));
    if (!eventData.start || !eventData.end) return [];
    
    const events = rehydrateDates(load<CalendarEvent[]>('events', []));
    return detectConflictsForEvent(eventData, events, allTeams);
};