/**
 * Translation Language Selector
 * Allows users to select which languages their content should be translated to.
 * English is always mandatory.
 */
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe, Languages, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import type { LocaleCode } from '@/lib/i18n-helpers';

// All supported languages for translation
export const TRANSLATION_LANGUAGES: { code: LocaleCode; name: string; flag: string; region?: string }[] = [
  // Primary - always shown first
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'International' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', region: 'CIS' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿', region: 'CIS' },
  // CIS & Turkic
  { code: 'uk', name: 'Українська', flag: '🇺🇦', region: 'CIS' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿', region: 'CIS' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', region: 'Turkic' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿', region: 'CIS' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬', region: 'CIS' },
  { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯', region: 'CIS' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾', region: 'CIS' },
  // European
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'Europe' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'Europe' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', region: 'Europe' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', region: 'Europe' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', region: 'Europe' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', region: 'Europe' },
  // Asian
  { code: 'zh', name: '中文', flag: '🇨🇳', region: 'Asia' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', region: 'Asia' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', region: 'Asia' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', region: 'Asia' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', region: 'Middle East' },
];

// Detect browser language
export function detectBrowserLanguage(): LocaleCode {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if it's a supported language
  const supported = TRANSLATION_LANGUAGES.find(l => l.code === langCode);
  if (supported) return langCode;

  // Fallback to English
  return 'en';
}

// Get language info by code
export function getLanguageInfo(code: LocaleCode) {
  return TRANSLATION_LANGUAGES.find(l => l.code === code) || {
    code,
    name: code.toUpperCase(),
    flag: '🏳️'
  };
}

interface TranslationLanguageSelectorProps {
  selectedLanguages: LocaleCode[];
  onSelectionChange: (languages: LocaleCode[]) => void;
  sourceLanguage?: LocaleCode;
  isTranslating?: boolean;
  onTranslate?: () => void;
  /** Compact mode - just shows selected badges */
  compact?: boolean;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TranslationLanguageSelector({
  selectedLanguages,
  onSelectionChange,
  sourceLanguage,
  isTranslating = false,
  onTranslate,
  compact = false,
  open: controlledOpen,
  onOpenChange,
}: TranslationLanguageSelectorProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Ensure English is always selected
  const ensuredSelection = useMemo(() => {
    if (!selectedLanguages.includes('en')) {
      return ['en', ...selectedLanguages];
    }
    return selectedLanguages;
  }, [selectedLanguages]);

  // Group languages by region
  const groupedLanguages = useMemo(() => {
    const groups: Record<string, typeof TRANSLATION_LANGUAGES> = {};

    for (const lang of TRANSLATION_LANGUAGES) {
      const region = lang.region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(lang);
    }

    return groups;
  }, []);

  const handleToggleLanguage = (code: LocaleCode) => {
    // Can't deselect English
    if (code === 'en') return;
    // Can't select source language
    if (code === sourceLanguage) return;

    if (ensuredSelection.includes(code)) {
      onSelectionChange(ensuredSelection.filter(l => l !== code));
    } else {
      onSelectionChange([...ensuredSelection, code]);
    }
  };

  const handleSelectAll = () => {
    const allCodes = TRANSLATION_LANGUAGES
      .map(l => l.code)
      .filter(c => c !== sourceLanguage);
    onSelectionChange(allCodes);
  };

  const handleSelectNone = () => {
    // Keep only English (mandatory)
    onSelectionChange(['en']);
  };

  // Auto-detect browser language and set it as primary
  const handleAutoDetectLanguage = () => {
    const browserLanguage = detectBrowserLanguage();
    if (!ensuredSelection.includes(browserLanguage)) {
      onSelectionChange([browserLanguage, ...ensuredSelection]);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {ensuredSelection.map(code => {
          const lang = getLanguageInfo(code);
          return (
            <Badge
              key={code}
              variant={code === 'en' ? 'default' : 'secondary'}
              className="gap-1"
            >
              <span>{lang.flag}</span>
              <span className="text-xs">{lang.name}</span>
            </Badge>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setIsOpen(true)}
        >
          <Globe className="h-3 w-3 mr-1" />
          {t('translation.edit', 'Изменить')}
        </Button>
      </div>
    );
  }

  // If controlled externally, don't render trigger
  const showTrigger = controlledOpen === undefined;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Languages className="h-4 w-4" />
            {t('translation.selectLanguages', 'Выбрать языки')}
            <Badge variant="secondary" className="ml-1">
              {ensuredSelection.length}
            </Badge>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {t('translation.targetLanguages', 'Языки перевода')}
          </DialogTitle>
          <DialogDescription>
            {t('translation.selectDescription', 'Выберите языки, на которые будет переведён ваш контент. Английский обязателен.')}
          </DialogDescription>
        </DialogHeader>

        {/* Quick actions */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            {t('translation.selectAll', 'Выбрать все')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectNone}
            className="text-xs"
          >
            {t('translation.selectNone', 'Снять выбор')}
          </Button>
          <div className="flex-1" />
          <Badge variant="outline">
            {t('translation.selected', 'Выбрано')}: {ensuredSelection.length}
          </Badge>
        </div>

        {/* Language list grouped by region */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedLanguages).map(([region, languages]) => (
              <div key={region}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  {region}
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {languages.map(lang => {
                    const isSelected = ensuredSelection.includes(lang.code);
                    const isSource = lang.code === sourceLanguage;
                    const isMandatory = lang.code === 'en';

                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleToggleLanguage(lang.code)}
                        disabled={isSource || isMandatory}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                          "hover:bg-muted/50",
                          isSelected && "bg-primary/10 border border-primary/30",
                          isSource && "opacity-50 cursor-not-allowed",
                          isMandatory && "bg-primary/5 border border-primary/20"
                        )}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className={cn(
                          "flex-1 text-sm",
                          isSelected ? "font-medium" : "text-muted-foreground"
                        )}>
                          {lang.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {isMandatory && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('translation.englishMandatory', 'Английский обязателен для международной аудитории')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {isSource && (
                          <Badge variant="outline" className="text-xs">
                            {t('translation.source', 'Источник')}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Selected languages preview */}
          <div className="flex-1 flex flex-wrap gap-1">
            {ensuredSelection.slice(0, 5).map(code => {
              const lang = getLanguageInfo(code);
              return (
                <Badge key={code} variant="secondary" className="text-xs">
                  {lang.flag}
                </Badge>
              );
            })}
            {ensuredSelection.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{ensuredSelection.length - 5}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('common.cancel', 'Отмена')}
            </Button>
            {onTranslate && (
              <Button onClick={() => { onTranslate(); setIsOpen(false); }} disabled={isTranslating}>
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Languages className="h-4 w-4 mr-2" />
                )}
                {t('translation.translateNow', 'Перевести')}
              </Button>
            )}
            {!onTranslate && (
              <Button onClick={() => setIsOpen(false)}>
                {t('common.save', 'Сохранить')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
