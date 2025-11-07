// components/EpicEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Epic } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon } from './icons';
import { generateSummary } from '../services/geminiService';
import { isEqual } from 'lodash-es';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentsManager } from './AttachmentsManager';
import { Editor } from '@tiptap/react';

interface EpicEditorProps {
  epic: Partial<Epic>;
  onSave: (item: Partial<Epic>) => void;
  onCancel: () => void;
  isNew: boolean;
  highlightSection?: string;
  readOnly?: boolean;
}

const ScoreSlider: React.FC<{ label: string, value: number, onChange: (value: number) => void, highlightKey?: string, disabled?: boolean }> = ({ label, value, onChange, highlightKey, disabled }) => (
    <div data-highlight-key={highlightKey}>
        <label className="flex justify-between text-sm font-medium text-[#3B3936]">
            <span>{label}</span>
            <span className="font-bold">{value}</span>
        </label>
        <input 
            type="range" 
            min="1" 
            max="10" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
        />
    </div>
);


export const EpicEditor: React.FC<EpicEditorProps> = ({ epic, onSave, onCancel, isNew, highlightSection, readOnly = false }) => {
  const { t } = useLocale();
  const [localEpic, setLocalEpic] = useState<Partial<Epic>>(epic);
  const [originalEpic, setOriginalEpic] = useState<Partial<Epic>>(epic);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDescriptionOverLimit, setIsDescriptionOverLimit] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalEpic(epic);
    setOriginalEpic(epic);
  }, [epic]);

  useEffect(() => {
    if (highlightSection && editorContainerRef.current) {
        const elementToHighlight = editorContainerRef.current.querySelector(`[data-highlight-key="${highlightSection}"]`);
        if (elementToHighlight) {
            elementToHighlight.classList.add('animate-highlight-pulse');
            (elementToHighlight as HTMLElement).focus?.();
            const timer = setTimeout(() => {
                elementToHighlight.classList.remove('animate-highlight-pulse');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }
  }, [highlightSection]);

  const hasChanges = !isEqual(originalEpic, localEpic);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSave = () => {
    onSave(localEpic);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalEpic(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDescriptionChange = (editor: Editor) => {
    setLocalEpic(prev => ({
        ...prev, 
        description: editor.getText(),
        description_rich: editor.getJSON(),
    }));
  };
  
  const handleGenerateSummary = async () => {
    if (!localEpic.name || !localEpic.description) {
      alert("Please provide a name and description before generating a summary.");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummary(localEpic.name, localEpic.description);
      setLocalEpic(prev => ({ ...prev, aiSummary: summary }));
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Could not generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onMouseDown={handleBackdropMouseDown}>
      <div ref={editorContainerRef} className="bg-[#F0F4F4] rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b bg-white/60 rounded-t-lg">
          <h2 className="text-xl font-bold text-[#3B3936]">
            {isNew ? t('createNewEpic') : readOnly ? `Viewing Epic ${originalEpic.id}` : `Editing Epic ${originalEpic.id}`}
          </h2>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200">
            <XMarkIcon className="w-6 h-6 text-[#889C9B]" />
          </button>
        </header>
        
        <main className="flex-1 flex overflow-hidden p-4 gap-4">
          <div className="flex-[3] overflow-y-auto pr-2 space-y-4">
            <input
              type="text"
              name="name"
              value={localEpic.name || ''}
              onChange={handleChange}
              placeholder={t('epicName')}
              disabled={readOnly}
              className="w-full text-lg font-semibold px-2 py-1 border-b-2 border-transparent focus:border-[#486966] focus:outline-none bg-transparent text-[#3B3936] rounded disabled:bg-gray-100"
              data-highlight-key="name"
              required
            />
            <div data-highlight-key="aiSummary">
              <label className="block text-sm font-medium text-[#486966] mb-1">{t('aiPoweredSummary')}</label>
              <textarea
                name="aiSummary"
                value={localEpic.aiSummary || ''}
                onChange={handleChange}
                placeholder="A concise AI-generated summary will appear here."
                rows={3}
                disabled={readOnly}
                className="w-full px-3 py-2 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#486966] disabled:bg-gray-100"
              />
               {!readOnly && (
                    <button
                        type="button"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary || readOnly}
                        className="mt-2 text-sm text-[#486966] hover:underline disabled:text-gray-400"
                    >
                        {isGeneratingSummary ? 'Generating...' : t('generateSummary')}
                    </button>
               )}
            </div>
            
            <div data-highlight-key="description">
              <label className="block text-sm font-medium text-[#486966] mb-1">{t('description')}</label>
               <RichTextEditor
                    value={localEpic.description_rich || localEpic.description || ''}
                    onChange={handleDescriptionChange}
                    onValidityChange={setIsDescriptionOverLimit}
                    editable={!readOnly}
                />
            </div>

             <div data-highlight-key="attachments">
              <label className="block text-sm font-medium text-[#486966] mb-1">{t('attachments')}</label>
              <AttachmentsManager attachments={localEpic.attachments || []} onChange={(atts) => setLocalEpic(prev => ({...prev, attachments: atts}))} readOnly={readOnly} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 bg-white/50 p-4 rounded-lg">
            <h3 className="font-semibold border-b pb-2 text-[#3B3936]">{t('iceScoring')}</h3>
            <p className="text-xs text-gray-500">{t('iceScoringDesc')}</p>
            <ScoreSlider label={t('impact')} value={localEpic.impact || 5} onChange={val => setLocalEpic(p => ({...p, impact: val}))} highlightKey="impact" disabled={readOnly} />
            <ScoreSlider label={t('confidence')} value={localEpic.confidence || 5} onChange={val => setLocalEpic(p => ({...p, confidence: val}))} highlightKey="confidence" disabled={readOnly} />
            <ScoreSlider label={t('ease')} value={localEpic.ease || 5} onChange={val => setLocalEpic(p => ({...p, ease: val}))} highlightKey="ease" disabled={readOnly} />
            <div className="text-center pt-4" data-highlight-key="iceScore">
                <p className="text-sm text-gray-500 uppercase">{t('iceScore')}</p>
                <p className="text-3xl font-bold text-[#486966]">
                    {((localEpic.impact || 0) + (localEpic.confidence || 0) + (localEpic.ease || 0)) / 3 > 0 ? (((localEpic.impact || 0) + (localEpic.confidence || 0) + (localEpic.ease || 0)) / 3).toFixed(2) : 'N/A'}
                </p>
            </div>
          </div>
        </main>
        
        <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
            {readOnly ? (
                 <button onClick={onCancel} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('close')}</button>
            ) : (
                <>
                    <button onClick={onCancel} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={!hasChanges || isDescriptionOverLimit} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58] disabled:bg-gray-400 disabled:cursor-not-allowed">{t('saveChanges')}</button>
                </>
            )}
        </footer>
      </div>
    </div>
  );
};