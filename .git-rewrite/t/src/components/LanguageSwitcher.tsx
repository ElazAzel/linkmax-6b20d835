import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Globe, Check, Languages, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { SupportedLanguage } from '@/lib/i18n-helpers';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'ru' as SupportedLanguage, name: 'Русский', flag: '🇷🇺' },
  { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
  { code: 'kk' as SupportedLanguage, name: 'Қазақша', flag: '🇰🇿' },
];

interface LanguageSwitcherProps {
  onLanguageChange?: (from: SupportedLanguage, to: SupportedLanguage) => void;
  showAutoTranslate?: boolean;
  isTranslating?: boolean;
  onAutoTranslate?: () => void;
}

export function LanguageSwitcher({ 
  onLanguageChange,
  showAutoTranslate = false,
  isTranslating: externalTranslating = false,
  onAutoTranslate,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Use language context for auto-translate settings
  const languageContext = (() => {
    try {
      return useLanguage();
    } catch {
      // Context not available (used outside provider)
      return null;
    }
  })();

  const isTranslating = externalTranslating || (languageContext?.isTranslating ?? false);
  const autoTranslateEnabled = languageContext?.autoTranslateEnabled ?? false;

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    const prevLang = i18n.language as SupportedLanguage;
    
    // Use context if available
    if (languageContext) {
      languageContext.setCurrentLanguage(langCode);
    } else {
      i18n.changeLanguage(langCode);
    }
    
    setIsOpen(false);
    onLanguageChange?.(prevLang, langCode);
  };

  const handleAutoTranslateToggle = () => {
    if (languageContext) {
      languageContext.setAutoTranslateEnabled(!autoTranslateEnabled);
    }
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
            "group"
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
          <span className="text-sm font-medium text-foreground/80 hidden md:inline">
            {currentLanguage.name}
          </span>
          {isTranslating && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-56 p-1.5",
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50 shadow-xl",
          "rounded-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {languages.map((lang) => (
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
        ))}
        
        {/* Auto-translate toggle - always show if context is available */}
        {languageContext && (
          <>
            <DropdownMenuSeparator className="my-1" />
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
    </DropdownMenu>
  );
}
