import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useLocale } from '../context/LocaleContext';
import { SavedView } from '../types';
import { ScrumOwlLogo, UsersIcon, LayoutKanbanIcon, RepeatIcon, MountainIcon, CalendarRangeIcon, BarChart3Icon, UsersRoundIcon, BookmarkCheckIcon, ChevronLeftIcon, FileTextIcon } from './icons';
import { useBoard } from '../context/BoardContext';
import { BoardSwitcher } from './BoardSwitcher';

interface NavItemProps {
    view: 'KANBAN' | 'ITEMS' | 'EPICS' | 'EVENTS' | 'REPORTS' | 'MEMBERS' | 'SPRINTS';
    label: string;
    icon: React.ReactNode;
    isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon, isCollapsed }) => {
    const { currentView, setCurrentView } = useNavigation();
    const isActive = currentView === view;
    
    return (
        <button
            onClick={() => setCurrentView(view)}
            title={isCollapsed ? label : undefined}
            className={`flex items-center w-full h-10 px-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-700 hover:bg-slate-200/50'
            }`}
        >
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
            {!isCollapsed && <span className="ms-3 text-sm font-medium">{label}</span>}
        </button>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    pinnedViews: SavedView[];
    onSelectView: (view: SavedView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, pinnedViews, onSelectView }) => {
    const { t } = useLocale();
    const { can } = useBoard();
    
    return (
        <aside className={`flex flex-col bg-slate-50/80 backdrop-blur-sm border-e border-slate-200/80 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}>
            <div className={`h-14 flex items-center border-b border-slate-200/80 ${isCollapsed ? 'justify-center' : 'px-3'}`}>
                 <div className="flex items-center gap-2 overflow-hidden">
                    {isCollapsed ? (
                        <div className="font-sans font-bold text-2xl text-slate-800">
                            <span className="text-primary">S</span>O
                        </div>
                    ) : (
                        <ScrumOwlLogo className="text-lg whitespace-nowrap" />
                    )}
                </div>
            </div>

            <div className="p-2 border-b border-slate-200/80">
                <BoardSwitcher isCollapsed={isCollapsed} />
            </div>

            <nav className="flex-1 p-2 space-y-1.5">
                <NavItem view="KANBAN" label={t('sprintBoard')} isCollapsed={isCollapsed} icon={<LayoutKanbanIcon />}/>
                <NavItem view="ITEMS" label={t('itemsView')} isCollapsed={isCollapsed} icon={<FileTextIcon />}/>
                {can('sprint.manage') && (
                    <NavItem view="SPRINTS" label={t('sprints')} isCollapsed={isCollapsed} icon={<RepeatIcon />}/>
                )}
                {can('epic.manage') && (
                    <NavItem view="EPICS" label={t('epics')} isCollapsed={isCollapsed} icon={<MountainIcon />}/>
                )}
                <NavItem view="EVENTS" label={t('eventsView')} isCollapsed={isCollapsed} icon={<CalendarRangeIcon />}/>
                <NavItem view="REPORTS" label={t('reportsDashboard')} isCollapsed={isCollapsed} icon={<BarChart3Icon />}/>
                
                {can('member.manage') && (
                    <NavItem view="MEMBERS" label={t('membersAndRoles')} isCollapsed={isCollapsed} icon={<UsersIcon />} />
                )}
                
                {pinnedViews.length > 0 && (
                    <div className="pt-2 mt-2 border-t">
                        {!isCollapsed && <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Pinned Views</h3>}
                        {pinnedViews.map(view => (
                             <button
                                key={view.id}
                                onClick={() => onSelectView(view)}
                                title={view.name}
                                className="flex items-center w-full h-10 px-3 rounded-lg text-slate-700 hover:bg-slate-200/50"
                            >
                                <BookmarkCheckIcon className="h-4 w-4 flex-shrink-0 text-slate-500"/>
                                {!isCollapsed && <span className="ms-3 text-sm font-medium truncate">{view.name}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </nav>
            <div className="p-2 border-t border-slate-200/80">
                <button onClick={onToggle} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-slate-200/50">
                    <ChevronLeftIcon className={`w-5 h-5 text-slate-600 transition-transform duration-300 rtl:scale-x-[-1] ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </aside>
    );
};