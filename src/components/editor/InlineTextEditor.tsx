/**
 * InlineTextEditor - Quick inline text editing for block fields
 * P4: Block Editor Interaction OS
 */
import { memo, useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/store/useEditorStore';
import {
  getEditableFields,
  getPrimaryEditableField,
  getFieldValue,
  setFieldValue,
  readInlineText,
  writeInlineText,
} from '@/lib/editor/inline-edit-config';
import type { Block, BlockType } from '@/types/page';

interface InlineTextEditorProps {
  block: Block;
  onSave: (blockId: string, updates: Partial<Block>) => void;
}

export const InlineTextEditor = memo(function InlineTextEditor({
  block,
  onSave,
}: InlineTextEditorProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'ru';
  const { inlineEditingBlockId, inlineEditField, setInlineEditing } = useEditorStore();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const primaryField = getPrimaryEditableField(block.type as BlockType);
  const isEditing = inlineEditingBlockId === block.id;

  const fieldPath = inlineEditField || primaryField?.field;
  const field = getEditableFields(block.type as BlockType).find((f) => f.field === fieldPath) ?? primaryField;
  const rawValue = fieldPath
    ? getFieldValue(block as unknown as Record<string, unknown>, fieldPath)
    : undefined;
  const currentValue = readInlineText(rawValue, lang);
  
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (!fieldPath || value === currentValue) {
      setInlineEditing(null);
      return;
    }

    const updates = setFieldValue(
      {} as Record<string, unknown>,
      fieldPath,
      writeInlineText(rawValue, value.trim(), lang)
    );
    onSave(block.id, updates as Partial<Block>);
    setInlineEditing(null);
  }, [fieldPath, value, currentValue, rawValue, lang, block.id, onSave, setInlineEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setValue(currentValue);
      setInlineEditing(null);
    }
    // Stop propagation to prevent editor shortcuts
    e.stopPropagation();
  }, [handleSave, currentValue, setInlineEditing]);

  if (!isEditing || !field) return null;

  const isMultiline = field.type === 'text';

  return (
    <div
      className="absolute inset-0 z-30 flex items-center p-3 bg-background rounded-2xl"
      onClickCapture={(e) => e.stopPropagation()}
    >
      {isMultiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={field.maxLength}
          className="w-full h-full min-h-[60px] bg-transparent text-sm text-foreground resize-none outline-none border border-primary/30 rounded-lg p-2 focus:border-primary"
          placeholder={field.placeholderKey}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={field.maxLength}
          className="w-full bg-transparent text-sm text-foreground outline-none border border-primary/30 rounded-lg px-2 py-1.5 focus:border-primary"
          placeholder={field.placeholderKey}
        />
      )}
    </div>
  );
});
