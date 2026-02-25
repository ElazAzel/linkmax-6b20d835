/**
 * MultilingualInput - supports flexible languages
 * Updated to use the new I18nText system while maintaining backward compatibility
 */
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Languages from 'lucide-react/dist/esm/icons/languages';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import {
  LANGUAGES,
  LANGUAGE_DEFINITIONS,
  type MultilingualString,
  type I18nText,
  type LocaleCode,
} from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RichTextEditor } from './RichTextEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// Extended language definitions
const ALL_LANGUAGES: Record<LocaleCode, { name: string; flag: string }> = {
  ...LANGUAGE_DEFINITIONS,
  tr: { name: 'Türkçe', flag: '🇹🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'Français', flag: '🇫🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Português', flag: '🇵🇹' },
  zh: { name: '中文', flag: '🇨🇳' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ko: { name: '한국어', flag: '🇰🇷' },
  ar: { name: 'العربية', flag: '🇸🇦' },
  uz: { name: "O'zbekcha", flag: '🇺🇿' },
  uk: { name: 'Українська', flag: '🇺🇦' },
  az: { name: 'Azərbaycan', flag: '🇦🇿' },
  ky: { name: 'Кыргызча', flag: '🇰🇬' },
  tg: { name: 'Тоҷикӣ', flag: '🇹🇯' },
  pl: { name: 'Polski', flag: '🇵🇱' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
};

// Default languages - English is mandatory, others are optional
const DEFAULT_LANGUAGE_CODES: LocaleCode[] = ['en', 'ru', 'kk'];

// Recommended languages for quick add (most popular)
const RECOMMENDED_LANGUAGES: LocaleCode[] = ['de', 'fr', 'es', 'tr', 'uz', 'uk', 'zh', 'ar'];

interface MultilingualInputProps {
  label: string;
  value: MultilingualString | I18nText;
  onChange: (value: MultilingualString | I18nText) => void;
  type?: 'input' | 'textarea';
  placeholder?: string;
  required?: boolean;
  enableRichText?: boolean;
  /** Allow adding more languages beyond the default - now true by default */
  allowAddLanguages?: boolean;
  /** Primary language (required field) - English is default */
  primaryLanguage?: LocaleCode;
  /** Show compact mode with fewer default tabs */
  compact?: boolean;
}

export function MultilingualInput({
  label,
  value,
  onChange,
  type = 'input',
  placeholder,
  required = false,
  enableRichText = false,
  allowAddLanguages = true,
  primaryLanguage = 'en',
  compact = false,
}: MultilingualInputProps) {
  const { t } = useTranslation();

  // Determine active languages from value + defaults
  // In compact mode, only show languages that have content + primary
  const [activeLanguages, setActiveLanguages] = useState<LocaleCode[]>(() => {
    const existingLangs = Object.keys(value || {}).filter(k =>
      (value as I18nText)[k]?.trim()
    );
    // Always include primary language (English)
    const defaultsToShow = compact
      ? [primaryLanguage]
      : DEFAULT_LANGUAGE_CODES;
    const combined = new Set([...defaultsToShow, ...existingLangs]);
    return Array.from(combined);
  });

  const [activeTab, setActiveTab] = useState<LocaleCode>(primaryLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  // Available languages to add
  const availableLanguages = useMemo(() => {
    return Object.entries(ALL_LANGUAGES)
      .filter(([code]) => !activeLanguages.includes(code))
      .map(([code, info]) => ({ code, ...info }));
  }, [activeLanguages]);

  const handleChange = (lang: LocaleCode, text: string) => {
    onChange({
      ...value,
      [lang]: text,
    });
  };

  const handleAddLanguage = (langCode: LocaleCode) => {
    setActiveLanguages(prev => [...prev, langCode]);
    setActiveTab(langCode);
    setLanguagePickerOpen(false);
  };

  const handleRemoveLanguage = (langCode: LocaleCode) => {
    // Can't remove primary language (English is mandatory)
    if (langCode === primaryLanguage) return;

    setActiveLanguages(prev => prev.filter(l => l !== langCode));

    const newValue = { ...value } as I18nText;
    delete newValue[langCode];
    onChange(newValue);

    if (activeTab === langCode) {
      setActiveTab(primaryLanguage);
    }
  };

  const handleTranslate = async () => {
    const sourceText = (value as I18nText)[activeTab];
    if (!sourceText?.trim()) {
      toast.error(t('ai.noTextToTranslate', 'Введите текст для перевода'));
      return;
    }

    setIsTranslating(true);
    try {
      const targetLanguages = activeLanguages.filter(l => l !== activeTab);

      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text: sourceText,
          sourceLanguage: activeTab,
          targetLanguages,
        },
      });

      if (error) throw error;

      onChange({
        ...value,
        ...data.translations,
      });

      toast.success(t('ai.translationSuccess', 'Перевод выполнен'));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('ai.translationError', 'Ошибка перевода'));
    } finally {
      setIsTranslating(false);
    }
  };

  const InputComponent = type === 'textarea' ? Textarea : Input;

  const getLanguageInfo = (code: LocaleCode) =>
    ALL_LANGUAGES[code] || { name: code.toUpperCase(), flag: '🏳️' };

  // Grid columns based on language count
  const getGridCols = () => {
    const count = activeLanguages.length;
    if (count <= 3) return 'grid-cols-3';
    if (count <= 4) return 'grid-cols-4';
    if (count <= 5) return 'grid-cols-5';
    return 'grid-cols-6';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating || !(value as I18nText)[activeTab]?.trim()}
            className="h-7 px-2 text-xs gap-1.5"
            title={t('ai.translateToOthers', 'Перевести на другие языки')}
          >
            {isTranslating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Languages className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{t('ai.translate', 'Перевести')}</span>
          </Button>

          {allowAddLanguages && availableLanguages.length > 0 && (
            <Popover open={languagePickerOpen} onOpenChange={setLanguagePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  title={t('language.addLanguage', 'Добавить язык')}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="end">
                <Command>
                  <CommandInput placeholder={t('language.searchLanguage', 'Поиск языка...')} />
                  <CommandList>
                    <CommandEmpty>{t('language.noLanguageFound', 'Язык не найден')}</CommandEmpty>
                    <CommandGroup>
                      {availableLanguages.map((lang) => (
                        <CommandItem
                          key={lang.code}
                          value={`${lang.code} ${lang.name}`}
                          onSelect={() => handleAddLanguage(lang.code)}
                          className="gap-2"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {lang.code.toUpperCase()}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as LocaleCode)}>
        <TabsList className={`grid w-full ${getGridCols()} glass-card backdrop-blur-md bg-muted/20 border-white/5`}>
          {activeLanguages.map((langCode) => {
            const lang = getLanguageInfo(langCode);
            const hasContent = !!(value as I18nText)[langCode]?.trim();
            const isPrimary = langCode === primaryLanguage;

            return (
              <TabsTrigger
                key={langCode}
                value={langCode}
                className="gap-1 relative group"
              >
                <span>{lang.flag}</span>
                <span className="hidden sm:inline text-xs">{lang.name}</span>
                {hasContent && !isPrimary && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
                {isPrimary && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-accent-foreground rounded-full" title="Required" />
                )}
                {!isPrimary && allowAddLanguages && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(langCode);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeLanguages.map((langCode) => {
          const lang = getLanguageInfo(langCode);

          return (
            <TabsContent key={langCode} value={langCode} className="mt-2">
              {enableRichText ? (
                <RichTextEditor
                  value={(value as I18nText)[langCode] || ''}
                  onChange={(text) => handleChange(langCode, text)}
                  placeholder={placeholder ? `${placeholder} (${lang.name})` : undefined}
                  type={type}
                  variant="glass"
                />
              ) : (
                <InputComponent
                  value={(value as I18nText)[langCode] || ''}
                  onChange={(e) => handleChange(langCode, e.target.value)}
                  placeholder={placeholder ? `${placeholder} (${lang.name})` : undefined}
                  className={type === 'textarea' ? 'min-h-[100px]' : ''}
                  variant="glass"
                />
              )}
              {langCode === primaryLanguage && required && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('fields.requiredEnglish', 'Required field (English is mandatory)')}
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {enableRichText && (
        <p className="text-xs text-muted-foreground">
          {t('hints.richTextVisual', 'Используйте кнопку 🔗 для добавления ссылок. Переносы строк сохраняются.')}
        </p>
      )}
    </div>
  );
}
