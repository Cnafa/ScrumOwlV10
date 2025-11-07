// components/EpicsView.tsx
import React, { useState, useMemo } from 'react';
import { Epic, WorkItem, Status, EpicStatus } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useBoard } from '../context/BoardContext';
import { XMarkIcon } from './icons';

interface EpicsViewProps {
    epics: Epic[];
    workItems: WorkItem[];
    onNewEpic: () => void;
    onEditEpic: (epic: Epic) => void;
    onNewItem: (options: { epicId: string }) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    onUpdateStatus: (epicId: string, newStatus: EpicStatus) => void;
    onDeleteEpic: (epic: Epic) => void;
    onRestoreEpic: (epicId: string) => void;
}

const BlockActionModal: React.FC<{ epicName: string, openItems: WorkItem[], onClose: () => void }> = ({ epicName, openItems, onClose }) => {
    const { t } = useLocale();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#BD2A2E]">{t('cannot_archive_title')}</h2>
                    <button type="button" onClick={onClose}><XMarkIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6">
                    <p className="mb-4">{t('cannot_archive_body')}</p>
                    <h3 className="font-semibold mb-2">{t('open_items_list')}:</h3>
                    <ul className="max-h-48 overflow-y-auto border rounded p-2 text-sm space-y-1">
                        {openItems.map(item => <li key={item.id} className="truncate">{`[${item.id}] ${item.title}`}</li>)}
                    </ul>
                </main>
                <footer className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-300">{t('close')}</button>
                </footer>
            </div>
        </div>
    );
}

const ActionsMenu: React.FC<{ 
    epic: Epic, 
    onUpdateStatus: (id: string, status: EpicStatus) => void,
    onDelete: (epic: Epic) => void, 
    onEdit: () => void, 
    setBlockModalOpen: (items: WorkItem[]) => void, 
    workItems: WorkItem[], 
}> = ({ epic, onUpdateStatus, onDelete, onEdit, setBlockModalOpen, workItems }) => {
    const { t } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    
    const handleStatusChange = (newStatus: EpicStatus) => {
        if ((newStatus === EpicStatus.DONE || newStatus === EpicStatus.ARCHIVED) && epic.openItemsCount && epic.openItemsCount > 0) {
            const openItems = workItems.filter(item => item.epicId === epic.id && item.status !== Status.DONE);
            setBlockModalOpen(openItems);
        } else {
            onUpdateStatus(epic.id, newStatus);
        }
        setIsOpen(false);
    };

    const getActions = () => {
        switch (epic.status) {
            case EpicStatus.ACTIVE:
            case EpicStatus.ON_HOLD:
                return [
                    { label: t('edit'), action: onEdit },
                    ...(epic.status === EpicStatus.ACTIVE 
                        ? [{ label: t('epic_action_hold'), action: () => handleStatusChange(EpicStatus.ON_HOLD) }] 
                        : [{ label: t('epic_action_activate'), action: () => handleStatusChange(EpicStatus.ACTIVE) }]),
                    { label: t('epic_action_mark_done'), action: () => handleStatusChange(EpicStatus.DONE), disabled: epic.openItemsCount !== 0 },
                    { type: 'divider' as const },
                    { label: t('delete'), action: () => onDelete(epic), isDestructive: true },
                ];
            case EpicStatus.DONE:
                return [
                    { label: t('edit'), action: onEdit },
                    { label: t('epic_action_reopen'), action: () => handleStatusChange(EpicStatus.ACTIVE) },
                    { type: 'divider' as const },
                    { label: t('epic_action_archive'), action: () => handleStatusChange(EpicStatus.ARCHIVED), disabled: epic.openItemsCount !== 0 },
                    { label: t('delete'), action: () => onDelete(epic), isDestructive: true },
                ];
            case EpicStatus.ARCHIVED:
                return [
                     { label: t('epic_action_reopen'), action: () => handleStatusChange(EpicStatus.ACTIVE) }
                ];
            default:
                return [];
        }
    }

    return (
        <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="px-2 py-1 rounded hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {isOpen && (
                <div onMouseLeave={() => setIsOpen(false)} className="absolute end-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border text-start">
                    <ul className="py-1">
                        {getActions().map((action, index) => (
                             'type' in action && action.type === 'divider' ?
                             <div key={index} className="my-1 h-px bg-gray-200" /> :
                            <li key={action.label}>
                                <button onClick={(e) => { e.stopPropagation(); (action.action as Function)(); setIsOpen(false); }} disabled={action.disabled}
                                className={`w-full text-start px-4 py-2 text-sm ${'isDestructive' in action && action.isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'} disabled:text-gray-400 disabled:cursor-not-allowed`}>
                                    {action.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const EpicDrawerContent: React.FC<{
    epic: Epic;
    childItems: WorkItem[];
    onNewItem: (options: { epicId: string }) => void;
    onSelectWorkItem: (workItem: WorkItem) => void;
    canManage: boolean;
}> = ({ epic, childItems, onNewItem, onSelectWorkItem, canManage }) => {
    const { t } = useLocale();
    return (
        <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{t('open_items_stat').replace('{count}', (epic.openItemsCount || 0).toString())}</span>
                    <span className="w-px h-4 bg-gray-300" />
                    <span>{t('total_est_stat').replace('{sum}', (epic.totalEstimation || 0).toString())}</span>
                </div>
                {canManage && (epic.status === EpicStatus.ACTIVE || epic.status === EpicStatus.ON_HOLD) && (
                    <button onClick={() => onNewItem({ epicId: epic.id })} className="py-1.5 px-3 text-xs font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        Add Item to this Epic
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto border rounded-lg bg-white">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">Assignee</th>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 uppercase">Est.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {childItems.length > 0 ? childItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-500">{item.id}</td>
                                <td className="px-3 py-2 text-sm font-medium">
                                    <button onClick={() => onSelectWorkItem(item)} className="text-gray-900 hover:underline text-start">
                                        {item.title}
                                    </button>
                                </td>
                                <td className="px-3 py-2 text-xs"><span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800">{item.status}</span></td>
                                <td className="px-3 py-2 text-sm text-gray-700">{item.assignee.name}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '–'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{item.estimationPoints || '–'}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="text-center py-4 text-sm text-gray-500">No items in this epic yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const EpicsView: React.FC<EpicsViewProps> = ({ epics, workItems, onNewEpic, onEditEpic, onNewItem, onSelectWorkItem, onUpdateStatus, onDeleteEpic, onRestoreEpic }) => {
    const { t } = useLocale();
    const { can } = useBoard();
    const canManage = can('epic.manage');
    const [activeTab, setActiveTab] = useState<EpicStatus | 'DELETED'>(EpicStatus.ACTIVE);
    const [blockModalInfo, setBlockModalInfo] = useState<WorkItem[] | null>(null);
    const [expandedEpicId, setExpandedEpicId] = useState<string | null>(null);

    const handleToggleEpic = (epicId: string) => {
        setExpandedEpicId(prevId => (prevId === epicId ? null : epicId));
    };

    const filteredEpics = useMemo(() => {
        const sorted = [...epics].sort((a, b) => (b.iceScore || 0) - (a.iceScore || 0));
        if (activeTab === EpicStatus.ACTIVE) return sorted.filter(e => e.status === EpicStatus.ACTIVE || e.status === EpicStatus.ON_HOLD);
        return sorted.filter(e => e.status === activeTab);
    }, [epics, activeTab]);
    
    const TabButton: React.FC<{ tab: EpicStatus | 'DELETED', label: string }> = ({ tab, label }) => (
         <button 
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-[#486966] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const Th: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className }) => (
        <th scope="col" className={`px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider ${className || ''}`}>
            {children}
        </th>
    );

    return (
        <div className="p-4 bg-white rounded-lg shadow space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#3B3936]">{t('epics')}</h2>
                {canManage && (
                    <button onClick={onNewEpic} className="py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                        {t('newEpic')}
                    </button>
                )}
            </div>
            
            <nav className="flex space-x-2 border-b pb-2">
                <TabButton tab={EpicStatus.ACTIVE} label={t('epic_tab_active')} />
                <TabButton tab={EpicStatus.DONE} label={t('epic_tab_done')} />
                <TabButton tab={EpicStatus.ARCHIVED} label={t('epic_tab_archive')} />
                {canManage && <TabButton tab={EpicStatus.DELETED} label={t('delete')} />}
            </nav>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>{t('epic')}</Th>
                            <Th>{t('status')}</Th>
                            <Th>{t('iceScore')}</Th>
                            <Th>Progress</Th>
                            <Th>Items</Th>
                            <Th>{activeTab === 'DELETED' ? 'Deleted At' : 'Updated'}</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEpics.map(epic => (
                            <React.Fragment key={epic.id}>
                                <tr onClick={() => handleToggleEpic(epic.id)} className="cursor-pointer hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 me-2 transition-transform text-gray-500 rtl:scale-x-[-1] ${expandedEpicId === epic.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            <div className="w-2 h-6 rounded-full me-3" style={{backgroundColor: epic.color}}></div>
                                            <div className="text-sm font-medium text-gray-900">{epic.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{epic.status}</span></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{epic.iceScore}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm" style={{ minWidth: '120px' }}>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${epic.percentDoneWeighted || 0}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {`${(epic.totalItemsCount || 0) - (epic.openItemsCount || 0)}/${epic.totalItemsCount || 0}`}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(epic.deletedAt || epic.updatedAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        {canManage && epic.status !== EpicStatus.DELETED && (
                                            <ActionsMenu epic={epic} onEdit={() => onEditEpic(epic)} onDelete={onDeleteEpic} onUpdateStatus={onUpdateStatus} setBlockModalOpen={setBlockModalInfo} workItems={workItems} />
                                        )}
                                        {canManage && epic.status === EpicStatus.DELETED && (
                                            <button onClick={(e) => { e.stopPropagation(); onRestoreEpic(epic.id); }} className="text-sm text-indigo-600 hover:underline">Restore</button>
                                        )}
                                    </td>
                                </tr>
                                {expandedEpicId === epic.id && epic.status !== EpicStatus.DELETED && (
                                    <tr>
                                        <td colSpan={7} className="p-0 bg-gray-100 border-t-2 border-gray-200">
                                            <EpicDrawerContent
                                                epic={epic}
                                                childItems={workItems.filter(wi => wi.epicId === epic.id)}
                                                onNewItem={onNewItem}
                                                onSelectWorkItem={onSelectWorkItem}
                                                canManage={canManage}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                         {filteredEpics.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-sm text-gray-500">No epics in this category.</td>
                            </tr>
                         )}
                    </tbody>
                </table>
            </div>
            {blockModalInfo && (
                <BlockActionModal epicName="" openItems={blockModalInfo} onClose={() => setBlockModalInfo(null)} />
            )}
        </div>
    );
};