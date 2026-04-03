import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useAuth } from '@/hooks/user/useAuth';
import Search from 'lucide-react/dist/esm/icons/search';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import User from 'lucide-react/dist/esm/icons/user';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Settings from 'lucide-react/dist/esm/icons/settings';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Plus from 'lucide-react/dist/esm/icons/plus';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results, search, loading } = useGlobalSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      search(searchQuery);
    }
  }, [searchQuery, search]);

  const onSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder={t('common.search_placeholder', 'Search for pages, contacts...')} 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? t('common.searching', 'Searching...') : t('common.no_results', 'No results found.')}</CommandEmpty>
        
        {searchQuery.length < 2 && (
          <>
            <CommandGroup heading={t('common.quick_actions', 'Quick Actions')}>
              <CommandItem onSelect={() => onSelect('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>{t('nav.dashboard', 'Dashboard')}</span>
              </CommandItem>
              <CommandItem onSelect={() => onSelect('/dashboard/pages')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>{t('nav.pages', 'Pages')}</span>
              </CommandItem>
              <CommandItem onSelect={() => onSelect('/dashboard/crm')}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>{t('nav.crm', 'CRM')}</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => onSelect('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('nav.settings', 'Settings')}</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t('common.new', 'Create New')}>
              <CommandItem onSelect={() => onSelect('/dashboard/pages/new')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>{t('dashboard.pages.create_new', 'New Page')}</span>
              </CommandItem>
              <CommandItem onSelect={() => onSelect('/dashboard/crm/contacts/new')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>{t('crm.contacts.create_new', 'New Contact')}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {results.length > 0 && (
          <>
            <CommandGroup heading={t('common.results', 'Search Results')}>
              {results.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => onSelect(result.url)}
                  className="flex items-center"
                >
                  {result.type === 'page' ? (
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  ) : result.type === 'contact' ? (
                    <User className="mr-2 h-4 w-4 text-emerald-500" />
                  ) : result.type === 'deal' ? (
                    <Briefcase className="mr-2 h-4 w-4 text-amber-500" />
                  ) : (
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
