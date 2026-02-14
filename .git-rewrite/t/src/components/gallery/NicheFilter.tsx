import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import { cn } from '@/lib/utils';

interface NicheFilterProps {
  selectedNiche: Niche | null;
  onNicheChange: (niche: Niche | null) => void;
  nicheCounts?: Record<string, number>;
}

export function NicheFilter({ selectedNiche, onNicheChange, nicheCounts = {} }: NicheFilterProps) {
  const { t } = useTranslation();

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-3">
        {/* All filter */}
        <Badge
          variant={selectedNiche === null ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer transition-all px-3 py-1.5 text-sm shrink-0',
            selectedNiche === null 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-card/50 hover:bg-card border-border/30'
          )}
          onClick={() => onNicheChange(null)}
        >
          🌐 {t('gallery.allNiches', 'All')}
        </Badge>

        {/* Niche filters */}
        {NICHES.map((niche) => {
          const count = nicheCounts[niche] || 0;
          const isSelected = selectedNiche === niche;
          
          return (
            <Badge
              key={niche}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all px-3 py-1.5 text-sm shrink-0 gap-1.5',
                isSelected 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-card/50 hover:bg-card border-border/30'
              )}
              onClick={() => onNicheChange(isSelected ? null : niche)}
            >
              <span>{NICHE_ICONS[niche]}</span>
              <span>{t(`niches.${niche}`, niche)}</span>
              {count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              )}
            </Badge>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
