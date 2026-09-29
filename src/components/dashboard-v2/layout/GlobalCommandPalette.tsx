import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { Badge } from "@/components/ui/badge";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Users from "lucide-react/dist/esm/icons/users";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Layout from "lucide-react/dist/esm/icons/layout";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Settings from "lucide-react/dist/esm/icons/settings";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import Mail from "lucide-react/dist/esm/icons/mail";
import { useDebounce } from "@/hooks/useDebounce";
import { useActivePageStore } from "@/store/useActivePageStore";

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, loading, error, search, clear } = useGlobalSearch();
  const setActivePageId = useActivePageStore((state) => state.setActivePageId);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // One palette per screen: the editor tab and zone tabs have their own
  // Cmd+K palettes; opening this one as well stacked several dialogs.
  const location = useLocation();
  const tabParam = new URLSearchParams(location.search).get("tab");
  const ownsShortcut =
    tabParam !== "editor" &&
    !tabParam?.startsWith("zone-") &&
    !location.pathname.startsWith("/dashboard/zone-");

  useEffect(() => {
    if (!ownsShortcut) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [ownsShortcut]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
    } else {
      clear();
    }
  }, [debouncedQuery, search, clear]);

  const onSelect = (result: SearchResult) => {
    setOpen(false);
    // Open the found page in the editor, not whichever page was active.
    if (result.type === 'page') setActivePageId(result.id);
    navigate(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="h-4 w-4 mr-2 text-muted-foreground" />;
      case 'contact': return <Users className="h-4 w-4 mr-2 text-info" />;
      case 'deal': return <Briefcase className="h-4 w-4 mr-2 text-primary" />;
      case 'task': return <CheckSquare className="h-4 w-4 mr-2 text-success" />;
      default: return null;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder={t('search.placeholder', 'Type a command or search...')} 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
              {t('common.loading', 'Loading...')}
            </div>
          ) : error ? (
            <span className="text-destructive">{t('search.error', 'Search failed. Try again.')}</span>
          ) : (
            t('search.noResults', 'No results found.')
          )}
        </CommandEmpty>

        {searchQuery.length === 0 && (
          <>
            <CommandGroup heading={t('search.groups.quickActions', 'Quick Actions')}>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=pages&action=new-subpage'); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('search.actions.newSubPage', 'Добавить страницу сайта')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=pages&action=site-template'); }}>
                <Layout className="h-4 w-4 mr-2" />
                {t('search.actions.applyTemplate', 'Применить шаблон сайта')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=editor&action=add-section'); }}>
                <Plus className="h-4 w-4 mr-2 text-primary" />
                {t('search.actions.addSection', 'Добавить секцию')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/leads'); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('crm.createLead', 'Create Lead')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/zone-deals'); }}>
                <Plus className="h-4 w-4 mr-2 text-primary" />
                {t('crm.createDeal', 'Create Deal')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/zone-invoices'); }}>
                <Receipt className="h-4 w-4 mr-2 text-info" />
                {t('crm.createInvoice', 'Create Invoice')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/zone-automations'); }}>
                <Mail className="h-4 w-4 mr-2 text-success" />
                {t('automations.startSequence', 'Manage Sequences')}
              </CommandItem>
            </CommandGroup>
            
            <CommandGroup heading={t('search.groups.navigation', 'Navigation')}>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard'); }}>
                <Layout className="h-4 w-4 mr-2" />
                {t('nav.dashboard', 'Dashboard')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=insights'); }}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('nav.insights', 'Insights')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=settings'); }}>
                <Settings className="h-4 w-4 mr-2" />
                {t('nav.settings', 'Settings')}
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {Object.entries(groupedResults).map(([type, items]) => (
          <CommandGroup key={type} heading={t(`search.groups.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}>
            {items.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                value={`${result.title} ${result.subtitle}`}
                onSelect={() => onSelect(result)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  {getIcon(result.type)}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    )}
                  </div>
                </div>
                {result.date && (
                   <span className="text-xs text-muted-foreground ml-auto">
                     {new Date(result.date).toLocaleDateString()}
                   </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
