import { WorkItem, ActivityItem, Notification, CalendarEvent, Epic, Team, JoinRequest, InviteCode, Sprint } from '../types';

export const getMockEpics = (count: number = 10): Epic[] => {
    return [];
}

export const getMockSprints = (count: number = 6): Sprint[] => {
    return [];
};

export const getMockTeams = (): Team[] => {
    return [];
};

export const getMockJoinRequests = (count: number = 2): JoinRequest[] => {
    return [];
};

export const getMockInviteCodes = (count: number = 2): InviteCode[] => {
    return [];
};

export const getMockWorkItems = (count: number = 30): WorkItem[] => {
    return [];
};

export const getMockActivities = (count: number = 10): ActivityItem[] => {
    return [];
};

export const getMockNotifications = (count: number = 15, workItems: WorkItem[]): Notification[] => {
    return [];
};

export const getMockCalendarEvents = (count: number = 10, workItems: WorkItem[]): CalendarEvent[] => {
    return [];
};
