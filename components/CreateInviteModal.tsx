// components/CreateInviteModal.tsx
import React, { useState } from 'react';
import { Role, InviteCode } from '../types';
import { XMarkIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface CreateInviteModalProps {
    roles: Role[];
    onClose: () => void;
    onCreate: (invite: Omit<InviteCode, 'code' | 'createdBy' | 'createdAt' | 'uses'>) => void;
}

const CreateInviteModal: React.FC<CreateInviteModalProps> = ({ roles, onClose, onCreate }) => {
    const { t } = useLocale();
    const [roleId, setRoleId] = useState<string>(roles.find(r => r.name === 'Member')?.id || roles[0]?.id || '');
    const [maxUses, setMaxUses] = useState<number | null>(10);
    const [expiresAt, setExpiresAt] = useState<string | null>(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // Default 30 days
        return date.toISOString().split('T')[0];
    });

    const handleSave = () => {
        onCreate({
            roleId,
            maxUses: maxUses === 0 ? null : maxUses,
            expiresAt,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('createInvite_title')}</h2>
                     <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                     <div>
                        <label htmlFor="roleId" className="block text-sm font-medium text-[#486966] mb-1">{t('createInvite_role_label')}</label>
                        <select
                            id="roleId"
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#486966]"
                        >
                            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="maxUses" className="block text-sm font-medium text-[#486966] mb-1">{t('createInvite_maxUses_label')}</label>
                        <input
                            type="number"
                            id="maxUses"
                            value={maxUses === null ? '' : maxUses}
                            onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value, 10) : null)}
                            placeholder={t('createInvite_maxUses_placeholder')}
                            min="0"
                            className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#486966]"
                        />
                    </div>
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-[#486966] mb-1">{t('createInvite_expiresAt_label')}</label>
                        <input
                            type="date"
                            id="expiresAt"
                            value={expiresAt || ''}
                            onChange={(e) => setExpiresAt(e.target.value || null)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#486966]"
                        />
                         <p className="text-xs text-gray-500 mt-1">{t('createInvite_expiresAt_desc')}</p>
                    </div>
                </main>
                 <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="py-2 px-4 border rounded-md">{t('cancel')}</button>
                    <button onClick={handleSave} className="py-2 px-4 bg-[#486966] text-white rounded-md">{t('createInvite_generate_button')}</button>
                 </footer>
            </div>
        </div>
    );
};

export default CreateInviteModal;