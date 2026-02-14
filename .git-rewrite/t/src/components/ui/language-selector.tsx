/**
 * Language Selector Component
 * A dropdown to select the current UI language with visual flags
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LANGUAGE_DEFINITIONS, type LocaleCode } from '@/lib/i18n-helpers';

// UI languages supported by the app
const UI_LANGUAGES: { code: LocaleCode; name: string; flag: string }[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  showFlag?: boolean;
}

export function LanguageSelector({
  className,
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
  showFlag = true,
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = UI_LANGUAGES.find(l => l.code === i18n.language) 
    || UI_LANGUAGES.find(l => l.code === 'ru')!;

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn('gap-1.5', className)}
        >
          {showFlag && <span className="text-base">{currentLang.flag}</span>}
          {showLabel && (
            <span className="hidden sm:inline">{currentLang.name}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {UI_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-base">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact language switcher for mobile
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  
  const languages = UI_LANGUAGES;
  const currentIndex = languages.findIndex(l => l.code === i18n.language);

  const handleCycle = () => {
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];
    i18n.changeLanguage(nextLang.code);
    localStorage.setItem('i18nextLng', nextLang.code);
  };

  const currentLang = languages[currentIndex] || languages[0];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCycle}
      className={cn('h-9 w-9', className)}
      title={currentLang.name}
    >
      <span className="text-lg">{currentLang.flag}</span>
    </Button>
  );
}

/**
 * Inline language tabs for content viewing
 */
export function LanguageTabs({
  value,
  onChange,
  languages = UI_LANGUAGES,
  className,
}: {
  value: string;
  onChange: (lang: string) => void;
  languages?: { code: string; name: string; flag: string }[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === lang.code
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span>{lang.flag}</span>
          <span className="hidden sm:inline">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
