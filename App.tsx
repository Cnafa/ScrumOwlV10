// FIX: Create the App component which was missing.
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import { AppShell } from './components/AppShell';
// FIX: Import Status, Priority, and WorkItemType enums to fix type errors.
import { WorkItem, Notification, ItemUpdateEvent, Epic, Team, Status, Priority, WorkItemType, Sprint, ToastNotification, EpicStatus, SprintState, Board, JoinRequest, InviteCode, CalendarEvent, SavedView, ViewVisibility, ItemUpdateEventType, User } from './types';
import { WorkItemDetailModal } from './components/WorkItemDetailModal';
import { WorkItemEditor } from './components/WorkItemEditor';
import { UserSettingsModal } from './components/UserSettingsModal';
import { useRealtime } from './hooks/useRealtime';
import { useSettings } from './context/SettingsContext';
import { EpicEditor } from './components/EpicEditor';
import { useIdleReminder } from './hooks/useIdleReminder';
import { useBoard } from './context/BoardContext';
import { ToastManager } from './components/ToastManager';
import { useLocale } from './context/LocaleContext';
import { ALL_USERS, EPIC_COLORS } from './constants';
import DevCrashInspector from './pages/DevCrashInspector';
import OnboardingScreen from './components/OnboardingScreen';
import CreateBoardModal from './components/CreateBoardModal';
import JoinBoardModal from './components/JoinBoardModal';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import { DeleteEpicModal } from './components/DeleteEpicModal';
import { DeleteSprintModal } from './components/DeleteSprintModal';
import LandingPage from './components/LandingPage';
import { useSessionIdleTimer } from './hooks/useSessionIdleTimer';
import { ReAuthModal } from './components/ReAuthModal';
import LegalPage from './components/LegalPage';
import * as calendarService from './services/calendarService';
import { EventEditorModal } from './components/EventEditorModal';
import { EventViewModal } from './components/EventViewModal';
import { load, save } from './services/persistence';
import { isEqual } from 'lodash-es';


const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const App: React.FC = () => {
    const { isAuthenticated, user, logout, lastAuthTime, updateLastAuthTime } = useAuth();
    const { settings } = useSettings();
    const { activeBoard, boards, setActiveBoard, can, createBoard, activeBoardMembers } = useBoard();
    const { t, locale } = useLocale();
    
    // App Flow State
    const [viewState, setViewState] = useState<'LANDING' | 'APP'>('LANDING');
    const prevIsAuthenticated = useRef(isAuthenticated);

    // ONB-01: Onboarding state management
    type OnboardingStatus = 'UNKNOWN' | 'NEEDS_ONBOARDING' | 'PENDING_APPROVAL' | 'COMPLETED';
    const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('UNKNOWN');
    const [onboardingModal, setOnboardingModal] = useState<'CREATE_BOARD' | 'JOIN_BOARD' | null>(null);

    // Main data state
    const [workItems, setWorkItems] = useState<WorkItem[]>(() => load('workItems', []));
    const [epics, setEpics] = useState<Epic[]>(() => load('epics', []));
    const [teams, setTeams] = useState<Team[]>(() => load('teams', []));
    const [sprints, setSprints] = useState<Sprint[]>(() => load('sprints', []));
    const [notifications, setNotifications] = useState<Notification[]>(() => load('notifications', []));
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(() => load('joinRequests', []));
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(() => load('inviteCodes', []));
    const [savedViews, setSavedViews] = useState<SavedView[]>(() => load('savedViews', []));
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
    const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
    
    // UI state
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
    const [editingWorkItem, setEditingWorkItem] = useState<Partial<WorkItem> | null>(null);
    const [editingEpic, setEditingEpic] = useState<Partial<Epic> | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isNewItem, setIsNewItem] = useState(false);
    const [isNewEpic, setIsNewEpic] = useState(false);
    const [toastQueue, setToastQueue] = useState<ToastNotification[]>([]);
    const [highlightSection, setHighlightSection] = useState<string | undefined>(undefined);
    const coalescingRef = useRef<Map<string, { data: ToastNotification, timer: number }>>(new Map());
    const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
    const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

    // Save state changes to localStorage
    useEffect(() => { save('workItems', workItems); }, [workItems]);
    useEffect(() => { save('epics', epics); }, [epics]);
    useEffect(() => { save('teams', teams); }, [teams]);
    useEffect(() => { save('sprints', sprints); }, [sprints]);
    useEffect(() => { save('notifications', notifications); }, [notifications]);
    useEffect(() => { save('joinRequests', joinRequests); }, [joinRequests]);
    useEffect(() => { save('inviteCodes', inviteCodes); }, [inviteCodes]);
    useEffect(() => { save('savedViews', savedViews); }, [savedViews]);

    // One-time migrations
    useEffect(() => {
        let items = load<WorkItem[] | any[]>('workItems', []);
        if (items.length === 0) return;

        const sprintsList = load<Sprint[]>('sprints', []);
        let needsSave = false;
        
        const migratedItems: WorkItem[] = items.map(item => {
            let newItem = { ...item };
            
            // Migration 1: sprint -> sprintId
            const anyItem = item as any;
            if (anyItem.sprint && !anyItem.sprintId) {
                const matchingSprint = sprintsList.find(s => s.name === anyItem.sprint);
                if (matchingSprint) {
                    needsSave = true;
                    newItem.sprintId = matchingSprint.id;
                }
            }
            if (anyItem.sprint) {
                needsSave = true;
                delete (newItem as any).sprint;
            }

            // Migration 2: Add sprintBinding (EP-SSR-01)
            if (!newItem.sprintBinding) {
                needsSave = true;
                newItem.sprintBinding = 'manual';
            }

            return newItem;
        });

        if (needsSave) {
            setWorkItems(migratedItems);
        }
    }, []); // Run only once on mount

    // Re-authentication state
    const [isReAuthModalOpen, setIsReAuthModalOpen] = useState(false);
    const [actionToReAuth, setActionToReAuth] = useState<(() => void) | null>(null);

    // US-42: State for read-only view mode
    const [isReadOnlyView, setIsReadOnlyView] = useState(false);

    // EP-DEL-001: State for delete modals
    const [deletingEpic, setDeletingEpic] = useState<Epic | null>(null);
    const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);


    // Dev route state
    const [isDevRoute, setIsDevRoute] = useState(false);
    const [isLegalPage, setIsLegalPage] = useState(false);

    // FIX: Move sprint selection state up from AppShell to App
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

     // Idle Timer Integration
    useSessionIdleTimer(
        isAuthenticated,
        () => { // onIdleWarning
            setToastQueue(prev => [{
                id: `toast-idle-warning-${Date.now()}`,
                itemId: '',
                title: t('session_warning_title'),
                changes: [t('session_warning_body')],
            }, ...prev]);
        },
        () => { // onIdleLogout
            logout();
        }
    );

    // US-44: Redirect to landing page on logout
    useEffect(() => {
        // Only trigger the redirect to landing if the user was previously authenticated and now is not (i.e., they logged out).
        // This prevents an infinite loop when an unauthenticated user tries to navigate from the landing page to the app.
        if (prevIsAuthenticated.current && !isAuthenticated && viewState === 'APP') {
            setViewState('LANDING');
        }

        // Update the ref to the current authentication state for the next render.
        prevIsAuthenticated.current = isAuthenticated;
    }, [isAuthenticated, viewState]);

    // US-44: Listen for logout events from other tabs
    useEffect(() => {
        const channel = new BroadcastChannel('auth');
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'LOGOUT') {
                logout();
            }
        };
        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [logout]);


    // Check for dev route on mount
    useEffect(() => {
        if (window.location.pathname === '/dev/crash') {
            setIsDevRoute(true);
        }
        if (window.location.pathname === '/legal') {
            setIsLegalPage(true);
        }
    }, []);
    
    // ONB-01: Determine user status after login
    useEffect(() => {
        if (isAuthenticated) {
            if (boards.length === 0) {
                setOnboardingStatus('NEEDS_ONBOARDING');
            } else {
                if (!activeBoard) {
                    setActiveBoard(boards[0].id);
                }
                setOnboardingStatus('COMPLETED');
            }
        } else {
            setOnboardingStatus('UNKNOWN');
        }
    }, [isAuthenticated, boards, activeBoard, setActiveBoard]);

    const fetchAllEvents = useCallback(async () => {
        if (!user) return;
        const [fetchedAll, fetchedToday] = await Promise.all([
            calendarService.getEvents('all', user),
            calendarService.getTodaysEvents(user),
        ]);
        setAllEvents(fetchedAll);
        setTodaysEvents(fetchedToday);
    }, [user]);

    // Fetch initial data
    useEffect(() => {
        if (isAuthenticated && onboardingStatus === 'COMPLETED') {
            fetchAllEvents();

            if (!activeBoard && boards.length > 0) {
                setActiveBoard(boards[0].id);
            }

        } else if (!isAuthenticated) {
            // Clear data on logout
            setWorkItems([]); save('workItems', []);
            setEpics([]); save('epics', []);
            setTeams([]); save('teams', []);
            setSprints([]); save('sprints', []);
            setNotifications([]); save('notifications', []);
            setJoinRequests([]); save('joinRequests', []);
            setInviteCodes([]); save('inviteCodes', []);
            setSavedViews([]); save('savedViews', []);
            save('events', []); // Clear calendar events
            setAllEvents([]);
            setTodaysEvents([]);
            setToastQueue([]);
            setOnboardingStatus('UNKNOWN');
        }
    }, [isAuthenticated, onboardingStatus, activeBoard, setActiveBoard, boards.length, fetchAllEvents]);

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'fa-IR' ? 'rtl' : 'ltr';
    }, [locale]);
    
    // Real-time message handler for Toasts
    const handleRealtimeMessage = useCallback((event: ItemUpdateEvent) => {
        if (!user) return;
        
        // Relevance Guard
        const isRelevant = user.id === event.item.createdBy || user.id === (event.item.assigneeId) || event.watchers.includes(user.id);
        if (!isRelevant) return;

        const { item, change } = event;
        const existing = coalescingRef.current.get(item.id);

        if (existing) {
            clearTimeout(existing.timer);
        }
        
        const formatChange = (): string => {
            switch (change.field) {
                case 'status': return t('toast_change_status').replace('{status}', change.to);
                case 'assignee': return t('toast_change_assignee').replace('{assignee}', change.to);
                case 'dueDate': return t('toast_change_due').replace('{date}', new Date(change.to).toLocaleDateString());
                case 'comment': return t('toast_change_comment');
                default: return t('toast_change_generic').replace('{field}', change.field);
            }
        };

        const mapFieldToSection = (field: string): string => {
            const map: { [key: string]: string } = {
                status: 'status',
                assignee: 'assignee',
                dueDate: 'dueDate',
            };
            return map[field] || 'title';
        };

        const newChangeSummary = formatChange();
        const mergedChanges = existing ? [...existing.data.changes, newChangeSummary] : [newChangeSummary];

        const toastData: ToastNotification = {
            id: `toast-${item.id}-${Date.now()}`,
            itemId: item.id,
            title: item.title,
            changes: [...new Set(mergedChanges)], // Unique changes
            highlightSection: mapFieldToSection(change.field),
        };

        const timer = window.setTimeout(() => {
            setToastQueue(prev => [toastData, ...prev]);
            coalescingRef.current.delete(item.id);
        }, 3000);

        coalescingRef.current.set(item.id, { data: toastData, timer });

    }, [user, t]);
    
    const { connectionStatus } = useRealtime(settings.enableRealtime, workItems, user, handleRealtimeMessage);

    const dispatchUpdateNotification = useCallback((change: { field: string, from: any, to: any }, item: WorkItem) => {
        if (!user) return;

        // In a real app, the actor would be the current user, and the notification
        // would be sent to other relevant users via a backend. For this demo,
        // we simulate an event coming from another user to show the toast.
        const mockActor = ALL_USERS.find(u => u.id !== user.id) || user;

        let eventType: ItemUpdateEventType;
        const changePayload: any = { field: change.field, from: change.from, to: change.to };

        switch (change.field) {
            case 'status':
                eventType = 'item.status_changed';
                break;
            case 'assignee':
                eventType = 'item.assignee_changed';
                changePayload.from = (change.from as User)?.name;
                changePayload.to = (change.to as User)?.name;
                break;
            case 'dueDate':
                eventType = 'item.due_changed';
                break;
            case 'comment':
                eventType = 'item.comment_added';
                break;
            default:
                eventType = 'item.field_updated';
        }

        const event: ItemUpdateEvent = {
            type: eventType,
            item: {
                id: item.id,
                boardId: item.boardId,
                title: item.title,
                assigneeId: item.assignee?.id || '',
                createdBy: item.reporter.id,
            },
            change: changePayload,
            watchers: item.watchers || [],
            at: new Date().toISOString(),
            actor: mockActor,
        };
        
        handleRealtimeMessage(event);
    }, [user, handleRealtimeMessage]);

    // Automatically update sprint states based on dates
    useEffect(() => {
        const updateSprintStates = () => {
            setSprints(prevSprints => {
                const now = new Date();
                let hasChanged = false;

                const updatedSprints = prevSprints.map(sprint => {
                    if (sprint.state === SprintState.DELETED || sprint.state === SprintState.CLOSED) {
                        return sprint;
                    }

                    const start = new Date(sprint.startAt);
                    const end = new Date(sprint.endAt);
                    end.setHours(23, 59, 59, 999); 

                    let newState = sprint.state;
                    if (sprint.state === SprintState.PLANNED && start <= now && end >= now) {
                        newState = SprintState.ACTIVE;
                    } else if (sprint.state === SprintState.ACTIVE && end < now) {
                        newState = SprintState.CLOSED;
                    }
                    
                    if (newState !== sprint.state) {
                        hasChanged = true;
                        return { ...sprint, state: newState };
                    }
                    return sprint;
                });

                return hasChanged ? updatedSprints : prevSprints;
            });
        };

        updateSprintStates();
        const intervalId = setInterval(updateSprintStates, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, []);


    // FIX: Moved sprint-related memos and effects from AppShell to App
    const activeSprints = useMemo(() => sprints.filter(s => s.state === SprintState.ACTIVE && s.state !== SprintState.DELETED), [sprints]);

    const availableActiveSprints = useMemo(() => {
        if (!user) return [];
        if (can('sprint.manage')) {
            return activeSprints;
        }
        const sprintsWithUserItems = new Set(
            workItems
                .filter(item => item.sprintId && item.assignees?.some(a => a.id === user.id))
                .map(item => item.sprintId)
        );
        return activeSprints.filter(s => sprintsWithUserItems.has(s.id));
    }, [activeSprints, workItems, user, can]);

    useEffect(() => {
        const currentSelectionStillAvailable = availableActiveSprints.some(s => s.id === selectedSprintId);

        if (availableActiveSprints.length > 0 && !currentSelectionStillAvailable) {
            const mostRecent = [...availableActiveSprints].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];
            setSelectedSprintId(mostRecent.id);
        } else if (availableActiveSprints.length === 0) {
            setSelectedSprintId(null);
        }
    }, [availableActiveSprints, selectedSprintId]);
    
    const selectedSprint = useMemo(() => sprints.find(s => s.id === selectedSprintId), [sprints, selectedSprintId]);
    
    const enrichedEpics = useMemo(() => {
        return epics.map(epic => {
            const childItems = workItems.filter(item => item.epicId === epic.id);
            const totalItemsCount = childItems.length;

            if (totalItemsCount === 0) {
                return {
                    ...epic,
                    openItemsCount: 0,
                    totalItemsCount: 0,
                    totalEstimation: 0,
                    percentDoneWeighted: 0,
                };
            }

            const doneItems = childItems.filter(item => item.status === Status.DONE);
            const openItemsCount = totalItemsCount - doneItems.length;
            
            const totalEstimation = childItems.reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
            const doneEstimation = doneItems.reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
            
            let percentDoneWeighted = 0;
            // Prioritize estimation points for progress calculation
            if (totalEstimation > 0) {
                percentDoneWeighted = (doneEstimation / totalEstimation) * 100;
            } else {
                // Fallback to item count if no estimations are present
                percentDoneWeighted = (doneItems.length / totalItemsCount) * 100;
            }

            return { 
                ...epic, 
                openItemsCount, 
                totalItemsCount,
                totalEstimation,
                percentDoneWeighted,
            };
        });
    }, [epics, workItems]);
    
    const activeEpics = useMemo(() => enrichedEpics.filter(e => (e.status === EpicStatus.ACTIVE || e.status === EpicStatus.ON_HOLD) && e.status !== EpicStatus.DELETED), [enrichedEpics]);
    const boardUsers = useMemo(() => activeBoardMembers.map(m => m.user), [activeBoardMembers]);

    // US-42: Clear highlight states when modals are closed
    useEffect(() => {
        if (!selectedWorkItem && !editingEpic && !editingWorkItem) {
            setHighlightSection(undefined);
            setIsReadOnlyView(false);
        }
    }, [selectedWorkItem, editingEpic, editingWorkItem]);

    const confirmAndExecute = (action: () => void) => {
        if (!lastAuthTime || (new Date().getTime() - lastAuthTime > TWELVE_HOURS)) {
            setActionToReAuth(() => action);
            setIsReAuthModalOpen(true);
        } else {
            action();
        }
    };

    const handleReAuthSuccess = () => {
        updateLastAuthTime();
        if (actionToReAuth) {
            actionToReAuth();
        }
        setIsReAuthModalOpen(false);
        setActionToReAuth(null);
    };

    // Handlers for modals and actions
    const handleSelectWorkItem = (item: WorkItem) => {
        // FIX: Explicitly clear editing state to prevent modal conflicts.
        setEditingWorkItem(null);
        setSelectedWorkItem(item);
    };

    const handleEditWorkItem = (item: WorkItem) => {
        setSelectedWorkItem(null);
        setEditingWorkItem(item);
        setIsNewItem(false);
    };

    // US-42: Refactored to open VIEW modal instead of edit.
    const handleOpenItemForView = (itemId: string, highlight?: string) => {
        const item = workItems.find(w => w.id === itemId);
        if (item) {
            setEditingWorkItem(null); // Close editor if open
            setEditingEpic(null);
            setHighlightSection(highlight);
            setSelectedWorkItem(item); // Open viewer
        }
    };

    const handleNewItem = (options?: { epicId?: string }) => {
        if (!user || !activeBoard) return;
        const linkedEpic = options?.epicId ? epics.find(e => e.id === options.epicId) : undefined;
        setEditingWorkItem({
            reporter: user,
            status: Status.TODO,
            type: WorkItemType.TASK,
            priority: Priority.MEDIUM,
            boardId: activeBoard.id,
            epicId: options?.epicId,
            epicInfo: linkedEpic ? { id: linkedEpic.id, name: linkedEpic.name, color: linkedEpic.color } : undefined,
            assignee: user,
            assignees: [user],
            attachments: [],
            checklist: [],
            labels: [],
            watchers: [user.id], // Creator watches by default
            description: '', // FIX: Initialize description to prevent .replace on undefined error
            estimationPoints: 0, // FIX: Initialize estimation points to 0
            // EP-SSR-01: New items have manual binding
            sprintId: selectedSprint ? selectedSprint.id : undefined,
            sprintBinding: 'manual',
        });
        setIsNewItem(true);
    };

    const handleSaveWorkItem = (itemToSave: Partial<WorkItem>) => {
        const linkedTeam = itemToSave.teamId ? teams.find(t => t.id === itemToSave.teamId) : undefined;
        const itemWithTeamInfo = {
            ...itemToSave,
            teamInfo: linkedTeam ? { id: linkedTeam.id, name: linkedTeam.name } : undefined,
        };

        if (isNewItem) {
            const newWorkItem: WorkItem = {
                id: `PROJ-${Math.floor(Math.random() * 1000) + 100}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1,
                ...itemWithTeamInfo
            } as WorkItem;
            setWorkItems(prev => [newWorkItem, ...prev]);
        } else {
            const originalItem = workItems.find(item => item.id === itemToSave.id);
            if (originalItem) {
                if (itemToSave.status && itemToSave.status !== originalItem.status) {
                    dispatchUpdateNotification({ field: 'status', from: originalItem.status, to: itemToSave.status }, itemToSave as WorkItem);
                }
                if (itemToSave.assignee && itemToSave.assignee.id !== originalItem.assignee?.id) {
                     dispatchUpdateNotification({ field: 'assignee', from: originalItem.assignee, to: itemToSave.assignee }, itemToSave as WorkItem);
                }
                if (itemToSave.dueDate !== originalItem.dueDate) {
                     dispatchUpdateNotification({ field: 'dueDate', from: originalItem.dueDate, to: itemToSave.dueDate }, itemToSave as WorkItem);
                }
            }
            setWorkItems(prev => prev.map(item => item.id === itemWithTeamInfo.id ? { ...item, ...itemWithTeamInfo, updatedAt: new Date().toISOString() } as WorkItem : item));
        }
        setEditingWorkItem(null);
        setIsNewItem(false);
    };

    const handleItemUpdate = (updatedItem: WorkItem) => {
        const originalItem = workItems.find(item => item.id === updatedItem.id);
        if (originalItem && !isEqual(originalItem.checklist, updatedItem.checklist)) {
            const completedBefore = originalItem.checklist.filter(i => i.isCompleted).length;
            const completedAfter = updatedItem.checklist.filter(i => i.isCompleted).length;
            if (completedAfter !== completedBefore) {
                dispatchUpdateNotification({ field: 'checklist', from: `${completedBefore}/${originalItem.checklist.length}`, to: `${completedAfter}/${updatedItem.checklist.length}` }, updatedItem);
            }
        }

        const updatedItemWithTimestamp = { ...updatedItem, updatedAt: new Date().toISOString() };
        setWorkItems(prev => prev.map(item => item.id === updatedItemWithTimestamp.id ? updatedItemWithTimestamp : item));
        if (selectedWorkItem && selectedWorkItem.id === updatedItem.id) {
            setSelectedWorkItem(updatedItemWithTimestamp);
        }
    };
    
    const handleItemStatusChange = (itemId: string, newStatus: Status) => {
        const originalItem = workItems.find(i => i.id === itemId);
        if (originalItem && originalItem.status !== newStatus) {
            const updatedItem: WorkItem = { ...originalItem, status: newStatus, isUpdated: true, updatedAt: new Date().toISOString() };
            
            // EP-SSR-01: Set doneInSprintId when item is completed, if not already set
            if (newStatus === Status.DONE && !originalItem.doneInSprintId) {
                updatedItem.doneInSprintId = originalItem.sprintId;
            }

            dispatchUpdateNotification({ field: 'status', from: originalItem.status, to: newStatus }, updatedItem);
            
            setWorkItems(prevItems =>
                prevItems.map(i =>
                    i.id === itemId ? updatedItem : { ...i, isUpdated: false }
                )
            );
        }
    };

    const handleNewComment = (itemId: string, commentText: string) => {
        const item = workItems.find(i => i.id === itemId);
        if (item) {
            dispatchUpdateNotification({ field: 'comment', from: null, to: commentText }, item);
        }
    };

    const handleNewEpic = () => {
        if (!activeBoard) return;
        setEditingEpic({ boardId: activeBoard.id, impact: 5, confidence: 5, ease: 5, attachments: [], status: EpicStatus.ACTIVE });
        setIsNewEpic(true);
    };
    
    const handleEditEpic = (epic: Epic) => {
        setEditingEpic(epic);
        setIsNewEpic(false);
    };

    const handleSaveEpic = (epicToSave: Partial<Epic>) => {
        const score = ((epicToSave.impact || 0) + (epicToSave.confidence || 0) + (epicToSave.ease || 0)) / 3;
        const iceScore = parseFloat(score.toFixed(2));

        if (isNewEpic) {
            const newEpic: Epic = {
                id: `epic-${Math.floor(Math.random() * 100) + 10}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attachments: epicToSave.attachments || [],
                status: EpicStatus.ACTIVE,
                color: EPIC_COLORS[epics.length % EPIC_COLORS.length],
                boardId: epicToSave.boardId!,
                name: epicToSave.name || 'Untitled Epic',
                description: epicToSave.description || '',
                description_rich: epicToSave.description_rich,
                aiSummary: epicToSave.aiSummary || '',
                ease: epicToSave.ease || 5,
                impact: epicToSave.impact || 5,
                confidence: epicToSave.confidence || 5,
                iceScore: iceScore,
            };
            setEpics(prev => [newEpic, ...prev]);
        } else {
            setEpics(prev => prev.map(item => item.id === epicToSave.id ? { ...item, ...epicToSave, iceScore, updatedAt: new Date().toISOString() } as Epic : item));
        }
        setEditingEpic(null);
        setIsNewEpic(false);
    };
    
    const handleUpdateEpicStatus = (epicId: string, newStatus: EpicStatus) => {
        setEpics(prev => prev.map(epic => {
            if (epic.id === epicId) {
                const updatedEpic = { ...epic, status: newStatus, updatedAt: new Date().toISOString() };
                if (newStatus === EpicStatus.ARCHIVED) {
                    updatedEpic.archivedAt = new Date().toISOString();
                }
                if (newStatus === EpicStatus.DELETED) { // EP-DEL-001
                    updatedEpic.deletedAt = new Date().toISOString();
                }
                return updatedEpic;
            }
            return epic;
        }));
    };

    // EP-DEL-001: Delete/Restore Handlers
    const handleConfirmDeleteEpic = (epicId: string, itemAction: 'detach') => {
        confirmAndExecute(() => {
            console.log(`TELEMETRY: epic.deleted`, { epicId, itemAction }); // Simulate telemetry
            // 1. Update related work items
            if (itemAction === 'detach') {
                setWorkItems(prev => prev.map(item => item.epicId === epicId ? { ...item, epicId: undefined, epicInfo: undefined } : item));
            }
            // 2. Soft delete the epic
            handleUpdateEpicStatus(epicId, EpicStatus.DELETED);
            // 3. Close the modal
            setDeletingEpic(null);
            // 4. Show Undo toast
            setToastQueue(prev => [{
                id: `undo-epic-${epicId}-${Date.now()}`,
                itemId: epicId,
                title: `Epic "${epics.find(e => e.id === epicId)?.name}" deleted.`,
                changes: [],
                undoAction: () => handleRestoreEpic(epicId),
            }, ...prev]);
        });
    };

    const handleRestoreEpic = (epicId: string) => {
        console.log(`TELEMETRY: epic.restored`, { epicId }); // Simulate telemetry
        // Note: Restoring items is complex. This simple restore just brings back the epic.
        handleUpdateEpicStatus(epicId, EpicStatus.ACTIVE);
    };
    
    const handleConfirmDeleteSprint = (sprintId: string, itemAction: 'unassign' | 'move', targetSprintId?: string) => {
        confirmAndExecute(() => {
            console.log(`TELEMETRY: sprint.deleted`, { sprintId, itemAction, targetSprintId }); // Simulate telemetry
            // 1. Update related work items
            if (itemAction === 'unassign') {
                setWorkItems(prev => prev.map(item => item.sprintId === sprintId ? { ...item, sprintId: undefined } : item));
            } else if (itemAction === 'move' && targetSprintId) {
                const targetSprint = sprints.find(s => s.id === targetSprintId);
                if (targetSprint) {
                    setWorkItems(prev => prev.map(item => item.sprintId === sprintId ? { ...item, sprintId: targetSprint.id } : item));
                }
            }
            // 2. Soft delete the sprint
            setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, state: SprintState.DELETED, deletedAt: new Date().toISOString() } : s));
            // 3. Close modal
            setDeletingSprint(null);
            // 4. Show Undo toast
             setToastQueue(prev => [{
                id: `undo-sprint-${sprintId}-${Date.now()}`,
                itemId: sprintId,
                title: `Sprint "${sprints.find(s => s.id === sprintId)?.name}" deleted.`,
                changes: [],
                undoAction: () => handleRestoreSprint(sprintId),
            }, ...prev]);
        });
    };

    const handleRestoreSprint = (sprintId: string) => {
        console.log(`TELEMETRY: sprint.restored`, { sprintId }); // Simulate telemetry
        setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, state: SprintState.PLANNED } : s));
    };


    // EP-SSR-01: Handle saving sprints and applying inheritance policy.
    const handleSaveSprint = (sprintToSave: Partial<Sprint>) => {
        const isNew = !sprintToSave.id;
        const sprintId = isNew ? `sprint-${Date.now()}` : sprintToSave.id!;
        
        const originalSprint = isNew ? null : sprints.find(s => s.id === sprintId);

        // 1. Determine added and removed epics
        const originalEpicIds = new Set(originalSprint?.epicIds || []);
        const newEpicIds = new Set(sprintToSave.epicIds || []);
        const addedEpicIds = [...newEpicIds].filter(id => !originalEpicIds.has(id));
        const removedEpicIds = [...originalEpicIds].filter(id => !newEpicIds.has(id));

        // 2. Prepare the final sprint object
        const finalSprint: Sprint = {
            id: sprintId,
            boardId: activeBoard!.id,
            number: isNew ? sprints.length + 1 : (originalSprint?.number || sprints.length + 1),
            name: sprintToSave.name!,
            goal: sprintToSave.goal || '',
            startAt: sprintToSave.startAt!,
            endAt: sprintToSave.endAt!,
            state: sprintToSave.state!,
            epicIds: sprintToSave.epicIds!,
        };

        // 3. Apply inheritance policy
        if (addedEpicIds.length > 0 || removedEpicIds.length > 0) {
            setWorkItems(prevItems => {
                return prevItems.map(item => {
                    // Policy A: Assign open, auto-bound/unassigned items from ADDED epics
                    if (item.epicId && addedEpicIds.includes(item.epicId)) {
                        const isUnassigned = !item.sprintId;
                        const isAutoBound = item.sprintBinding === 'auto';
                        const isNotDone = item.status !== Status.DONE;
                        
                        if ((isUnassigned || isAutoBound) && isNotDone) {
                            return { ...item, sprintId: finalSprint.id, sprintBinding: 'auto' };
                        }
                    }

                    // Policy D (simplified): Unassign open, auto-bound items from REMOVED epics
                    // that were in the sprint being edited.
                    if (item.epicId && removedEpicIds.includes(item.epicId)) {
                        const wasInThisSprint = item.sprintId === sprintId;
                        const isAutoBound = item.sprintBinding === 'auto';
                        const isNotDone = item.status !== Status.DONE;

                        if (wasInThisSprint && isAutoBound && isNotDone) {
                            return { ...item, sprintId: undefined, sprintBinding: 'auto' };
                        }
                    }
                    
                    return item;
                });
            });
        }

        // 4. Save the sprint itself
        if (isNew) {
            setSprints(prev => [...prev, finalSprint]);
        } else {
            setSprints(prev => prev.map(s => s.id === finalSprint.id ? finalSprint : s));
        }
    };
    
    const onMarkAllNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    };

    const onShowNotification = (notification: Notification) => {
        if (notification.target?.entity === 'work_item' && notification.target.id) {
            const item = workItems.find(w => w.id === notification.target!.id);
            if (item) {
                handleOpenItemForView(item.id, notification.target.section);
            } else {
                 setToastQueue(prev => [{
                    id: `toast-not-found-${Date.now()}`,
                    itemId: '',
                    title: t('item_not_found_title'),
                    changes: [t('item_not_found_body').replace('{itemId}', notification.target!.id)],
                }, ...prev]);
            }
        }
        setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, isRead: true} : n));
    };

    const handleViewEvent = (event: CalendarEvent) => {
        setViewingEvent(event);
    };
    
    const handleEditEvent = (event: CalendarEvent) => {
        setViewingEvent(null);
        setEditingEvent(event);
    };
    
    const handleAddNewEvent = () => {
        if (!user) return;
        const start = new Date();
        const end = new Date();
        end.setHours(start.getHours() + 1);
        setEditingEvent({
            title: '',
            start,
            end,
            allDay: false,
            attendees: [user],
            teamIds: []
        });
    };

    const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
        if (!user) return;
        if (eventData.id) {
            const originalEvent = allEvents.find(e => e.id === eventData.id)!;
            await calendarService.updateEvent({ ...originalEvent, ...eventData } as CalendarEvent, teams);
        } else {
            await calendarService.createEvent(eventData as any, user, teams);
        }
        setEditingEvent(null);
        await fetchAllEvents();
    };

    if (isDevRoute) {
        return <DevCrashInspector />;
    }

    if (isLegalPage) {
        return <LegalPage />;
    }

    if (!isAuthenticated) {
        if (viewState === 'LANDING') {
            return <LandingPage onStart={() => setViewState('APP')} />;
        }
        return <LoginScreen />;
    }

    if (onboardingStatus === 'NEEDS_ONBOARDING') {
        return (
            <>
                <OnboardingScreen 
                    onShowCreate={() => setOnboardingModal('CREATE_BOARD')}
                    onShowJoin={() => setOnboardingModal('JOIN_BOARD')}
                />
                {onboardingModal === 'CREATE_BOARD' && (
                    <CreateBoardModal 
                        onClose={() => setOnboardingModal(null)}
                        onCreate={(boardName) => {
                            const newBoard = createBoard(boardName);
                            setActiveBoard(newBoard.id);
                            setOnboardingStatus('COMPLETED');
                            setOnboardingModal(null);
                        }}
                    />
                )}
                 {onboardingModal === 'JOIN_BOARD' && (
                    <JoinBoardModal
                        onClose={() => setOnboardingModal(null)}
                        // FIX: Explicitly typed the 'code' parameter as a string to resolve the type error, as it was being inferred as 'unknown'.
                        onJoinRequest={(code: string) => {
                            console.log('TELEMETRY: user.join_request', { code }); // Simulate telemetry
                            setOnboardingStatus('PENDING_APPROVAL');
                            setOnboardingModal(null);
                        }}
                    />
                )}
            </>
        );
    }
    
    if (onboardingStatus === 'PENDING_APPROVAL') {
        return <PendingApprovalScreen />;
    }

    if (onboardingStatus === 'UNKNOWN' || !activeBoard) {
        return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className={`h-screen w-screen font-sans ${locale === 'fa-IR' ? 'font-vazir' : 'font-sans'}`}>
            <AppShell 
                workItems={workItems}
                onItemUpdate={handleItemUpdate}
                epics={enrichedEpics}
                teams={teams}
                setTeams={setTeams}
                sprints={sprints}
                onSaveSprint={handleSaveSprint}
                onSelectWorkItem={handleSelectWorkItem}
                notifications={notifications}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                onShowNotification={onShowNotification}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onNewItem={handleNewItem}
                onNewEpic={handleNewEpic}
                onEditEpic={handleEditEpic}
                onUpdateEpicStatus={handleUpdateEpicStatus}
                onDeleteEpic={(epic) => setDeletingEpic(epic)}
                onRestoreEpic={handleRestoreEpic}
                onDeleteSprint={(sprint) => setDeletingSprint(sprint)}
                onRestoreSprint={handleRestoreSprint}
                onEditWorkItem={handleEditWorkItem}
                onItemStatusChange={handleItemStatusChange}
                realtimeStatus={connectionStatus}
                selectedSprint={selectedSprint}
                setSelectedSprintId={setSelectedSprintId}
                availableActiveSprints={availableActiveSprints}
                onLogout={logout}
                events={allEvents}
                todaysEvents={todaysEvents}
                onViewEvent={handleViewEvent}
                onAddNewEvent={handleAddNewEvent}
                savedViews={savedViews}
                setSavedViews={setSavedViews}
            />
            
            {selectedWorkItem && (
                <WorkItemDetailModal 
                    workItem={selectedWorkItem} 
                    sprints={sprints}
                    onClose={() => setSelectedWorkItem(null)} 
                    onEdit={handleEditWorkItem}
                    onItemUpdate={handleItemUpdate}
                    onNewComment={(commentText) => handleNewComment(selectedWorkItem.id, commentText)}
                    highlightSection={highlightSection}
                />
            )}
            
            {editingWorkItem && (
                <WorkItemEditor 
                    workItem={editingWorkItem} 
                    onSave={handleSaveWorkItem} 
                    onCancel={() => setEditingWorkItem(null)} 
                    isNew={isNewItem}
                    epics={activeEpics}
                    teams={teams}
                    sprints={sprints}
                    highlightSection={highlightSection}
                    boardUsers={boardUsers}
                />
            )}

             {editingEpic && (
                <EpicEditor
                    epic={editingEpic}
                    onSave={handleSaveEpic}
                    onCancel={() => setEditingEpic(null)}
                    isNew={isNewEpic}
                    highlightSection={highlightSection}
                />
            )}

            {isSettingsModalOpen && (
                <UserSettingsModal onClose={() => setIsSettingsModalOpen(false)} />
            )}

            {deletingEpic && (
                <DeleteEpicModal 
                    epic={deletingEpic}
                    workItems={workItems}
                    onClose={() => setDeletingEpic(null)}
                    onConfirm={handleConfirmDeleteEpic}
                />
            )}
            
             {deletingSprint && (
                <DeleteSprintModal
                    sprint={deletingSprint}
                    sprints={sprints}
                    onClose={() => setDeletingSprint(null)}
                    onConfirm={handleConfirmDeleteSprint}
                />
            )}

            {viewingEvent && (
                <EventViewModal
                    event={viewingEvent}
                    workItems={workItems}
                    onClose={() => setViewingEvent(null)}
                    onEdit={handleEditEvent}
                    onOpenWorkItem={(itemId) => {
                        const item = workItems.find(wi => wi.id === itemId);
                        if (item) {
                            setViewingEvent(null); // Close current modal
                            handleSelectWorkItem(item); // Open read-only detail modal
                        }
                    }}
                />
            )}

            {editingEvent && (
                <EventEditorModal
                    event={editingEvent}
                    workItems={workItems}
                    teams={teams}
                    onSave={handleSaveEvent}
                    onClose={() => setEditingEvent(null)}
                />
            )}

            <ToastManager
                toasts={toastQueue}
                onDismiss={(id) => setToastQueue(q => q.filter(t => t.id !== id))}
                onOpen={handleOpenItemForView}
            />

            {isReAuthModalOpen && (
                <ReAuthModal
                    onClose={() => setIsReAuthModalOpen(false)}
                    onSuccess={handleReAuthSuccess}
                />
            )}
        </div>
    );
};

export default App;