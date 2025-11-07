// components/RichTextEditor.tsx
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, ReactRenderer, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlock from '@tiptap/extension-code-block';
import Suggestion from '@tiptap/suggestion';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import { isEqual } from 'lodash-es';

import { useLocale } from '../context/LocaleContext';
import { getAutocompleteSuggestions } from '../services/editorService';
import { BoldIcon, ItalicIcon, LinkIcon, CodeIcon, BulletListIcon, NumberedListIcon, Heading2Icon, Heading3Icon, Heading4Icon, Heading5Icon, Heading6Icon, ColorSwatchIcon, HighlightIcon, CodeBlockIcon, TableIcon, ImageIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, XMarkIcon } from './icons';
import { debounce } from 'lodash-es';
import tippy from 'tippy.js';

const MAX_CHARS = 20000;
const WARN_CHARS = 19500;

const DS_COLORS = {
    content: { hex: '#3B3936', name: 'Content' },
    muted: { hex: '#889C9B', name: 'Muted' },
    primary: { hex: '#486966', name: 'Primary' },
    success: { hex: '#28a745', name: 'Success' },
    warning: { hex: '#ffc107', name: 'Warning' },
    danger: { hex: '#BD2A2E', name: 'Danger' }
};

const ToolbarButton = ({ tooltip, onClick, children, isActive, disabled = false }: any) => (
    <button
        type="button"
        title={tooltip}
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded hover:bg-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed ${isActive ? 'bg-gray-200' : ''}`}
    >
        {children}
    </button>
);

const ColorPicker = ({ onSelect, children, tooltip }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <ToolbarButton tooltip={tooltip} onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>{children}</ToolbarButton>
            {isOpen && (
                <div onMouseLeave={() => setIsOpen(false)} className="absolute z-10 top-full mt-1 bg-white shadow-lg rounded-md p-2 grid grid-cols-3 gap-1">
                    {Object.values(DS_COLORS).map(color => (
                        <button key={color.hex} type="button" title={color.name} onClick={() => { onSelect(color.hex); setIsOpen(false); }} className="w-6 h-6 rounded-full border" style={{ backgroundColor: color.hex }} />
                    ))}
                    <button type="button" title="Clear" onClick={() => { onSelect(''); setIsOpen(false); }} className="w-6 h-6 rounded-full border bg-white flex items-center justify-center text-red-500">
                       <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const LinkModal = ({ initialUrl, onSave, onClose, t }: any) => {
    const [url, setUrl] = useState(initialUrl);
    const handleSave = () => onSave(url);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4" onMouseDown={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onMouseDown={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 text-[#3B3936]">{t('editor_linkUrlPrompt').replace(':', '')}</h3>
                <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#486966]"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSave();
                        }
                    }}
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-[#889C9B] rounded-md text-sm font-medium text-[#3B3936] hover:bg-gray-100">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#486966] hover:bg-[#3a5a58]">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

const TableToolbar = ({ editor }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const commands = [
      { label: 'Insert table', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: 'Add column before', action: () => editor.chain().focus().addColumnBefore().run() },
      { label: 'Add column after', action: () => editor.chain().focus().addColumnAfter().run() },
      { label: 'Delete column', action: () => editor.chain().focus().deleteColumn().run() },
      { label: 'Add row before', action: () => editor.chain().focus().addRowBefore().run() },
      { label: 'Add row after', action: () => editor.chain().focus().addRowAfter().run() },
      { label: 'Delete row', action: () => editor.chain().focus().deleteRow().run() },
      { label: 'Delete table', action: () => editor.chain().focus().deleteTable().run() },
      { label: 'Merge cells', action: () => editor.chain().focus().mergeCells().run() },
      { label: 'Split cell', action: () => editor.chain().focus().splitCell().run() },
      { label: 'Toggle header row', action: () => editor.chain().focus().toggleHeaderRow().run() },
    ];
    return (
      <div className="relative">
        <ToolbarButton tooltip="Table" onClick={() => setIsOpen(!isOpen)} isActive={editor.isActive('table')}><TableIcon className="w-5 h-5"/></ToolbarButton>
        {isOpen && (
          <div onMouseLeave={() => setIsOpen(false)} className="absolute z-10 top-full mt-1 w-48 bg-white shadow-lg rounded-md border text-start">
            <ul className="py-1">
              {commands.map(cmd => (
                <li key={cmd.label}>
                  <button onClick={() => { cmd.action(); setIsOpen(false); }} className="w-full text-start px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">{cmd.label}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
};


const Toolbar = ({ editor, onOpenLinkModal }: any) => {
    const { t } = useLocale();
    if (!editor) return null;
    
    const insertImage = useCallback(() => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50/50 rounded-t-md">
            <ToolbarButton tooltip="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2Icon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip={t('editor_tooltip_h3')} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}><Heading3Icon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip={t('editor_tooltip_h4')} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive('heading', { level: 4 })}><Heading4Icon className="w-5 h-5" /></ToolbarButton>
            <div className="h-5 w-px bg-gray-300 mx-1" />
            <ToolbarButton tooltip={t('editor_tooltip_bold')} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><BoldIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip={t('editor_tooltip_italic')} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><ItalicIcon className="w-5 h-5" /></ToolbarButton>
            <div className="h-5 w-px bg-gray-300 mx-1" />
            <ToolbarButton tooltip="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeftIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenterIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRightIcon className="w-5 h-5" /></ToolbarButton>
            <div className="h-5 w-px bg-gray-300 mx-1" />
            <ToolbarButton tooltip={t('editor_tooltip_bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><BulletListIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip={t('editor_tooltip_numberedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><NumberedListIcon className="w-5 h-5" /></ToolbarButton>
            <div className="h-5 w-px bg-gray-300 mx-1" />
            <ToolbarButton tooltip={t('editor_tooltip_link')} onClick={onOpenLinkModal} isActive={editor.isActive('link')}><LinkIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton tooltip="Insert Image" onClick={insertImage}><ImageIcon className="w-5 h-5" /></ToolbarButton>
            <TableToolbar editor={editor} />
            <ToolbarButton tooltip={t('editor_tooltip_codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')}><CodeBlockIcon className="w-5 h-5" /></ToolbarButton>
            <div className="h-5 w-px bg-gray-300 mx-1" />
            <ColorPicker onSelect={(color: string) => color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run()} tooltip={t('editor_tooltip_color')}><ColorSwatchIcon className="w-5 h-5" /></ColorPicker>
            <ColorPicker onSelect={(color: string) => color ? editor.chain().focus().toggleHighlight({ color }).run() : editor.chain().focus().unsetHighlight().run()} tooltip={t('editor_tooltip_highlight')}><HighlightIcon className="w-5 h-5" /></ColorPicker>
        </div>
    );
};

const TableOfContents = ({ headings }: any) => {
    if (headings.length === 0) return null;
    return (
        <div className="p-2 border-b bg-gray-50/50 text-sm">
            <ul className="space-y-1">
                {headings.map(({ id, text, level }: any) => (
                    <li key={id} style={{ marginInlineStart: `${(level - 2) * 1}rem` }}>
                        <a href={`#${id}`} onClick={(e) => { e.preventDefault(); const el = document.querySelector(`[data-toc-id="${id}"]`); el?.scrollIntoView({ behavior: 'smooth' }); }} className={`hover:underline text-gray-700`}>
                            {text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SuggestionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item });
        }
    };
    
    useEffect(() => setSelectedIndex(0), [props.items]);
    
    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <ul className="absolute z-20 bg-white shadow-lg rounded-md border py-1 w-48">
            {props.items?.length ? props.items.map((item: string, index: number) => (
                <li key={index} 
                    className={`px-3 py-1 text-sm cursor-pointer ${index === selectedIndex ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    onClick={() => selectItem(index)}
                >
                    {item}
                </li>
            )) : <li className="px-3 py-1 text-sm text-gray-500">No results</li>}
        </ul>
    );
});

const suggestionConfig = {
      char: '#',
      command: ({ editor, range, props }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(props.id + ' ')
          .run();
      },
      items: ({ query }: any) => getAutocompleteSuggestions(query),
      render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(SuggestionList, {
                    props,
                    editor: props.editor,
                });
                if (!props.clientRect) {
                    return;
                }
                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },
            onUpdate(props: any) {
                component.updateProps(props);
                if (!props.clientRect) {
                    return;
                }
                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },
            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                return component.ref?.onKeyDown(props);
            },
            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};

interface RichTextEditorProps {
    value: string | object;
    onChange: (editor: Editor) => void;
    onValidityChange: (isInvalid: boolean) => void;
    editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, onValidityChange, editable = true }) => {
    const { t, locale } = useLocale();
    const [isTocVisible, setIsTocVisible] = useState(false);
    const [headings, setHeadings] = useState<any[]>([]);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<string[]>([]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, codeBlock: false, link: false }),
            Heading.configure({ levels: [2, 3, 4, 5, 6] }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
            CharacterCount.configure({ limit: MAX_CHARS }),
            CodeBlock.configure({ languageClassPrefix: 'language-' }),
            Suggestion(suggestionConfig),
            Image,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor);
            const textLength = editor.storage.characterCount.characters();
            onValidityChange(textLength > MAX_CHARS);
            updateHeadings(editor);

            // Check for new data URIs
            const images = editor.state.doc.content.toJSON().flatMap((node: any) => (node.content || []).filter((n: any) => n.type === 'image'));
            const dataUris = images.map((img: any) => img.attrs.src).filter((src: string) => src.startsWith('data:image'));
            setPendingImages(dataUris);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none w-full min-h-[200px] max-h-[40vh] overflow-y-auto p-3 focus:outline-none',
                dir: locale === 'fa-IR' ? 'rtl' : 'ltr',
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.type.indexOf('image') === 0) {
                        const file = item.getAsFile();
                        if (file) {
                             if (file.size > 2 * 1024 * 1024) { // 2MB limit
                                alert("Pasted image is too large (max 2MB).");
                                return true;
                            }
                            const reader = new FileReader();
                            reader.onload = (readerEvent) => {
                                const dataUrl = readerEvent.target?.result as string;
                                if (dataUrl && editor) {
                                    const { schema } = view.state;
                                    const node = schema.nodes.image.create({ src: dataUrl });
                                    const transaction = view.state.tr.replaceSelectionWith(node);
                                    view.dispatch(transaction);
                                }
                            };
                            reader.readAsDataURL(file);
                            return true;
                        }
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => {
        if (editor && editor.isEditable !== editable) editor.setEditable(editable);
    }, [editable, editor]);

    useEffect(() => {
        if (editor) {
            editor.setOptions({
                editorProps: {
                    attributes: { ...editor.options.editorProps.attributes, dir: locale === 'fa-IR' ? 'rtl' : 'ltr' }
                }
            });
        }
    }, [locale, editor]);

    const openLinkModal = useCallback(() => {
        if (!editor || !editable) return;
        setIsLinkModalOpen(true);
    }, [editor, editable]);

    const handleSetLink = useCallback((url: string) => {
        if (!editor) return;
        if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
        }
        setIsLinkModalOpen(false);
    }, [editor]);

    useEffect(() => {
        if (editor && !editor.isDestroyed) {
             const currentContentJSON = editor.getJSON();
             const isSame = (typeof value === 'object' && value !== null && isEqual(currentContentJSON, value)) || editor.getHTML() === value;

             if (!isSame) {
                editor.commands.setContent(value, false);
                setPendingImages([]); // Reset on new content
            }
        }
    }, [value, editor]);

    const updateHeadings = useCallback(debounce((editorInstance) => {
        if (!editorInstance || editorInstance.isDestroyed) return;
        const newHeadings: any = [];
        const transaction = editorInstance.state.tr;
        let idCounter = 0;

        editorInstance.state.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
                const id = `toc-heading-${idCounter++}`;
                newHeadings.push({ id: id, text: node.textContent, level: node.attrs.level });
                if (node.attrs['data-toc-id'] !== id) {
                    transaction.setNodeMarkup(pos, undefined, { ...node.attrs, 'data-toc-id': id });
                }
            }
        });
        
        transaction.setMeta('preventUpdate', true);
        editorInstance.view.dispatch(transaction);
        setHeadings(newHeadings);
    }, 300), []);

    useEffect(() => {
      if(editor) updateHeadings(editor);
    },[editor, isTocVisible, updateHeadings]);
    
    if (!editor) return null;

    const charCount = editor.storage.characterCount.characters();
    const counterColor = charCount > MAX_CHARS ? 'text-red-600' : charCount >= WARN_CHARS ? 'text-yellow-600' : 'text-gray-500';

    return (
        <div className={`w-full bg-white border border-[#B2BEBF] rounded-md text-black placeholder-gray-400 ${editable ? 'focus-within:outline-none focus-within:ring-2 focus-within:ring-[#486966]' : 'bg-gray-50'}`}>
            {editable && <Toolbar editor={editor} onOpenLinkModal={openLinkModal} />}
            {editable && (
            <div className="flex justify-between items-center p-2 border-b">
                 <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isTocVisible} onChange={(e) => setIsTocVisible(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#486966] focus:ring-[#486966]" />
                    {t('editor_showToC')}
                </label>
            </div>)}
            {isTocVisible && <TableOfContents headings={headings} />}
             {pendingImages.length > 0 && (
                <div className="p-2 bg-yellow-100 text-yellow-800 text-xs border-b border-yellow-200">
                    <strong>{pendingImages.length} image(s)</strong> are temporarily embedded. They will be uploaded to Google Drive on Save.
                </div>
            )}
            <EditorContent editor={editor} style={{ whiteSpace: 'pre-wrap' }} />
            {editable && (<div className={`text-xs text-end p-2 border-t ${counterColor}`}>
                {t('editor_charCounterTemplate').replace('{count}', String(charCount)).replace('{max}', String(MAX_CHARS))}
            </div>)}
            {isLinkModalOpen && (
                <LinkModal
                    initialUrl={editor.getAttributes('link').href || ''}
                    onSave={handleSetLink}
                    onClose={() => setIsLinkModalOpen(false)}
                    t={t}
                />
            )}
        </div>
    );
};
