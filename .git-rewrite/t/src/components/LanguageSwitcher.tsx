import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { Globe, Check, Languages, Loader2, Sparkles, Plus, Search, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { LocaleCode } from '@/lib/i18n-helpers';
import { useOptionalLanguage } from '@/contexts/LanguageContext';
import { TranslationLanguageSelector, getLanguageInfo } from '@/components/translation/TranslationLanguageSelector';

// Extended language list - covers major world languages
const ALL_LANGUAGES: { code: LocaleCode; name: string; flag: string }[] = [
  // Primary languages (shown first)
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  // CIS & neighboring countries
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'hy', name: 'Հայdelays', flag: '🇦🇲' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  // European languages
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  // Turkish
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  // Asian languages
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  // Middle Eastern
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
];

// Default visible languages (most common)
const DEFAULT_VISIBLE_CODES = ['ru', 'en', 'kk', 'uk', 'uz', 'tr', 'de'];

interface LanguageSwitcherProps {
  onLanguageChange?: (from: LocaleCode, to: LocaleCode) => void;
  showAutoTranslate?: boolean;
  isTranslating?: boolean;
  onAutoTranslate?: () => void;
  /** Show compact version */
  compact?: boolean;
  /** Show expanded language list by default */
  showAllLanguages?: boolean;
}

export function LanguageSwitcher({
  onLanguageChange,
  showAutoTranslate = false,
  isTranslating: externalTranslating = false,
  onAutoTranslate,
  compact = false,
  showAllLanguages = false,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreLanguages, setShowMoreLanguages] = useState(showAllLanguages);

  const languageContext = useOptionalLanguage();

  const isTranslating = externalTranslating || (languageContext?.isTranslating ?? false);
  const autoTranslateEnabled = languageContext?.autoTranslateEnabled ?? false;
  const browserLanguage = languageContext?.browserLanguage;
  const targetTranslationLanguages = languageContext?.targetTranslationLanguages ?? ['en'];
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);

  // Show browser language notification on first load
  useEffect(() => {
    if (browserLanguage && languageContext) {
      const hasShownNotification = localStorage.getItem('browserLangNotificationShown');
      if (!hasShownNotification && browserLanguage !== 'en') {
        // Auto-set browser language as current language on first visit
        const storedLang = localStorage.getItem('i18nextLng');
        if (!storedLang) {
          languageContext.setCurrentLanguage(browserLanguage);
        }
        localStorage.setItem('browserLangNotificationShown', 'true');
      }
    }
  }, [browserLanguage, languageContext]);

  // Filter and organize languages
  const { visibleLanguages, moreLanguages, filteredLanguages } = useMemo(() => {
    // Prioritize browser language in visible list
    let visibleCodes = [...DEFAULT_VISIBLE_CODES];
    if (browserLanguage && !visibleCodes.includes(browserLanguage)) {
      visibleCodes = [browserLanguage, ...visibleCodes];
    }

    const visible = ALL_LANGUAGES.filter(l => visibleCodes.includes(l.code));
    const more = ALL_LANGUAGES.filter(l => !visibleCodes.includes(l.code));

    // Filter by search
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? ALL_LANGUAGES.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
      )
      : [];

    return { visibleLanguages: visible, moreLanguages: more, filteredLanguages: filtered };
  }, [searchQuery, browserLanguage]);

  const handleLanguageChange = (langCode: LocaleCode) => {
    const prevLang = i18n.language as LocaleCode;

    // Use context if available
    if (languageContext) {
      languageContext.setCurrentLanguage(langCode);
    } else {
      i18n.changeLanguage(langCode);
    }

    setIsOpen(false);
    setSearchQuery('');
    setShowMoreLanguages(false);
    onLanguageChange?.(prevLang, langCode);
  };

  const handleAutoTranslateToggle = () => {
    if (languageContext) {
      languageContext.setAutoTranslateEnabled(!autoTranslateEnabled);
    }
  };

  const currentLanguage = ALL_LANGUAGES.find(l => l.code === i18n.language) || ALL_LANGUAGES[0];

  const renderLanguageItem = (lang: { code: LocaleCode; name: string; flag: string }) => (
    <DropdownMenuItem
      key={lang.code}
      onClick={() => handleLanguageChange(lang.code)}
      data-testid={`language-option-${lang.code}`}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
        "transition-all duration-200",
        "hover:bg-primary/10",
        i18n.language === lang.code && "bg-primary/5"
      )}
    >
      <span className="text-lg">{lang.flag}</span>
      <span className={cn(
        "flex-1 text-sm font-medium",
        i18n.language === lang.code ? "text-foreground" : "text-muted-foreground"
      )}>
        {lang.name}
      </span>
      {i18n.language === lang.code && (
        <Check className="h-4 w-4 text-primary animate-in zoom-in-50 duration-200" />
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setSearchQuery('');
        setShowMoreLanguages(showAllLanguages);
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="language-switcher-trigger"
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 rounded-full",
            "bg-background/50 backdrop-blur-sm border border-border/50",
            "hover:bg-background/80 hover:border-primary/30",
            "transition-all duration-300 ease-out",
            "group",
            compact && "h-8 px-2"
          )}
        >
          <Globe className={cn(
            "h-4 w-4 text-muted-foreground",
            "group-hover:text-primary transition-colors duration-300",
            isOpen && "text-primary"
          )} />
          <span className="text-sm font-medium hidden sm:inline">
            {currentLanguage.flag}
          </span>
          {!compact && (
            <span className="text-sm font-medium text-foreground/80 hidden md:inline">
              {currentLanguage.name}
            </span>
          )}
          {isTranslating && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 p-1.5",
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50 shadow-xl",
          "rounded-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Search input */}
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('language.searchLanguage', 'Поиск языка...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm bg-muted/50"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          {/* Search results */}
          {searchQuery && (
            <>
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(renderLanguageItem)
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t('language.noLanguageFound', 'Язык не найден')}
                </div>
              )}
            </>
          )}

          {/* Default view */}
          {!searchQuery && (
            <>
              {/* Primary languages */}
              {visibleLanguages.map(renderLanguageItem)}

              {/* More languages */}
              {moreLanguages.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-1" />

                  {showMoreLanguages ? (
                    // Show all languages
                    <>
                      <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                        {t('language.moreLanguages', 'Другие языки')}
                      </div>
                      {moreLanguages.map(renderLanguageItem)}
                    </>
                  ) : (
                    // Show "More languages" button
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMoreLanguages(true);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                        "transition-all duration-200",
                        "hover:bg-muted/50"
                      )}
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('language.showMoreLanguages', 'Ещё {{count}} языков', { count: moreLanguages.length })}
                      </span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </>
          )}
        </ScrollArea>

        {/* Auto-translate section */}
        {languageContext && (
          <>
            <DropdownMenuSeparator className="my-1" />

            {/* Browser language indicator */}
            {browserLanguage && browserLanguage !== i18n.language && (
              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Globe className="h-3 w-3" />
                {t('translation.browserLanguageDetected', 'Язык браузера: {{language}}', {
                  language: getLanguageInfo(browserLanguage).name
                })}
              </div>
            )}

            {/* Auto-translate toggle */}
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "transition-all duration-200"
              )}
            >
              <Sparkles className={cn(
                "h-4 w-4",
                autoTranslateEnabled ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "flex-1 text-sm font-medium",
                autoTranslateEnabled ? "text-foreground" : "text-muted-foreground"
              )}>
                {t('language.autoTranslate', 'Автоперевод')}
              </span>
              <Switch
                checked={autoTranslateEnabled}
                onCheckedChange={handleAutoTranslateToggle}
                className="scale-90"
              />
            </div>

            {/* Translation languages settings */}
            {autoTranslateEnabled && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setShowTranslationSettings(true);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                  "transition-all duration-200",
                  "hover:bg-muted/50"
                )}
              >
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm text-muted-foreground">
                  {t('translation.selectLanguages', 'Выбрать языки')}
                </span>
                <div className="flex gap-0.5">
                  {targetTranslationLanguages.slice(0, 3).map(code => (
                    <span key={code} className="text-xs">{getLanguageInfo(code).flag}</span>
                  ))}
                  {targetTranslationLanguages.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      +{targetTranslationLanguages.length - 3}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}

        {showAutoTranslate && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onAutoTranslate?.();
                setIsOpen(false);
              }}
              disabled={isTranslating}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                "transition-all duration-200",
                "hover:bg-primary/10",
                "text-primary"
              )}
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              <span className="flex-1 text-sm font-medium">
                {isTranslating
                  ? t('ai.translating', 'Перевод...')
                  : t('ai.translateNow', 'Перевести сейчас')
                }
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Translation Language Selector Dialog */}
      {languageContext && (
        <TranslationLanguageSelector
          selectedLanguages={targetTranslationLanguages}
          onSelectionChange={(langs) => languageContext.setTargetTranslationLanguages(langs)}
          sourceLanguage={i18n.language as LocaleCode}
          isTranslating={isTranslating}
          compact={false}
          open={showTranslationSettings}
          onOpenChange={setShowTranslationSettings}
        />
      )}
    </DropdownMenu>
  );
}
