import { useState, useRef, useCallback } from 'react';
import { Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  type = 'textarea',
  className,
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleSelect = useCallback(() => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      setSelectionStart(start);
      setSelectionEnd(end);
      
      // If text is selected, prefill the link text
      if (start !== end) {
        setLinkText(value.substring(start, end));
      }
    }
  }, [value]);

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;

    const text = linkText.trim() || linkUrl;
    const markdownLink = `[${text}](${linkUrl})`;

    let newValue: string;
    if (selectionStart !== selectionEnd) {
      // Replace selected text with link
      newValue = value.substring(0, selectionStart) + markdownLink + value.substring(selectionEnd);
    } else {
      // Insert link at cursor position
      newValue = value.substring(0, selectionStart) + markdownLink + value.substring(selectionStart);
    }

    onChange(newValue);
    setIsLinkPopoverOpen(false);
    setLinkText('');
    setLinkUrl('');

    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = selectionStart + markdownLink.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleRemoveLink = () => {
    // Simple regex to find and remove markdown links
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    const newValue = value.replace(linkRegex, '$1');
    onChange(newValue);
  };

  const hasLinks = /\[([^\]]+)\]\([^)]+\)/.test(value);

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              title={t('richText.insertLink', 'Вставить ссылку')}
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('richText.linkText', 'Текст ссылки')}</Label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={t('richText.linkTextPlaceholder', 'Например: нажмите сюда')}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('richText.linkUrl', 'URL')}</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={handleInsertLink}
                disabled={!linkUrl.trim()}
              >
                {t('richText.insert', 'Вставить')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {hasLinks && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleRemoveLink}
            title={t('richText.removeLinks', 'Удалить все ссылки')}
          >
            <Unlink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        placeholder={placeholder}
        className={type === 'textarea' ? `min-h-[100px] ${className || ''}` : className}
      />
    </div>
  );
}
