import React, { useState, useMemo } from 'react';
import { Attachment } from '../types';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, XMarkIcon, TrashIcon } from './icons';
import { faker } from 'https://cdn.skypack.dev/@faker-js/faker';

// A modal simulating the Google Picker API
const GooglePickerModal: React.FC<{ files: any[], onSelect: (file: any) => void, onClose: () => void }> = ({ files, onSelect, onClose }) => {
    const { t } = useLocale();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">{t('googlePickerTitle')}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                </header>
                <main className="p-4">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 font-medium text-gray-600">{t('fileName')}</th>
                                <th className="p-2 font-medium text-gray-600">{t('fileType')}</th>
                                <th className="p-2 font-medium text-gray-600">{t('lastModified')}</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map(file => (
                                <tr key={file.id} className="hover:bg-gray-50">
                                    <td className="p-2 text-gray-800">{file.name}</td>
                                    <td className="p-2 text-gray-800">{file.type}</td>
                                    <td className="p-2 text-gray-800">{file.lastModified}</td>
                                    <td className="p-2">
                                        <button onClick={() => onSelect(file)} className="text-sm text-white bg-[#486966] px-3 py-1 rounded hover:bg-[#3a5a58]">{t('select')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
            </div>
        </div>
    );
};

export const AttachmentsManager: React.FC<{ attachments: Attachment[], onChange: (attachments: Attachment[]) => void, readOnly?: boolean }> = ({ attachments, onChange, readOnly = false }) => {
    const { t } = useLocale();
    const { user } = useAuth();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const mockGoogleFiles = useMemo(() => {
        if (!user) return [];
        const files = Array.from({ length: 4 }, () => ({
            id: faker.string.uuid(),
            name: faker.system.commonFileName(),
            type: faker.system.fileType(),
            lastModified: faker.date.recent().toLocaleDateString(),
            ownerEmail: user.email, // File belongs to the current user
        }));
        // Add one file that will cause a mismatch to test the logic
        files.push({
            id: faker.string.uuid(),
            name: 'confidential-report-mismatched-owner.docx',
            type: 'document',
            lastModified: faker.date.recent().toLocaleDateString(),
            ownerEmail: 'mismatched.account@gmail.com',
        });
        return files;
    }, [user]);

    const handleRemoveAttachment = (id: string) => {
        onChange(attachments.filter(att => att.id !== id));
    };

    const handleFileSelect = (file: any) => {
        // US-19: Enforce Drive account matches login account
        if (user && file.ownerEmail !== user.email) {
            alert(`Google Drive Account Mismatch:\n\nPlease select a file from the Google account you used to sign in (${user.email}).`);
            setIsPickerOpen(false); // Close picker on error
            return;
        }

        const newAttachment: Attachment = {
            id: file.id,
            provider: 'GOOGLE_DRIVE',
            fileName: file.name,
            fileUrl: `https://docs.google.com/mock/${file.id}`,
        };
        onChange([...attachments, newAttachment]);
        setIsPickerOpen(false);
    };

    return (
        <div className="mt-2 p-3 bg-gray-50 border border-[#B2BEBF] rounded-md space-y-2">
            {attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-md border">
                    <div className="flex items-center gap-2 truncate">
                        {att.provider === 'GOOGLE_DRIVE' && <GoogleIcon className="w-4 h-4 flex-shrink-0" />}
                        <span className="text-sm truncate" title={att.fileName}>{att.fileName}</span>
                    </div>
                    {!readOnly && (
                        <button onClick={() => handleRemoveAttachment(att.id)} className="text-gray-400 hover:text-red-500">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
            {attachments.length === 0 && !readOnly && <p className="text-xs text-center text-gray-500 py-2">No attachments yet.</p>}

            {!readOnly && (
                <div className="pt-2 text-center">
                     <div className="p-4 bg-blue-50 rounded-md">
                         <p className="text-sm text-blue-700 mb-3">Google Drive is connected for <strong>{user?.email}</strong>.</p>
                        <button type="button" onClick={() => setIsPickerOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md text-white bg-[#486966] hover:bg-[#3a5a58]">
                            <GoogleIcon className="w-5 h-5" />
                            Attach from Google Drive
                        </button>
                    </div>
                </div>
            )}
            
            {isPickerOpen && <GooglePickerModal files={mockGoogleFiles} onSelect={handleFileSelect} onClose={() => setIsPickerOpen(false)} />}
        </div>
    );
};