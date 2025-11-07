// types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface DisplayUser {
    name: string;
    avatarUrl: string;
}

export enum Status {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  DONE = 'Done',
}

export enum Priority {
  URGENT = 'Urgent',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum WorkItemType {
  EPIC = 'Epic',
  STORY = 'Story',
  TASK = 'Task',
  BUG_URGENT = 'Bug (Urgent)',
  BUG_MINOR = 'Bug (Minor)',
  TICKET = 'Ticket',
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Attachment {
    id: string;
    provider: 'INTERNAL' | 'GOOGLE_DRIVE';
    fileName: string;
    fileUrl: string;
}

export interface EpicInfo {
    id: string;
    name: string;
    color: string;
}

export interface TeamInfo {
    id: string;
    name: string;
}

export interface WorkItem {
  id: string;
  boardId: string;
  title: string;
  summary: string;
  description: string;
  description_rich?: any; // For Tiptap JSON content
  type: WorkItemType;
  status: Status;
  assignee?: User; // Represents the Primary Assignee
  assignees: User[]; // All assignees, including the primary
  reporter: User;
  priority: Priority;
  sprintId?: string;
  sprintBinding?: 'auto' | 'manual'; // EP-SSR-01
  doneInSprintId?: string; // EP-SSR-01
  group: string;
  stack: string;
  estimationPoints: number;
  effortHours: number;
  dueDate: string;
  labels: string[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  watchers: string[]; // FIX-05: Changed to string array of user IDs
  createdAt: string;
  updatedAt: string;
  version: number;
  parentId?: string;
  childrenIds?: string[];
  epicId?: string;
  epicInfo?: EpicInfo;
  teamId?: string;
  teamInfo?: TeamInfo;
  isUpdated?: boolean; // for real-time highlight
}

export interface Comment {
    id: string;
    user: DisplayUser;
    content: string;
    mentions: User[];
    timestamp: string;
}

export interface TransitionLog {
    id: string;
    user: DisplayUser;
    fromStatus: Status;
    toStatus: Status;
    timestamp: string;
}

export type ActivityItem = 
    | { type: 'COMMENT', data: Comment }
    | { type: 'TRANSITION', data: TransitionLog };


export enum NotificationType {
    MENTION = 'MENTION',
    ASSIGNMENT = 'ASSIGNMENT',
    STATUS_CHANGE = 'STATUS_CHANGE',
    NEW_COMMENT = 'NEW_COMMENT',
    ITEM_UPDATED = 'ITEM_UPDATED',
}
    
export interface Notification {
    id: string;
    type: NotificationType;
    actor: User;
    workItem: {
        id: string;
        title: string;
    };
    timestamp: string;
    isRead: boolean;
    target?: {
      entity: 'work_item' | 'epic' | 'sprint';
      id: string;
      section?: string; // e.g., 'dueDate', 'description'
    };
}

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

// FIX-05: New Toast and Realtime Event types
export interface ToastNotification {
    id: string;
    itemId: string;
    title: string;
    changes: string[];
    highlightSection?: string;
    undoAction?: () => void;
}

export type ItemUpdateEventType = 'item.status_changed' | 'item.assignee_changed' | 'item.due_changed' | 'item.field_updated' | 'item.comment_added';

export interface ItemUpdateEvent {
    type: ItemUpdateEventType;
    item: {
        id: string;
        boardId: string;
        title: string;
        assigneeId: string;
        createdBy: string;
    };
    change: {
        field: 'status' | 'assignee' | 'dueDate' | 'title' | 'comment';
        from: any;
        to: any;
    };
    watchers: string[]; // array of user IDs
    at: string;
    actor: User;
}

// US-30: Events v2 - Conflict type
export interface Conflict {
    user: User; // The user who has the conflict
    overlappingEvents: { // The events that are overlapping for this user
        id: string;
        title: string;
        start: Date;
        end: Date;
    }[];
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    description?: string;
    linkedWorkItemId?: string;
    attendees: User[];
    teamIds?: string[]; // For editing purposes
    createdBy: User;
    hasConflict?: boolean;
    conflicts?: Conflict[];
    onlineLink?: string;
}

// FIX-07: Add EpicStatus enum
export enum EpicStatus {
    ACTIVE = 'ACTIVE',
    ON_HOLD = 'ON_HOLD',
    DONE = 'DONE',
    ARCHIVED = 'ARCHIVED',
    DELETED = 'DELETED',
}

export interface Epic {
    id: string;
    boardId: string;
    name: string;
    aiSummary: string;
    description: string;
    description_rich?: any; // For Tiptap JSON content
    attachments: Attachment[];
    ease: number;
    impact: number;
    confidence: number;
    iceScore: number;
    createdAt: string;
    updatedAt: string;
    color: string;
    // FIX-06 & FIX-07: Add computed stats
    status: EpicStatus;
    archivedAt?: string;
    deletedAt?: string; // EP-DEL-001
    openItems?: number;
    totalEstimation?: number;
    percentDoneWeighted?: number;
    openItemsCount?: number;
    totalItemsCount?: number;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    members: string[]; // array of user IDs
}

export enum JoinRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface JoinRequest {
    id: string;
    user: User;
    status: JoinRequestStatus;
    requestedAt: string;
}

export interface InviteCode {
    code: string;
    roleId: string;
    uses: number;
    maxUses: number | null;
    expiresAt: string | null;
    createdBy: string; // user ID
    createdAt: string;
}


// US-45: Updated FilterSet for multi-select
export interface FilterSet {
    searchQuery: string;
    assigneeIds: string[]; // User IDs
    assigneeMatch: 'any' | 'all';
    typeIds: string[]; // WorkItemType IDs
    teamIds: string[]; // Team IDs
}


export enum ViewVisibility {
    PRIVATE = 'PRIVATE',
    GROUP = 'GROUP',
}

export interface SavedView {
    id: string;
    name: string;
    ownerId: string;
    visibility: ViewVisibility;
    filterSet: FilterSet;
    isDefault: boolean;
    isPinned: boolean;
}


export interface Board {
    id: string;
    name: string;
}

export type Permission = 
    | 'item.create'
    | 'item.edit.own'
    | 'item.edit.any'
    | 'item.delete'
    | 'epic.manage'
    | 'member.manage'
    | 'sprint.manage';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface BoardMember {
    user: User;
    roleId: string;
}

// US-29: Reports & Insights v2
export enum ReportType {
    BURNDOWN = 'BURNDOWN',
    VELOCITY = 'VELOCITY',
    EPIC_PROGRESS = 'EPIC_PROGRESS',
    ASSIGNEE_WORKLOAD = 'ASSIGNEE_WORKLOAD',
}

export interface EpicProgressReportData {
    epic: Epic;
    totalItems: number;
    doneItems: number;
    totalEstimation: number;
    doneEstimation: number;
    progress: number; // Weighted percentage
}

export interface AssigneeWorkloadData {
    assignee: User;
    open: number;
    inProgress: number;
    inReview: number;
    totalLoad: number;
    wipBreached: boolean;
}

// FIX-04: Sprint Management
export enum SprintState {
    PLANNED = 'PLANNED',
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    DELETED = 'DELETED',
}

export interface Sprint {
    id: string;
    boardId: string;
    number: number;
    name: string;
    goal?: string;
    startAt: string;
    endAt: string;
    state: SprintState;
    epicIds: string[];
    deletedAt?: string; // EP-DEL-001
}