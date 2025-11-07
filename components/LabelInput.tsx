import React, { useState } from 'react';
import { XMarkIcon, PlusCircleIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface LabelInputProps {
  labels: string[];
  onChange: (labels: string[]) => void;
}

export const LabelInput: React.FC<LabelInputProps> = ({ labels, onChange }) => {
  const { t } = useLocale();
  const [inputValue, setInputValue] = useState('');

  const handleAddLabel = () => {
    if (inputValue.trim() && !labels.includes(inputValue.trim())) {
      onChange([...labels, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    onChange(labels.filter(label => label !== labelToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLabel();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map(label => (
          <span key={label} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[#486966]/20 text-[#486966]">
            {label}
            <button type="button" onClick={() => handleRemoveLabel(label)} className="text-[#486966] hover:text-[#3a5a58]">
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('addLabel')}
          className="flex-grow px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#486966]"
        />
        <button type="button" onClick={handleAddLabel} className="flex-shrink-0 text-[#486966] hover:text-[#3a5a58]">
          <PlusCircleIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};