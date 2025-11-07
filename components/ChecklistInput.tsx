import React, { useState } from 'react';
import { ChecklistItem } from '../types';
import { PlusCircleIcon, TrashIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface ChecklistInputProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export const ChecklistInput: React.FC<ChecklistInputProps> = ({ items, onChange }) => {
  const { t } = useLocale();
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: `check-${Date.now()}`,
        text: newItemText,
        isCompleted: false,
      };
      onChange([...items, newItem]);
      setNewItemText('');
    }
  };

  const handleToggleItem = (id: string) => {
    onChange(items.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
  };
  
  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const completedCount = items.filter(item => item.isCompleted).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="mt-2 p-3 bg-gray-50 border border-[#B2BEBF] rounded-md space-y-2">
      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#486966] h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={() => handleToggleItem(item.id)}
              className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]"
            />
            <span className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-[#3B3936]'}`}>
              {item.text}
            </span>
            <button type="button" onClick={() => handleRemoveItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Input */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
          placeholder={t('addChecklistItem')}
          className="flex-grow px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#486966]"
        />
        <button type="button" onClick={handleAddItem} className="flex-shrink-0 text-[#486966] hover:text-[#3a5a58]">
          <PlusCircleIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};