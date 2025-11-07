import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { SavedView, ViewVisibility, User, Team, WorkItemType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ALL_USERS, ALL_TEAMS } from '../constants';
import { XMarkIcon, MagnifyingGlassIcon, StarIcon, CheckCircleIcon, LockClosedIcon, UsersIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon } from './icons';

interface ManageViewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedViews: SavedView[];
    onDelete: (viewId: string) => void;
    onPin: (viewId: string) => void;
    onSetDefault: (viewId: string) => void;
    onRename: (viewId: string, newName: string) => void;
    onDuplicate: (view: SavedView) => void;
    onSelectView: (view: SavedView) => void; // For "Open Preview"
}

type Tab = 'MY_VIEWS' | 'GROUP_VIEWS';

// --- Helper Hooks ---
const useBodyScrollLock = (isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);
};

const useFocusTrap = (ref: React.RefObject<HTMLElement>, isOpen: boolean) => {
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen || !ref.current) return;
        
        previouslyFocusedElement.current = document.activeElement as HTMLElement;
        ref.current.focus();

        const focusableElements = ref.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        const currentRef = ref.current;
        currentRef.addEventListener('keydown', handleKeyDown);

        return () => {
            currentRef.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElement.current?.focus();
        };
    }, [isOpen, ref]);
};

// --- Helper Components ---
const Tooltip: React.FC<React.PropsWithChildren<{ text: string }>> = ({ children, text }) => (
    <div className="relative group">
        {children}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {text}
        </div>
    </div>
);

// --- Main Modal Component ---
export const ManageViewsModal: React.FC<ManageViewsModalProps> = (props) => {
    const { isOpen, onClose, savedViews, onDelete, onPin, onSetDefault, onRename, onDuplicate, onSelectView } = props;
    const { user } = useAuth();
    const { t } = useLocale();

    // State
    const [activeTab, setActiveTab] = useState<Tab>('MY_VIEWS');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<{ id: string; name: string } | null>(null);

    // Hooks
    const modalRef = useRef<HTMLDivElement>(null);
    useBodyScrollLock(isOpen);
    useFocusTrap(modalRef, isOpen);
    
    // Memos
    const { myViews, groupViews } = useMemo(() => {
        const my = savedViews.filter(v => v.ownerId === user?.id);
        const group = savedViews.filter(v => v.visibility === ViewVisibility.GROUP && v.ownerId !== user?.id);
        return { myViews: my, groupViews: group };
    }, [savedViews, user]);

    const filteredViews = useMemo(() => {
        const source = activeTab === 'MY_VIEWS' ? myViews : groupViews;
        if (!searchQuery) return source;
        return source.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [activeTab, myViews, groupViews, searchQuery]);

    const selectedView = useMemo(() => savedViews.find(v => v.id === selectedViewId), [selectedViewId, savedViews]);
    
    // Handlers
    const handleClose = useCallback(() => {
        setSearchQuery('');
        setSelectedViewId(null);
        setEditingName(null);
        onClose();
    }, [onClose]);

    const handleSelectAndView = (view: SavedView) => {
        onSelectView(view);
        handleClose();
    };

    const handleDeleteWithConfirm = (view: SavedView) => {
        const confirmationText = t('delete_view_confirm').replace('{viewName}', view.name);
        if (window.confirm(confirmationText)) {
            if(selectedViewId === view.id) setSelectedViewId(null);
            onDelete(view.id);
        }
    };
    
    const handleSaveRename = () => {
        if (editingName && editingName.name.trim()) {
            onRename(editingName.id, editingName.name.trim());
        }
        setEditingName(null);
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [handleClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="manage-views-title" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4" onMouseDown={handleClose}>
            <div ref={modalRef} onMouseDown={e => e.stopPropagation()} tabIndex={-1} className="flex flex-col bg-slate-50 w-full h-full shadow-2xl md:rounded-lg md:max-w-5xl md:h-auto md:max-h-[90dvh] md:w-[clamp(880px,72vw,1040px)]">
                {/* Header */}
                <header className="flex-shrink-0 p-3 border-b flex items-center justify-between">
                    <h2 id="manage-views-title" className="text-lg font-bold text-slate-800">{t('manage_views_title')}</h2>
                    <div className="relative w-64">
                        <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_views')}
                            className="w-full text-sm pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[300px]">
                    {/* Left Panel: Views List */}
                    <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden">
                        <nav className="flex-shrink-0 flex gap-4 px-3 border-b">
                            <button onClick={() => setActiveTab('MY_VIEWS')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'MY_VIEWS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300'}`}>{t('my_views')} ({myViews.length})</button>
                            <button onClick={() => setActiveTab('GROUP_VIEWS')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'GROUP_VIEWS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300'}`}>{t('group_views')} ({groupViews.length})</button>
                        </nav>
                        <ul className="flex-1 overflow-y-auto p-1.5 space-y-1">
                            {filteredViews.map(view => (
                                <ViewListItem key={view.id} view={view} isSelected={selectedViewId === view.id} onSelect={() => setSelectedViewId(view.id)} />
                            ))}
                            {filteredViews.length === 0 && <p className="text-center text-sm text-slate-500 p-8">{t('no_views_found')}</p>}
                        </ul>
                    </div>

                    {/* Right Panel: View Details */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedView ? (
                            <ViewDetails 
                                view={selectedView}
                                isOwner={selectedView.ownerId === user?.id}
                                editingName={editingName} 
                                setEditingName={setEditingName}
                                handleSaveRename={handleSaveRename}
                                onDelete={handleDeleteWithConfirm}
                                onDuplicate={onDuplicate}
                                onPin={onPin}
                                onSetDefault={onSetDefault}
                                onSelectAndView={handleSelectAndView}
                                t={t}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">{t('select_view_prompt')}</div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex-shrink-0 p-3 border-t bg-slate-100 flex justify-end">
                    <button onClick={handleClose} className="py-1.5 px-4 border border-slate-400 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-200">{t('close')}</button>
                </footer>
            </div>
        </div>,
        document.body
    );
};

// --- Sub-components for ManageViewsModal ---

const ViewListItem: React.FC<{ view: SavedView, isSelected: boolean, onSelect: () => void }> = ({ view, isSelected, onSelect }) => {
    const owner = ALL_USERS.find(u => u.id === view.ownerId);
    return (
        <li>
            <button onClick={onSelect} className={`w-full text-left p-2 rounded-md flex items-center justify-between transition-colors ${isSelected ? 'bg-primarySoft' : 'hover:bg-slate-200/50'}`}>
                <div className="flex items-center gap-2">
                    {view.visibility === ViewVisibility.PRIVATE ? <LockClosedIcon className="w-3 h-3 text-slate-500" /> : <UsersIcon className="w-3 h-3 text-slate-500" />}
                    <span className="text-sm font-medium text-slate-800">{view.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    {view.isDefault && <CheckCircleIcon title="Default view" className="w-4 h-4 text-green-600" />}
                    {view.isPinned && <StarIcon title="Pinned view" className="w-4 h-4 text-amber-500" style={{fill: 'currentColor'}} />}
                    {owner && <img src={owner.avatarUrl} title={`Owner: ${owner.name}`} className="w-5 h-5 rounded-full" />}
                </div>
            </button>
        </li>
    );
};

const ViewDetails: React.FC<any> = ({ view, isOwner, editingName, setEditingName, handleSaveRename, onDelete, onDuplicate, onPin, onSetDefault, onSelectAndView, t }) => {
    const owner = ALL_USERS.find(u => u.id === view.ownerId);
    
    return (
        <div>
            {/* Name & Actions */}
            <div className="flex justify-between items-start mb-4">
                {editingName?.id === view.id ? (
                     <div className="flex gap-2 items-center">
                        <input type="text" value={editingName.name} onChange={e => setEditingName({...editingName, name: e.target.value})} onBlur={handleSaveRename} onKeyDown={e => e.key === 'Enter' && handleSaveRename()} autoFocus className="text-lg font-bold text-slate-900 border-b-2 border-primary focus:outline-none bg-transparent"/>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{view.name}</h3>
                        {isOwner && <button onClick={() => setEditingName({id: view.id, name: view.name})} className="p-1 rounded text-slate-500 hover:bg-slate-200"><PencilIcon className="w-4 h-4" /></button>}
                    </div>
                )}
                 <button onClick={() => onSelectAndView(view)} className="py-1.5 px-3 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-[#3a5a58]">{t('open_preview')}</button>
            </div>
            
            {/* Metadata */}
            <div className="grid grid-cols-3 gap-3 text-xs border-y py-2 mb-4">
                <div className="space-y-1"><div className="text-slate-500">{t('owner')}</div><div className="font-medium flex items-center gap-1.5 text-slate-800">{owner && <img src={owner.avatarUrl} className="w-4 h-4 rounded-full"/>}{owner?.name || 'N/A'}</div></div>
                <div className="space-y-1"><div className="text-slate-500">{t('visibility')}</div><div className="font-medium text-slate-800">{view.visibility}</div></div>
                <div className="space-y-1"><div className="text-slate-500">{t('last_used')}</div><div className="font-medium text-slate-800">2 days ago</div></div>
            </div>

            {/* Filter Snapshot */}
            <h4 className="font-semibold text-sm mb-2 text-slate-700">{t('filters_applied')}</h4>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-md">
                <FilterChipDisplay label="Search" value={view.filterSet.searchQuery} />
                {(view.filterSet.typeIds || (view.filterSet.type ? [view.filterSet.type] : [])).map((typeId: string) => 
                    <FilterChipDisplay key={typeId} label="Type" value={typeId} />
                )}
                {(view.filterSet.teamIds || []).map((teamId: string) => 
                    <FilterChipDisplay key={teamId} label="Team" value={ALL_TEAMS.find(t=>t.id === teamId)?.name} />
                )}
                {(view.filterSet.assigneeIds || []).map((assigneeId: string) => {
                    const user = ALL_USERS.find(u => u.id === assigneeId);
                    return <FilterChipDisplay key={assigneeId} label="Assignee" value={user?.name} avatar={user?.avatarUrl} />
                })}
                 {view.filterSet.assigneeIds && view.filterSet.assigneeIds.length > 0 && (
                    <FilterChipDisplay label="Match" value={view.filterSet.assigneeMatch} />
                 )}
            </div>

            {/* Actions */}
            <h4 className="font-semibold text-sm mb-2 mt-4 text-slate-700">{t('actions')}</h4>
            <div className="flex flex-wrap gap-1">
                 {isOwner && (
                     <>
                        <ActionButton icon={<StarIcon className="w-4 h-4" />} text={view.isPinned ? t('unpin') : t('pin')} onClick={() => onPin(view.id)} />
                        <ActionButton icon={<CheckCircleIcon className="w-4 h-4" />} text={t('set_as_default')} onClick={() => onSetDefault(view.id)} />
                     </>
                 )}
                <ActionButton icon={<DocumentDuplicateIcon className="w-4 h-4" />} text={t('duplicate')} onClick={() => onDuplicate(view)} />
                {isOwner && <ActionButton icon={<TrashIcon className="w-4 h-4 text-red-600" />} text={t('delete')} onClick={() => onDelete(view)} className="text-red-600" />}
            </div>
        </div>
    );
};

const ActionButton = ({ icon, text, onClick, className = '' }: any) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 text-sm text-slate-700 p-1.5 rounded-md hover:bg-slate-200/80 ${className}`}>
        {icon}
        <span>{text}</span>
    </button>
);

const FilterChipDisplay = ({ label, value, avatar }: any) => {
    if (!value || value === 'ALL') return null;
    return (
        <div className="flex items-center gap-1.5 bg-white text-slate-700 text-xs font-medium pl-1.5 pr-2 py-0.5 rounded-full border">
            <span className="font-normal text-slate-500">{label}:</span>
            {avatar && <img src={avatar} className="w-4 h-4 rounded-full" />}
            <span>{value}</span>
        </div>
    );
};