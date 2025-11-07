// constants.ts
import { User, Status, Priority, WorkItemType, Board, Team, Role } from './types';

export const ALL_USERS: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@gmail.com', avatarUrl: 'https://i.pravatar.cc/150?u=alice' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=bob' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=charlie' },
  { id: 'user-4', name: 'Diana Prince', email: 'diana.p@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=diana' },
  { id: 'user-5', name: 'Ethan Hunt', email: 'ethan.h@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=ethan' },
];

export const PRIORITIES: Priority[] = [Priority.URGENT, Priority.HIGH, Priority.MEDIUM, Priority.LOW];

export const WORK_ITEM_TYPES: WorkItemType[] = [
    WorkItemType.STORY,
    WorkItemType.TASK,
    WorkItemType.BUG_URGENT,
    WorkItemType.BUG_MINOR,
    WorkItemType.TICKET,
];

export const SPRINTS: string[] = ['Sprint 24.01', 'Sprint 24.02', 'Sprint 24.03', 'Sprint 24.04'];

export const GROUPS: string[] = ['Phoenix Team', 'Dragon Team', 'Griffin Team'];
export const STACKS: string[] = ['Frontend', 'Backend', 'DevOps', 'QA'];

export const KANBAN_COLUMNS = [
  { status: Status.BACKLOG, title: 'Backlog' },
  { status: Status.TODO, title: 'To Do' },
  { status: Status.IN_PROGRESS, title: 'In Progress' },
  { status: Status.IN_REVIEW, title: 'In Review' },
  { status: Status.DONE, title: 'Done' },
];

export const WORKFLOW_RULES: Partial<Record<Status, Status[]>> = {
  [Status.BACKLOG]: [Status.TODO],
  [Status.TODO]: [Status.IN_PROGRESS],
  [Status.IN_PROGRESS]: [Status.IN_REVIEW, Status.TODO],
  [Status.IN_REVIEW]: [Status.DONE, Status.IN_PROGRESS],
  [Status.DONE]: [],
};

export const BOARDS: Board[] = [
    { id: 'board-1', name: 'Project Phoenix' },
    { id: 'board-2', name: 'Project Dragon' },
    { id: 'board-3', name: 'Mobile Initiative' },
];

export const ALL_TEAMS: Team[] = [
    { id: 'team-1', name: 'Frontend', description: 'Handles all UI/UX work', members: ['user-1', 'user-3'] },
    { id: 'team-2', name: 'Backend', description: 'Manages API and database', members: ['user-2', 'user-4'] },
    { id: 'team-3', name: 'Platform', description: 'DevOps and infrastructure', members: ['user-5'] },
];


export const EPIC_COLORS: string[] = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
];

export const ROLES: Role[] = [
    { id: 'role-sm', name: 'Scrum Master', permissions: ['item.create', 'item.edit.any', 'item.delete', 'epic.manage', 'member.manage', 'sprint.manage'] },
    { id: 'role-po', name: 'Product Owner', permissions: ['item.create', 'item.edit.any', 'item.delete', 'epic.manage', 'sprint.manage'] },
    { id: 'role-member', name: 'Member', permissions: ['item.create', 'item.edit.own'] },
    { id: 'role-viewer', name: 'Viewer', permissions: [] },
];

// US-29: Reports & Insights v2
export const WIP_LIMIT = 3;