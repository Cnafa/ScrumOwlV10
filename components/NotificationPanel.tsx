



import React from 'react';
import { Notification, NotificationType, DisplayUser } from '../types';
import { useLocale } from '../context/LocaleContext';
// FIX: Replace non-existent UserIcon with UserRoundIcon.
import { UserRoundIcon } from './icons';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllAsRead: () => void;
    onShow: (notification: Notification) => void;
}

const timeAgo = (timestamp: string, locale: string): string => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(interval), 'year');
    interval = seconds / 2592000;
    if (interval > 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(interval), 'month');
    interval = seconds / 86400;
    if (interval > 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(interval), 'day');
    interval = seconds / 3600;
    if (interval > 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(interval), 'hour');
    interval = seconds / 60;
    if (interval > 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(interval), 'minute');
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(seconds), 'second');
};

const NotificationItem: React.FC<{ notification: Notification; onShow: (notification: Notification) => void }> = ({ notification, onShow }) => {
    const { t, locale } = useLocale();
    
    const notificationMessageKey = `notification_${notification.type}` as `notification_${NotificationType}`;
    const messageTemplate = t(notificationMessageKey) || '';
    const message = messageTemplate
        .replace('{actorName}', notification.actor.name)
        .replace('{workItemId}', notification.workItem.id);
    
    const handleShow = () => {
        onShow(notification);
    };

    return (
        <div className={`p-3 border-s-4 ${notification.isRead ? 'border-transparent' : 'border-[#486966] bg-[#486966]/10'}`}>
            <div className="flex items-start gap-3">
                <div className="mt-1">
                    {notification.actor.avatarUrl ? (
                        <img src={notification.actor.avatarUrl} alt={notification.actor.name} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[#B2BEBF] flex items-center justify-center">
                            {/* FIX: Use UserRoundIcon instead of UserIcon. */}
                            <UserRoundIcon className="w-5 h-5 text-[#889C9B]" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-[#3B3936] text-start" dangerouslySetInnerHTML={{ __html: message }} />
                    <time className="text-xs text-[#889C9B]">{timeAgo(notification.timestamp, locale)}</time>
                </div>
            </div>
             <div className="mt-2 text-end">
                <button onClick={handleShow} className="text-xs font-semibold text-[#486966] hover:underline px-2 py-1 rounded hover:bg-gray-200">
                    {t('show')}
                </button>
            </div>
        </div>
    );
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkAllAsRead, onShow }) => {
    const { t } = useLocale();
    
    const handleShowAndClose = (notification: Notification) => {
        onShow(notification);
        onClose();
    };

    return (
        <div 
            className="absolute top-full end-0 mt-2 w-80 max-w-sm bg-white rounded-md shadow-lg border border-[#B2BEBF] z-50"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-3 border-b border-[#B2BEBF]">
                <h3 className="font-semibold text-md text-[#3B3936]">{t('notifications')}</h3>
                <button 
                    onClick={onMarkAllAsRead} 
                    className="text-xs font-medium text-[#486966] hover:underline"
                    disabled={notifications.every(n => n.isRead)}
                >
                    {t('markAllAsRead')}
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[#B2BEBF]">
                {notifications.length > 0 ? (
                    notifications.map(n => <NotificationItem key={n.id} notification={n} onShow={handleShowAndClose} />)
                ) : (
                    <p className="p-4 text-sm text-center text-[#889C9B]">{t('noNotifications')}</p>
                )}
            </div>
        </div>
    );
};