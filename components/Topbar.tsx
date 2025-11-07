// components/Topbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Notification, ConnectionStatus, Sprint } from '../types';
import { NotificationPanel } from './NotificationPanel';
import { QuickSwitcher } from './QuickSwitcher';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useBoard } from '../context/BoardContext';
import { useNavigation } from '../context/NavigationContext';
import { BellIcon, PowerIcon, ChevronLeftIcon, ChevronRightIcon, UserRoundIcon, SettingsIcon } from './icons';

interface TopbarProps {
    notifications: Notification[];
    onMarkAllNotificationsRead: () => void;
    onShowNotification: (notification: Notification) => void;
    onOpenSettings: () => void;
    onLogout: () => void;
    realtimeStatus: ConnectionStatus;
    onNewItem: () => void;
    availableSprints: Sprint[];
    selectedSprint: Sprint | null;
    onSelectSprint: (sprintId: string | null) => void;
}

const ConnectionIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    const colorMap: Record<ConnectionStatus, string> = {
        'CONNECTED': 'bg-green-500',
        'DISCONNECTED': 'bg-gray-400',
        'CONNECTING': 'bg-yellow-400 animate-pulse',
        'ERROR': 'bg-red-500',
    };
    return <span className={`w-2 h-2 rounded-full ${colorMap[status]}`} title={`Real-time: ${status}`}></span>;
};

const calculateDaysLeft = (endDateString: string, t: Function): string => {
    const end = new Date(endDateString);
    const now = new Date();
    end.setHours(23, 59, 59, 999);
    
    const diffTime = end.getTime() - now.getTime();
    if (diffTime < 0) {
        const pastDiffDays = Math.ceil(-diffTime / (1000 * 60 * 60 * 24));
        return t('sprint_ended_ago').replace('{days}', pastDiffDays.toString());
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (new Date().toDateString() === end.toDateString()) {
        return t('sprint_ends_today');
    }

    return t('sprint_days_left').replace('{days}', diffDays.toString());
};


const SprintPlaque: React.FC<{
    sprints: Sprint[];
    selected: Sprint;
    onSelect: (id: string | null) => void;
    locale: string;
    t: Function;
}> = ({ sprints, selected, onSelect, locale, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const selectedIndex = sprints.findIndex(s => s.id === selected.id);
    const canGoPrev = selectedIndex > 0;
    const canGoNext = selectedIndex < sprints.length - 1;
    
    const navigate = (direction: -1 | 1) => {
        const newIndex = selectedIndex + direction;
        if (newIndex >= 0 && newIndex < sprints.length) {
            onSelect(sprints[newIndex].id);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);
    
    const localeCode = locale.startsWith('fa') ? 'fa-IR' : 'en-US';
    const startDate = new Date(selected.startAt).toLocaleDateString(localeCode, { month: 'short', day: 'numeric' });
    const endDate = new Date(selected.endAt).toLocaleDateString(localeCode, { month: 'short', day: 'numeric' });

    return (
        <div className="relative flex items-center gap-1" ref={wrapperRef}>
            <button onClick={() => navigate(-1)} disabled={!canGoPrev} className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeftIcon className="w-4 h-4 text-slate-600 rtl:scale-x-[-1]"/>
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-200">
                <span className="font-semibold text-slate-800">{selected.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">{startDate} – {endDate}</span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-primary">{calculateDaysLeft(selected.endAt, t)}</span>
            </button>
             <button onClick={() => navigate(1)} disabled={!canGoNext} className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRightIcon className="w-4 h-4 text-slate-600 rtl:scale-x-[-1]"/>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-64 bg-white rounded-md shadow-lg border z-10 text-start">
                    <ul className="py-1">
                        {sprints.map(sprint => (
                            <li key={sprint.id}>
                                <a href="#" onClick={(e) => { e.preventDefault(); onSelect(sprint.id); setIsOpen(false); }}
                                    className={`block px-3 py-1.5 text-sm ${selected.id === sprint.id ? 'font-bold text-primary bg-primarySoft' : 'text-slate-700 hover:bg-slate-100'}`}>
                                    {sprint.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export const Topbar: React.FC<TopbarProps> = ({ notifications, onMarkAllNotificationsRead, onShowNotification, onOpenSettings, onLogout, realtimeStatus, onNewItem, availableSprints, selectedSprint, onSelectSprint }) => {
    const { user } = useAuth();
    const { t, locale, setLocale } = useLocale();
    const { can } = useBoard();
    const { currentView } = useNavigation();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsSwitcherOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

    const closeNotifications = () => setIsNotificationsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                closeNotifications();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageToggle = () => {
        setLocale(locale === 'en-US' ? 'fa-IR' : 'en-US');
    };

    return (
        <>
        <header className="relative z-30 flex-shrink-0 bg-white/70 backdrop-blur-sm h-14 flex items-center justify-between px-4 border-b border-slate-200/80">
            <div className="flex items-center">
                <Breadcrumbs />
                {selectedSprint && currentView === 'KANBAN' && (
                    <div className="ms-4 ps-4 border-s">
                         <SprintPlaque 
                            sprints={availableSprints}
                            selected={selectedSprint}
                            onSelect={onSelectSprint}
                            locale={locale}
                            t={t}
                        />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                {currentView !== 'EPICS' && can('item.create') && (
                     <button 
                        onClick={onNewItem} 
                        className="py-1.5 px-3 text-sm font-medium rounded-md text-white bg-primary hover:bg-[#3a5a58]"
                    >
                        {t('newItem')}
                    </button>
                )}
                
                <div className="h-5 w-px bg-slate-200" />
                
                <button onClick={handleLanguageToggle} title="Switch language / تغییر زبان" className="text-sm font-semibold text-slate-600 hover:bg-slate-200/80 px-2 py-1 rounded-md">
                    {locale === 'en-US' ? 'fa' : 'en'}
                </button>

                <div className="flex items-center gap-2 text-sm text-slate-800">
                    <ConnectionIndicator status={realtimeStatus} />
                    <span>{user?.name}</span>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center"><UserRoundIcon className="w-4 h-4 text-slate-500" /></div>
                    )}
                </div>

                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-slate-200/80 relative" title={t('notifications')}>
                        <BellIcon className="h-5 w-5 text-slate-600" />
                        {unreadCount > 0 && <span className="absolute top-1 end-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
                    </button>
                    {isNotificationsOpen && (
                        <NotificationPanel notifications={notifications} onClose={closeNotifications} onMarkAllAsRead={onMarkAllNotificationsRead} onShow={onShowNotification} />
                    )}
                </div>
                <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-slate-200/80" title={t('settings')}><SettingsIcon className="h-5 w-5 text-slate-600" /></button>
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-slate-200/80" title={t('logout')}><PowerIcon className="h-5 w-5 text-slate-600" /></button>
            </div>
            <QuickSwitcher isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
        </header>
        {isNotificationsOpen && (
             <div className="fixed top-14 left-0 right-0 bottom-0 bg-black bg-opacity-10 z-20" onClick={closeNotifications} />
        )}
        </>
    );
};