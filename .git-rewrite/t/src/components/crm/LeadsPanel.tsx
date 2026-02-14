import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads, LeadStatus } from '@/hooks/useLeads';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  Crown,
  Download,
  BarChart3,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { AddLeadDialog } from './AddLeadDialog';
import { LeadDetails } from './LeadDetails';
import { AnalyticsPanel } from './AnalyticsPanel';
import { BookingsPanel } from './BookingsPanel';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { Lead } from '@/hooks/useLeads';

interface LeadsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  qualified: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  converted: 'bg-green-500/20 text-green-500 border-green-500/30',
  lost: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const sourceColors: Record<string, string> = {
  form: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  messenger: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  manual: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
  page_view: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  other: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
};

const sourceIcons: Record<string, string> = {
  form: '📝',
  messenger: '💬',
  manual: '✏️',
  page_view: '👁️',
  other: '📌',
};

export function LeadsPanel({ open, onOpenChange }: LeadsPanelProps) {
  const { t } = useTranslation();
  const { isPremium } = usePremiumStatus();
  const { leads, loading, getLeadStats, refreshLeads } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings' | 'analytics'>('leads');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const stats = getLeadStats();

  // Refresh leads when panel opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      refreshLeads();
    }
    onOpenChange(isOpen);
  };

  // Refresh leads when lead details closes
  const handleLeadDetailsClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedLead(null);
      refreshLeads();
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.phone?.includes(searchQuery)) ||
      (lead.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const sourceStats = {
    form: leads.filter(l => l.source === 'form').length,
    messenger: leads.filter(l => l.source === 'messenger').length,
    manual: leads.filter(l => l.source === 'manual').length,
    page_view: leads.filter(l => l.source === 'page_view').length,
    other: leads.filter(l => l.source === 'other').length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error(t('crm.noLeadsToExport', 'No leads to export'));
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Notes', 'Created'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email || '',
      lead.phone || '',
      lead.status,
      lead.source,
      lead.notes || '',
      new Date(lead.created_at).toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(t('crm.exportSuccess', 'Leads exported successfully'));
  };

  if (!isPremium) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('crm.title', 'CRM')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
            <Crown className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('crm.premiumRequired', 'Premium Feature')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('crm.premiumDescription', 'Upgrade to Premium to access CRM and track your leads')}
            </p>
            <Button onClick={openPremiumPurchase}>
              <Crown className="h-4 w-4 mr-2" />
              {t('freemium.upgradeToPremium', 'Upgrade to Premium')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="p-3 sm:p-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
              {activeTab === 'leads' ? <Users className="h-4 w-4 sm:h-5 sm:w-5" /> : <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
              {activeTab === 'leads' ? t('crm.title', 'CRM') : t('analytics.title', 'Analytics')}
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              {activeTab === 'leads' 
                ? t('crm.description', 'Manage your leads and interactions')
                : t('analytics.description', 'Track your page performance')
              }
            </SheetDescription>
          </SheetHeader>
          
          {/* Tabs for Leads / Analytics */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'bookings' | 'analytics')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-0 rounded-none border-b bg-transparent h-10 sm:h-11">
              <TabsTrigger value="leads" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                {t('crm.leads', 'Leads')}
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm">
                <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                {t('crm.bookings', 'Bookings')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                {t('analytics.title', 'Analytics')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="mt-0 h-[calc(100vh-150px)]">
              <BookingsPanel />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsPanel />
            </TabsContent>
            
            <TabsContent value="leads" className="mt-0">
              {/* Status Stats - Scrollable on mobile */}
              <div className="overflow-x-auto -mx-0">
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-3 sm:p-4 border-b min-w-[320px]">
                  {(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                      className={`p-1.5 sm:p-2 rounded-lg text-center transition-all ${
                        statusFilter === status ? 'ring-2 ring-primary ring-offset-1' : ''
                      } ${statusColors[status]}`}
                    >
                      <div className="text-base sm:text-lg font-bold">{stats[status]}</div>
                      <div className="text-[8px] sm:text-[10px] uppercase opacity-70 truncate">
                        {t(`crm.status.${status}`, status)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter - Scrollable */}
              <div className="flex gap-1.5 sm:gap-2 p-3 sm:p-4 border-b overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    sourceFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {t('crm.allSources', 'All')} ({stats.total})
                </button>
                {(['form', 'messenger', 'manual', 'page_view', 'other'] as const).map(source => (
                  sourceStats[source] > 0 && (
                    <button
                      key={source}
                      onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        sourceFilter === source ? 'ring-2 ring-primary ring-offset-1' : ''
                      } ${sourceColors[source]}`}
                    >
                      <span>{sourceIcons[source]}</span>
                      <span className="hidden sm:inline">{t(`crm.source.${source}`, source)}</span>
                      ({sourceStats[source]})
                    </button>
                  )
                ))}
              </div>

              {/* Search, Export & Add */}
              <div className="p-3 sm:p-4 border-b flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('crm.searchPlaceholder', 'Search...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={exportToCSV} title={t('crm.export', 'Export CSV')} className="h-9 w-9 sm:h-10 sm:w-10">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button size="icon" onClick={() => setAddDialogOpen(true)} className="h-9 w-9 sm:h-10 sm:w-10">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Leads List */}
              <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-300px)]">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {t('messages.loading', 'Loading...')}
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {searchQuery || statusFilter !== 'all' 
                      ? t('crm.noResults', 'No leads found')
                      : t('crm.noLeads', 'No leads yet. Add your first lead!')
                    }
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredLeads.map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="w-full p-3 sm:p-4 text-left hover:bg-accent/50 transition-colors active:bg-accent/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs sm:text-sm">{sourceIcons[lead.source]}</span>
                              <span className="font-medium text-sm sm:text-base truncate">{lead.name}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                              {lead.email && (
                                <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </span>
                              )}
                              {lead.phone && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <Phone className="h-3 w-3" />
                                  <span className="hidden sm:inline">{lead.phone}</span>
                                  <span className="sm:hidden">{lead.phone.slice(-4)}</span>
                                </span>
                              )}
                            </div>
                            {lead.notes && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                {lead.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                            <Badge variant="outline" className={`${statusColors[lead.status]} text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                              {t(`crm.status.${lead.status}`, lead.status)}
                            </Badge>
                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {formatDate(lead.created_at)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AddLeadDialog 
        open={addDialogOpen} 
        onOpenChange={(isOpen) => {
          setAddDialogOpen(isOpen);
          if (!isOpen) refreshLeads();
        }} 
      />
      
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          open={!!selectedLead} 
          onOpenChange={handleLeadDetailsClose} 
        />
      )}
    </>
  );
}