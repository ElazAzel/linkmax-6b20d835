/**
 * PageSwitcher - Component for switching between user pages
 * Desktop: Dropdown in header
 * Mobile: Bottom sheet
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Plus,
  Check,
  Crown,
  FileText,
  Settings,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { UserPage, PageLimits } from '@/hooks/useMultiPage';

interface PageSwitcherProps {
  pages: UserPage[];
  activePage: UserPage | null;
  limits: PageLimits | null;
  isPremium: boolean;
  onSwitchPage: (pageId: string) => void;
  onCreatePage: () => void;
  onManagePages: () => void;
  onUpgradePage?: (pageId: string) => void;
}

// Page status badge component
function PageStatusBadge({ page }: { page: UserPage }) {
  const { t } = useTranslation();

  if (page.isPrimaryPaid) {
    return (
      <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] px-1.5">
        <Crown className="h-2.5 w-2.5 mr-0.5" />
        {t('dashboard.pageSwitcher.included', 'Incl.')}
      </Badge>
    );
  }

  if (page.isPaid) {
    return (
      <Badge variant="secondary" className="bg-violet-500/20 text-violet-600 border-violet-500/30 text-[10px] px-1.5">
        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
        {t('dashboard.pageSwitcher.addon', 'Add-on')}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] px-1.5 text-muted-foreground">
      {t('dashboard.pageSwitcher.free', 'Free')}
    </Badge>
  );
}

// Page item in the list
function PageItem({
  page,
  isActive,
  onSelect,
}: {
  page: UserPage;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-10 w-10 rounded-xl">
        <AvatarImage src={page.previewUrl} alt={page.title} />
        <AvatarFallback className="rounded-xl bg-muted text-sm font-bold">
          {page.title.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium truncate", isActive && "text-primary")}>
            {page.title}
          </span>
          {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">/{page.slug}</span>
          <PageStatusBadge page={page} />
        </div>
      </div>
    </button>
  );
}

// Mobile sheet version
function MobilePageSwitcher({
  pages,
  activePage,
  limits,
  isPremium,
  onSwitchPage,
  onCreatePage,
  onManagePages,
}: PageSwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPages = search
    ? pages.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : pages;

  const handleSelect = (pageId: string) => {
    onSwitchPage(pageId);
    setOpen(false);
  };

  const handleCreate = () => {
    setOpen(false);
    onCreatePage();
  };

  const handleManage = () => {
    setOpen(false);
    onManagePages();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 gap-2">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={activePage?.previewUrl} alt={activePage?.title} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-bold">
              {activePage?.title?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">{activePage?.title || t('dashboard.pageSwitcher.select', 'Select page')}</div>
            <div className="text-xs text-muted-foreground">/{activePage?.slug || ''}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>{t('dashboard.pageSwitcher.title', 'Your Pages')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Limits counter */}
          {limits && (
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="text-muted-foreground">
                {t('dashboard.pageSwitcher.pagesUsed', 'Pages used')}
              </span>
              <Badge variant="secondary" className="font-mono">
                {limits.currentPages} / {limits.maxPages}
              </Badge>
            </div>
          )}

          {/* Search */}
          {pages.length > 3 && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.pageSwitcher.search', 'Search pages...')}
              className="rounded-xl"
            />
          )}

          {/* Pages list */}
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {filteredPages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                isActive={activePage?.id === page.id}
                onSelect={() => handleSelect(page.id)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2 border-t">
            {limits?.canCreate && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.pageSwitcher.createPage', 'Create new page')}
              </Button>
            )}
            {!limits?.canCreate && !isPremium && (
              <Button
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500"
                onClick={handleManage}
              >
                <Crown className="h-4 w-4 mr-2" />
                {t('dashboard.pageSwitcher.upgradePro', 'Upgrade to Pro for more pages')}
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl text-muted-foreground"
              onClick={handleManage}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('dashboard.pageSwitcher.managePages', 'Manage all pages')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop dropdown version
function DesktopPageSwitcher({
  pages,
  activePage,
  limits,
  isPremium,
  onSwitchPage,
  onCreatePage,
  onManagePages,
}: PageSwitcherProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto py-2 px-3 gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={activePage?.previewUrl} alt={activePage?.title} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-bold">
              {activePage?.title?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="text-sm font-medium">{activePage?.title || t('dashboard.pageSwitcher.select', 'Select page')}</div>
            <div className="text-xs text-muted-foreground">/{activePage?.slug || ''}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 rounded-xl p-2">
        {/* Limits */}
        {limits && (
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {t('dashboard.pageSwitcher.pagesUsed', 'Pages used')}
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              {limits.currentPages}/{limits.maxPages}
            </Badge>
          </div>
        )}

        {/* Pages */}
        {pages.map((page) => (
          <DropdownMenuItem
            key={page.id}
            onClick={() => onSwitchPage(page.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
              activePage?.id === page.id && "bg-primary/10"
            )}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={page.previewUrl} alt={page.title} />
              <AvatarFallback className="rounded-lg bg-muted text-xs font-bold">
                {page.title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{page.title}</span>
                <PageStatusBadge page={page} />
              </div>
              <span className="text-xs text-muted-foreground">/{page.slug}</span>
            </div>
            {activePage?.id === page.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-2" />

        {/* Create */}
        {limits?.canCreate && (
          <DropdownMenuItem
            onClick={onCreatePage}
            className="flex items-center gap-3 p-3 rounded-lg"
          >
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{t('dashboard.pageSwitcher.createPage', 'Create new page')}</span>
          </DropdownMenuItem>
        )}

        {/* Upgrade prompt */}
        {!limits?.canCreate && !isPremium && (
          <DropdownMenuItem
            onClick={onManagePages}
            className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-600">{t('dashboard.pageSwitcher.getMore', 'Get more pages')}</div>
              <div className="text-xs text-muted-foreground">{t('dashboard.pageSwitcher.upgradeDesc', 'Upgrade to Pro')}</div>
            </div>
          </DropdownMenuItem>
        )}

        {/* Manage */}
        <DropdownMenuItem
          onClick={onManagePages}
          className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground"
        >
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <span className="text-sm">{t('dashboard.pageSwitcher.managePages', 'Manage all pages')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const PageSwitcher = memo(function PageSwitcher(props: PageSwitcherProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePageSwitcher {...props} />;
  }

  return <DesktopPageSwitcher {...props} />;
});
