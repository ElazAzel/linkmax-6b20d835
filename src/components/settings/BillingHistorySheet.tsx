/**
 * BillingHistorySheet - Sheet displaying user's billing history
 */
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/platform/supabase/client';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';

interface BillingRecord {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface BillingHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'ru': return ru;
    case 'kk': return kk;
    default: return enUS;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-amber-500" />;
  }
};

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'default';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getTypeLabel = (type: string, t: (key: string, fallback: string) => string): string => {
  switch (type) {
    case 'subscription':
      return t('billing.types.subscription', 'Subscription');
    case 'zone_upgrade':
      return t('billing.types.zoneUpgrade', 'Zone Upgrade');
    case 'payment':
      return t('billing.types.payment', 'Payment');
    case 'refund':
      return t('billing.types.refund', 'Refund');
    default:
      return type;
  }
};

export const BillingHistorySheet = memo(function BillingHistorySheet({
  open,
  onOpenChange,
}: BillingHistorySheetProps) {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    const fetchBillingHistory = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('billing_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setRecords((data as BillingRecord[]) || []);
      } catch (error) {
        console.error('Failed to fetch billing history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, [open]);

  const locale = getLocale(i18n.language);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('billing.history.title', 'Billing History')}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('billing.history.empty', 'No billing history')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                {t('billing.history.emptyDesc', 'Your payment history will appear here after your first purchase')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(record.status)}
                        <span className="font-medium truncate">
                          {getTypeLabel(record.type, t)}
                        </span>
                      </div>
                      {record.description && (
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(record.created_at), 'd MMM yyyy, HH:mm', { locale })}
                        </span>
                        <Badge variant={getStatusVariant(record.status)} className="text-[10px]">
                          {t(`billing.status.${record.status}`, record.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-lg">
                        {record.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        {record.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
