import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/format';

interface TimelineRow {
  kind: string;
  title: string | null;
  amount: number | null;
  currency: string | null;
  happened_at: string;
}

export function ContactTimeline({ contactId }: { contactId: string | null | undefined }) {
  const { t } = useTranslation();
  const { data = [] } = useQuery({
    queryKey: ['contact-timeline', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contact_timeline', { p_contact_id: contactId as string });
      if (error) return [];
      return (data ?? []) as TimelineRow[];
    },
  });

  if (!contactId || data.length === 0) return null;
  const revenue = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <Card className="p-3 sm:p-4 border-0 shadow-none bg-muted/40">
      <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-3 flex items-center gap-2">
        <History className="h-4 w-4" />
        {t('crm.timeline.title', 'История клиента')}
      </h4>
      <ul className="space-y-2">
        {data.map((r, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium">{t(`crm.timeline.kind.${r.kind}`, r.kind)}</div>
              {r.title && <div className="text-xs text-muted-foreground truncate">{r.title}</div>}
            </div>
            <div className="text-right shrink-0">
              {r.amount ? <div className="text-xs font-semibold">{r.amount} {r.currency ?? ''}</div> : null}
              <div className="text-xs text-muted-foreground">{formatDateTime(r.happened_at)}</div>
            </div>
          </li>
        ))}
      </ul>
      {revenue > 0 && (
        <div className="mt-3 text-sm font-semibold">
          {t('crm.timeline.revenue', 'Выручка')}: {revenue}
        </div>
      )}
    </Card>
  );
}
