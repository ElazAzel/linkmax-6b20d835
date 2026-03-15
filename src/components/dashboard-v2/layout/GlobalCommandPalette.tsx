import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, loading, search, clear } = useGlobalSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
    } else {
      clear();
    }
  }, [debouncedQuery, search, clear]);

  const onSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="h-4 w-4 mr-2 text-muted-foreground" />;
      case 'contact': return <Users className="h-4 w-4 mr-2 text-blue-500" />;
      case 'deal': return <Briefcase className="h-4 w-4 mr-2 text-purple-500" />;
      case 'task': return <CheckSquare className="h-4 w-4 mr-2 text-green-500" />;
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
          ) : (
            t('search.noResults', 'No results found.')
          )}
        </CommandEmpty>

        {searchQuery.length === 0 && (
          <>
            <CommandGroup heading={t('search.groups.quickActions', 'Quick Actions')}>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/crm?sheet=lead'); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('crm.createLead', 'Create Lead')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/crm?sheet=deal'); }}>
                <Plus className="h-4 w-4 mr-2 text-purple-500" />
                {t('crm.createDeal', 'Create Deal')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard/crm?tab=invoices'); }}>
                <Receipt className="h-4 w-4 mr-2 text-blue-500" />
                {t('crm.createInvoice', 'Create Invoice')}
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/dashboard?tab=automations&subtab=sequences'); }}>
                <Mail className="h-4 w-4 mr-2 text-green-500" />
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
