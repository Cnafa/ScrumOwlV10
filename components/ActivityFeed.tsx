import React, { useState, useEffect, useRef } from 'react';
import { ActivityItem, Comment, TransitionLog, DisplayUser } from '../types';
// FIX: Replaced non-existent icons with available ones: ArrowRightIcon -> ChevronRightIcon, ChatBubbleLeftIcon -> FileTextIcon, UserIcon -> UserRoundIcon.
import { ChevronRightIcon, FileTextIcon, UserRoundIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';

interface ActivityFeedProps {
    activities: ActivityItem[];
    onUpdateComment: (commentId: string, newContent: string) => void;
    onDeleteComment: (commentId: string) => void;
    highlightSection?: string;
}

const UserDisplay: React.FC<{ user: DisplayUser }> = ({ user }) => (
    <div className="flex items-center gap-2">
        {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
        ) : (
            <div className="w-6 h-6 rounded-full bg-[#B2BEBF] flex items-center justify-center">
                {/* FIX: Use UserRoundIcon instead of UserIcon. */}
                <UserRoundIcon className="w-4 h-4 text-[#889C9B]" />
            </div>
        )}
        <span className="font-semibold text-[#3B3936]">{user.name}</span>
    </div>
);

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

const renderCommentContent = (comment: Comment) => {
    let content = comment.content;

    // Sanitize by escaping HTML
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Apply simple markdown
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Highlight mentions
    if (comment.mentions) {
        comment.mentions.forEach(mention => {
            const mentionRegex = new RegExp(`@${mention.name}`, 'g');
            content = content.replace(mentionRegex, `<span class="font-semibold text-[#486966] bg-[#486966]/20 px-1 rounded">@${mention.name}</span>`);
        });
    }

    return { __html: content };
};


export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onUpdateComment, onDeleteComment, highlightSection }) => {
    const { t, locale } = useLocale();
    const { user: currentUser } = useAuth();
    const [editingComment, setEditingComment] = useState<{ id: string, content: string } | null>(null);
    const highlightedRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (highlightSection?.startsWith('comment:') && highlightedRef.current) {
            const element = highlightedRef.current;
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('animate-highlight-pulse');
            const timer = setTimeout(() => {
                element.classList.remove('animate-highlight-pulse');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [highlightSection, activities]);


    const handleSaveEdit = () => {
        if (!editingComment) return;
        onUpdateComment(editingComment.id, editingComment.content);
        setEditingComment(null);
    };

    return (
        <div className="space-y-6">
            {activities.map(activity => {
                const { data } = activity;
                const key = `${activity.type}-${data.id}`;

                if (activity.type === 'COMMENT') {
                    const comment = data as Comment;
                    const isAuthor = currentUser?.name === comment.user.name;
                    const isEditable = (new Date().getTime() - new Date(comment.timestamp).getTime()) < 15 * 60 * 1000;
                    const canEditOrDelete = isAuthor && isEditable;
                    const isHighlighted = highlightSection === `comment:${comment.id}`;

                    return (
                        <div key={key} className="flex gap-3" ref={isHighlighted ? highlightedRef : null} data-highlight-key={`comment:${comment.id}`}>
                            <div className="flex-shrink-0 mt-1">
                                {/* FIX: Use FileTextIcon instead of ChatBubbleLeftIcon. */}
                                <FileTextIcon className="w-5 h-5 text-[#889C9B]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <UserDisplay user={comment.user} />
                                    <div className="flex items-center gap-2">
                                        <time className="text-xs text-[#889C9B]">{timeAgo(comment.timestamp, locale)}</time>
                                        {canEditOrDelete && editingComment?.id !== comment.id && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingComment({ id: comment.id, content: comment.content })} className="text-xs text-[#486966] hover:underline">{t('edit')}</button>
                                                <button onClick={() => onDeleteComment(comment.id)} className="text-xs text-[#BD2A2E] hover:underline">{t('delete')}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {editingComment?.id === comment.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            value={editingComment.content}
                                            onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                            className="w-full p-2 border border-[#889C9B] rounded-md focus:ring-2 focus:ring-[#486966] focus:border-[#486966] transition text-[#3B3936] bg-gray-50 shadow-sm text-sm"
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={() => setEditingComment(null)} className="py-1 px-3 text-sm rounded-md border border-[#889C9B]">{t('cancel')}</button>
                                            <button onClick={handleSaveEdit} className="py-1 px-3 text-sm rounded-md text-white bg-[#486966]">{t('save')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="mt-2 p-3 bg-[#B2BEBF]/50 rounded-lg text-sm text-[#486966]"
                                        dangerouslySetInnerHTML={renderCommentContent(comment)}
                                    />
                                )}
                            </div>
                        </div>
                    );
                }

                if (activity.type === 'TRANSITION') {
                    const transition = data as TransitionLog;
                    return (
                        <div key={key} className="flex gap-3 items-center">
                            <div className="flex-shrink-0">
                                {/* FIX: Use UserRoundIcon instead of UserIcon. */}
                                <UserRoundIcon className="w-5 h-5 text-[#889C9B]" />
                            </div>
                            <div className="flex-1 text-sm text-[#486966]">
                                <span className="font-semibold text-[#3B3936]">{transition.user.name}</span> {t('transitioned')}
                                <span className="font-semibold mx-1">{transition.fromStatus}</span>
                                {/* FIX: Use ChevronRightIcon instead of ArrowRightIcon. */}
                                <ChevronRightIcon className="inline w-3 h-3 mx-1" />
                                <span className="font-semibold mx-1">{transition.toStatus}</span>
                                <time className="text-xs text-[#889C9B] ml-2">{timeAgo(transition.timestamp, locale)}</time>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};