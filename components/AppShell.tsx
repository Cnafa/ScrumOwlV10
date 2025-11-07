// components/AppShell.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FilterBar } from './FilterBar';
import { KanbanBoard } from './KanbanBoard';
import { EpicsView } from './EpicsView';
import { ItemsView } from './ItemsView';
import { MembersView } from './MembersView';
import { EventsView } from './EventsView';
import { SprintsView } from './SprintsView';
import { ReportsDashboard } from './ReportsDashboard';
import { SettingsPlaceholder } from './SettingsPlaceholder';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { WorkItem, Notification, Epic, FilterSet, SavedView, ViewVisibility, Team, Sprint, SprintState, Status, EpicStatus, CalendarEvent, WorkItemType } from '../types';
import { SaveViewModal } from './SaveViewModal';
import { ManageViewsModal } from './ManageViewsModal';
import { faker } from 'https://cdn.skypack.dev/@faker-js/faker';
import { ALL_USERS, WORK_ITEM_TYPES, ALL_TEAMS } from '../constants';
import { TodaysMeetingsBanner } from './TodaysMeetingsBanner';
import { useBoard } from '../context/BoardContext';
import { useLocale } from '../context/LocaleContext';

interface AppShellProps {
    workItems: WorkItem[];
    onItemUpdate: (item: WorkItem) => void;
    epics: Epic[];
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    sprints: Sprint[];
    onSaveSprint: (sprint: Partial<Sprint>) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    notifications: Notification[];
    onMarkAllNotificationsRead: () => void;
    onShowNotification: (notification: Notification) => void;
    onOpenSettings: () => void;
    onNewItem: (options?: { epicId?: string }) => void;
    onNewEpic: () => void;
    onEditEpic: (epic: Epic) => void;
    onUpdateEpicStatus: (epicId: string, newStatus: EpicStatus) => void;
    onDeleteEpic: (epic: Epic) => void; // EP-DEL-001
    onRestoreEpic: (epicId: string) => void; // EP-DEL-001
    onDeleteSprint: (sprint: Sprint) => void; // EP-DEL-001
    onRestoreSprint: (sprintId: string) => void; // EP-DEL-001
    onEditWorkItem: (workItem: WorkItem) => void;
    onItemStatusChange: (itemId: string, newStatus: Status) => void;
    realtimeStatus: any; // ConnectionStatus
    // FIX: Add sprint state props from App
    selectedSprint: Sprint | null | undefined;
    setSelectedSprintId: (sprintId: string | null) => void;
    availableActiveSprints: Sprint[];
    onLogout: () => void;
    events: CalendarEvent[];
    todaysEvents: CalendarEvent[];
    onViewEvent: (event: CalendarEvent) => void;
    onAddNewEvent: () => void;
    savedViews: SavedView[];
    setSavedViews: React.Dispatch<React.SetStateAction<SavedView[]>>;
}

export const AppShell: React.FC<AppShellProps> = (props) => {
    const { user } = useAuth();
    const { can, activeBoardMembers } = useBoard();
    const { t } = useLocale();
    const { currentView, setCurrentView } = useNavigation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // View Management State
    const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
    const [isManageViewsModalOpen, setIsManageViewsModalOpen] = useState(false);

    // Filter and Grouping State
    // US-45: Updated filter state for multi-type
    const [filterSet, setFilterSet] = useState<FilterSet>({ searchQuery: '', assigneeIds: [], assigneeMatch: 'any', typeIds: [], teamIds: [] });
    const [groupBy, setGroupBy] = useState<'status' | 'epic'>('epic');
    const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());
    const [includeUnassignedEpicItems, setIncludeUnassignedEpicItems] = useState(false);

    const boardUsers = useMemo(() => activeBoardMembers.map(m => m.user), [activeBoardMembers]);

    const { selectedSprint, savedViews, setSavedViews, epics: enrichedEpics } = props;

    const sprintAndEpicFilteredItems = useMemo(() => {
        // If not on the Kanban view or no sprint is selected, show nothing.
        if (currentView !== 'KANBAN' || !selectedSprint) {
            return [];
        }

        // First, get all items belonging to the selected sprint.
        const itemsInSprint = props.workItems.filter(item => item.sprintId === selectedSprint.id);

        // If grouping by status, no further epic filtering is needed.
        if (groupBy === 'status') {
          return itemsInSprint;
        }
    
        // When grouping by epic, apply the more complex filtering logic.
        const sprintEpicIds = new Set(selectedSprint.epicIds);
        
        return itemsInSprint.filter(item => {
            // Check if the item's epic is one of the epics planned for this sprint.
            const isPlannedEpicItem = item.epicId && sprintEpicIds.has(item.epicId);

            // Items belonging to planned epics should always be shown in this view.
            if (isPlannedEpicItem) {
                return true;
            }
            
            // For all other items (no epic, or an epic not planned for the sprint),
            // their visibility is controlled by the "include items without epic" checkbox.
            return includeUnassignedEpicItems;
        });
    }, [props.workItems, selectedSprint, currentView, includeUnassignedEpicItems, groupBy]);

    const filteredWorkItems = useMemo(() => {
        return sprintAndEpicFilteredItems.filter(item => {
            const searchMatch = !filterSet.searchQuery ||
                item.title.toLowerCase().includes(filterSet.searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(filterSet.searchQuery.toLowerCase());
            
            const typeMatch = filterSet.typeIds.length === 0 || filterSet.typeIds.includes(item.type);

            const teamMatch = filterSet.teamIds.length === 0 || (item.teamId ? filterSet.teamIds.includes(item.teamId) : false);

            let assigneeMatch = true;
            if (filterSet.assigneeIds.length > 0) {
                const itemAssigneeIds = new Set(item.assignees?.map(a => a.id) || []);
                if (filterSet.assigneeMatch === 'any') {
                    assigneeMatch = filterSet.assigneeIds.some(id => itemAssigneeIds.has(id));
                } else { // 'all'
                    assigneeMatch = filterSet.assigneeIds.every(id => itemAssigneeIds.has(id));
                }
            }

            return searchMatch && assigneeMatch && typeMatch && teamMatch;
        });
    }, [sprintAndEpicFilteredItems, filterSet]);
    
    const handleFilterChange = (newFilters: FilterSet) => {
        setFilterSet(newFilters);
    };

    const handleResetFilters = () => {
        // US-45: Reset new filter structure with multi-type
        setFilterSet({ searchQuery: '', assigneeIds: [], assigneeMatch: 'any', typeIds: [], teamIds: [] });
        setIncludeUnassignedEpicItems(false);
    };

    const handleToggleEpic = useCallback((epicId: string) => {
        setCollapsedEpics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(epicId)) {
                newSet.delete(epicId);
            } else {
                newSet.add(epicId);
            }
            return newSet;
        });
    }, []);
    
    const handleSaveView = (name: string, visibility: ViewVisibility) => {
        if (!user) return;
        const newView: SavedView = {
            id: `view-${Date.now()}`,
            name,
            visibility,
            ownerId: user.id,
            filterSet: { ...filterSet },
            isDefault: false,
            isPinned: false,
        };
        setSavedViews(prev => [...prev, newView]);
        setIsSaveViewModalOpen(false);
    };

    const handleDeleteView = (viewId: string) => {
        setSavedViews(prev => prev.filter(v => v.id !== viewId));
    };

    const handlePinView = (viewId: string) => {
        setSavedViews(prev => prev.map(v => v.id === viewId ? { ...v, isPinned: !v.isPinned } : v));
    };
    
    const handleSetDefaultView = (viewId: string) => {
        setSavedViews(prev => prev.map(v => ({ ...v, isDefault: v.id === viewId })));
    };

    const handleRenameView = (viewId: string, newName: string) => {
        setSavedViews(prev => prev.map(v => v.id === viewId ? { ...v, name: newName } : v));
    };

    const handleDuplicateView = (viewToDuplicate: SavedView) => {
        if (!user) return;
        const newView: SavedView = {
            ...viewToDuplicate,
            id: `view-${Date.now()}`,
            name: `${viewToDuplicate.name} (Copy)`,
            ownerId: user.id,
            isDefault: false,
            isPinned: false,
        };
        setSavedViews(prev => [...prev, newView]);
    };

    const handleSelectView = (view: SavedView) => {
        setFilterSet(view.filterSet);
    };

    const pinnedViews = useMemo(() => savedViews.filter(v => v.isPinned && v.ownerId === user?.id), [savedViews, user]);
    
    const renderContent = () => {
        switch (currentView) {
            case 'KANBAN':
                if (!can('sprint.manage') && props.availableActiveSprints.length === 0) {
                     return (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-8 bg-white/60 rounded-lg">
                                <h3 className="text-base font-semibold text-slate-800">{t('appshell_noActiveSprints_title')}</h3>
                                <p className="mt-2 text-sm text-slate-600">{t('appshell_noActiveSprints_body')}</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <KanbanBoard
                        workItems={filteredWorkItems}
                        onItemStatusChange={props.onItemStatusChange}
                        onSelectWorkItem={props.onSelectWorkItem}
                        groupBy={groupBy}
                        epics={enrichedEpics}
                        collapsedEpics={collapsedEpics}
                        onToggleEpic={handleToggleEpic}
                        activeSprint={selectedSprint}
                        filterSet={filterSet}
                        onNewItem={props.onNewItem}
                    />
                );
            case 'ITEMS':
                return <ItemsView 
                    workItems={props.workItems} 
                    epics={enrichedEpics}
                    sprints={props.sprints}
                    onItemUpdate={props.onItemUpdate}
                    onSelectWorkItem={props.onSelectWorkItem}
                />;
            case 'SPRINTS':
                return (
                    <SprintsView 
                        sprints={props.sprints}
                        workItems={props.workItems}
                        onSaveSprint={props.onSaveSprint}
                        onDeleteSprint={props.onDeleteSprint}
                        onRestoreSprint={props.onRestoreSprint}
                        epics={enrichedEpics}
                    />
                );
            case 'EPICS':
                 return (
                    <EpicsView
                        epics={enrichedEpics}
                        workItems={props.workItems}
                        onNewEpic={props.onNewEpic}
                        onEditEpic={props.onEditEpic}
                        onNewItem={props.onNewItem}
                        onSelectWorkItem={props.onSelectWorkItem}
                        onUpdateStatus={props.onUpdateEpicStatus}
                        onDeleteEpic={props.onDeleteEpic}
                        onRestoreEpic={props.onRestoreEpic}
                    />
                 );
            case 'EVENTS':
                return <EventsView workItems={props.workItems} teams={props.teams} events={props.events} onViewEvent={props.onViewEvent} onAddNewEvent={props.onAddNewEvent} />;
            case 'REPORTS':
                return (
                    <ReportsDashboard 
                        workItems={props.workItems}
                        epics={enrichedEpics}
                        teams={props.teams}
                        users={boardUsers}
                        sprints={props.sprints}
                    />
                );
            case 'MEMBERS':
                return <MembersView teams={props.teams} setTeams={props.setTeams} />;
            case 'SETTINGS':
                 return <SettingsPlaceholder />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-100">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                pinnedViews={pinnedViews}
                onSelectView={handleSelectView}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    notifications={props.notifications}
                    onMarkAllNotificationsRead={props.onMarkAllNotificationsRead}
                    onShowNotification={props.onShowNotification}
                    onOpenSettings={props.onOpenSettings}
                    onLogout={props.onLogout}
                    realtimeStatus={props.realtimeStatus}
                    onNewItem={() => props.onNewItem()}
                    availableSprints={props.availableActiveSprints}
                    selectedSprint={selectedSprint}
                    onSelectSprint={props.setSelectedSprintId}
                />
                
                {currentView === 'KANBAN' && (
                    <FilterBar
                        filterSet={filterSet}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        onOpenSaveViewModal={() => setIsSaveViewModalOpen(true)}
                        onOpenManageViewsModal={() => setIsManageViewsModalOpen(true)}
                        teams={props.teams}
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                        activeSprint={selectedSprint}
                        includeUnassignedEpicItems={includeUnassignedEpicItems}
                        onIncludeUnassignedEpicItemsChange={setIncludeUnassignedEpicItems}
                    />
                )}

                <main className="flex-1 p-3 overflow-auto flex flex-col">
                    {currentView === 'KANBAN' && props.todaysEvents.length > 0 && (
                        <TodaysMeetingsBanner
                            events={props.todaysEvents}
                            onOpenEvent={props.onViewEvent}
                        />
                    )}
                    {renderContent()}
                </main>
            </div>
            
            <SaveViewModal
                isOpen={isSaveViewModalOpen}
                onClose={() => setIsSaveViewModalOpen(false)}
                onSave={handleSaveView}
                savedViews={savedViews}
                currentUser={user}
            />

            <ManageViewsModal
                isOpen={isManageViewsModalOpen}
                onClose={() => setIsManageViewsModalOpen(false)}
                savedViews={savedViews}
                onDelete={handleDeleteView}
                onPin={handlePinView}
                onSetDefault={handleSetDefaultView}
                onRename={handleRenameView}
                onDuplicate={handleDuplicateView}
                onSelectView={handleSelectView}
            />
        </div>
    );
};