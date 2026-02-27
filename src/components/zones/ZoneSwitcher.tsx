/**
 * ZoneSwitcher - Zone selector for sidebar header
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import type { Zone } from '@/types/zones';

interface ZoneSwitcherProps {
  zones: Zone[];
  currentZone: Zone | null;
  onSelectZone: (id: string) => void;
  onCreateZone: (name: string, slug: string) => Promise<any>;
  collapsed?: boolean;
}

export const ZoneSwitcher = memo(function ZoneSwitcher({
  zones,
  currentZone,
  onSelectZone,
  onCreateZone,
  collapsed = false,
}: ZoneSwitcherProps) {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
      await onCreateZone(name.trim(), finalSlug);
      setCreateOpen(false);
      setName('');
      setSlug('');
      toast.success(t('zones.created', 'Zone created!'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to create zone');
    } finally {
      setCreating(false);
    }
  };

  // Show create button even when no zones exist
  const hasNoZones = zones.length === 0 && !currentZone;

  return (
    <>
      <div className={cn("px-3 mb-2", collapsed && "px-1")}>
        {hasNoZones ? (
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 h-9 text-sm font-medium border-dashed border-primary/30 text-primary hover:bg-primary/5",
              collapsed && "justify-center px-0"
            )}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="truncate">{t('zones.createZone', 'Создать зону')}</span>
            )}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 h-9 text-sm font-medium",
                  collapsed && "justify-center px-0"
                )}
              >
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">
                      {currentZone?.name || t('zones.selectZone', 'Select zone')}
                    </span>
                    {currentZone && (
                      <Badge variant="outline" className="text-[9px] px-1 h-4 shrink-0">
                        {currentZone.plan_status === 'active' ? 'BIZ' : currentZone.plan_status.toUpperCase()}
                      </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {zones.map(zone => (
                <DropdownMenuItem
                  key={zone.id}
                  onClick={() => onSelectZone(zone.id)}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="truncate flex-1">{zone.name}</span>
                  {zone.id === currentZone?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('zones.createZone', 'Создать зону')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.createZone', 'Create zone')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('zones.createZoneDescription', 'Define a name and slug to create a new dedicated workspace')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.name', 'Zone name')}</Label>
              <Input
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30));
                }}
                placeholder="My Studio"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.slug', 'Slug')}</Label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '').slice(0, 30))}
                placeholder="my-studio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
