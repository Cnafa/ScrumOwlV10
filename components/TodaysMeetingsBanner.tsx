// components/TodaysMeetingsBanner.tsx
import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { useLocale } from '../context/LocaleContext';
import { CalendarDaysIcon, ChevronRightIcon } from './icons';

interface TodaysMeetingsBannerProps {
    events: CalendarEvent[];
    onOpenEvent: (event: Partial<CalendarEvent>) => void;
}

const EventItem: React.FC<{ event: CalendarEvent, onOpenEvent: (event: Partial<CalendarEvent>) => void, t: Function }> = ({ event, onOpenEvent, t }) => {
    const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-amber-200/50">
            <button onClick={() => onOpenEvent(event)} className="flex items-center gap-2 text-left flex-1 truncate">
                <span className="font-semibold text-amber-800">{startTime}</span>
                <span className="text-amber-900 truncate">{event.title}</span>
            </button>
            {event.onlineLink && (
                <a 
                    href={event.onlineLink}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={e => e.stopPropagation()}
                    className="ml-2 flex-shrink-0 text-xs font-bold text-white bg-primary hover:bg-[#3a5a58] px-3 py-1 rounded-full"
                >
                    {t('join_meeting')}
                </a>
            )}
        </div>
    );
};

export const TodaysMeetingsBanner: React.FC<TodaysMeetingsBannerProps> = ({ events, onOpenEvent }) => {
    const { t } = useLocale();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const visibleEvents = isExpanded ? events : events.slice(0, 1);
    const hiddenCount = events.length - visibleEvents.length;

    return (
        <div className="mb-3 flex-shrink-0 bg-amber-100 border border-amber-200 rounded-lg text-sm text-amber-900 shadow-sm">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-amber-700"/>
                    <span className="font-bold text-amber-800">{t('todays_meetings')}:</span>
                    <div className="flex items-center gap-3">
                        {visibleEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-2">
                                <button onClick={() => onOpenEvent(event)} className="hover:underline truncate max-w-[200px]">{event.title}</button>
                                {event.onlineLink && (
                                     <a 
                                        href={event.onlineLink}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()} 
                                        className="text-xs font-semibold text-white bg-primary/80 hover:bg-primary px-2 py-0.5 rounded-full"
                                    >
                                        {t('join_meeting')}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                     {hiddenCount > 0 && !isExpanded && (
                        <button onClick={() => setIsExpanded(true)} className="text-xs font-semibold bg-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-300">
                            {t('more_meetings').replace('{count}', hiddenCount.toString())}
                        </button>
                     )}
                </div>
                 <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-full hover:bg-amber-200">
                    <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                </button>
            </div>
            {isExpanded && (
                <div className="border-t border-amber-200 p-2 space-y-1">
                    {events.map(event => (
                        <EventItem key={event.id} event={event} onOpenEvent={onOpenEvent} t={t} />
                    ))}
                </div>
            )}
        </div>
    );
};