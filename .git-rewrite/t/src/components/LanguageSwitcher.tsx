import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-44 p-1.5",
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
