/**
 * ChatbotInsights - Analytics for Expert Engine queries (Phase 26)
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import { isFeatureSchemaMissing, isMissingSchemaError, noteFeatureSchemaError } from '@/lib/resilience/missing-schema';
import { EXPERT_QUERIES_FEATURE } from '@/services/analytics';

interface ChatbotInsightsProps {
  pageId: string;
}

interface QueryStat {
  query_text: string;
  count: number;
  has_response: boolean;
}

export const ChatbotInsights = ({ pageId }: ChatbotInsightsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    answered: number;
    unanswered: number;
    popular: QueryStat[];
    missing: QueryStat[];
  }>({
    total: 0,
    answered: 0,
    unanswered: 0,
    popular: [],
    missing: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (isFeatureSchemaMissing(EXPERT_QUERIES_FEATURE)) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await (supabase.from('expert_queries' as any) as any)
          .select('query_text, has_response')
          .eq('page_id', pageId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const queries = data as any[];
        const total = queries.length;
        if (total === 0) {
          setStats({ total: 0, answered: 0, unanswered: 0, popular: [], missing: [] });
          return;
        }

        const answered = queries.filter(q => q.has_response).length;
        const unanswered = total - answered;

        // Group by query text
        const counts: Record<string, { count: number; has_response: boolean }> = {};
        queries.forEach(q => {
          const text = q.query_text.toLowerCase().trim();
          if (!counts[text]) {
            counts[text] = { count: 0, has_response: q.has_response };
          }
          counts[text].count++;
        });

        const sorted = Object.entries(counts)
          .map(([text, data]) => ({ query_text: text, ...data }))
          .sort((a, b) => b.count - a.count);

        setStats({
          total,
          answered,
          unanswered,
          popular: sorted.slice(0, 5),
          missing: sorted.filter(s => !s.has_response).slice(0, 5),
        });
      } catch (err: any) {
        // Suppress expected 404 related errors for this beta feature which may not have the backend yet
        noteFeatureSchemaError(EXPERT_QUERIES_FEATURE, err);
        if (!isMissingSchemaError(err)) {
          console.error('Failed to fetch chatbot insights:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [pageId]);

  if (loading) return null;
  if (stats.total === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <div className="h-8 w-8 rounded-xl bg-primary/12 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.06em] opacity-60">
          {t('analytics.chatbot.title', 'Инсайты Ассистента')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Answer Rate Card */}
        <Card className="p-6 bg-card border border-border shadow-sm rounded-card relative overflow-hidden h-full">
             <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-40 mb-1">
                    {t('analytics.chatbot.answerRate', 'Успешные ответы')}
                  </p>
                  <p className="text-3xl font-bold font-num">{Math.round((stats.answered / stats.total) * 100)}%</p>
               </div>
               <div className="h-12 w-12 rounded-2xl bg-success/12 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
               </div>
             </div>
             <Progress value={(stats.answered / stats.total) * 100} className="h-2 bg-muted" />
             <p className="mt-4 text-xs text-muted-foreground">
               {t('analytics.chatbot.statsDesc', '{{count}} из {{total}} вопросов получили ответ', { count: stats.answered, total: stats.total })}
             </p>
        </Card>

        {/* Missing Info Card */}
        {stats.unanswered > 0 && (
          <Card className="p-6 bg-card border border-border shadow-sm rounded-card border-warning/20 bg-warning/12 h-full">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-warning/12 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div>
                   <p className="text-sm font-bold">{t('analytics.chatbot.gaps', 'Пробелы в контенте')}</p>
                   <p className="text-xs text-muted-foreground">
                     {t('analytics.chatbot.gapsDesc', 'Посетители не нашли ответы')}
                   </p>
                </div>
             </div>
             <div className="space-y-2">
                {stats.missing.map((q, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-muted border border-border">
                    <span className="truncate flex-1 pr-4">"{q.query_text}"</span>
                    <span className="font-bold opacity-40">{q.count}x</span>
                  </div>
                ))}
             </div>
          </Card>
        )}
      </div>

      {/* Popular Questions List */}
      <Card className="bg-card border border-border shadow-sm rounded-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
           <h3 className="text-xs font-bold uppercase tracking-[0.06em] opacity-60">
             {t('analytics.chatbot.popular', 'Популярные вопросы')}
           </h3>
           <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="divide-y divide-border">
           {stats.popular.map((q, i) => (
             <div key={i} className="p-4 flex items-center gap-4 hover:bg-muted transition-colors group">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold opacity-30 text-primary">
                  #{i+1}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium truncate">"{q.query_text}"</p>
                   <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[11px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter",
                        q.has_response ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
                      )}>
                        {q.has_response ? t('common.answered', 'Отвечено') : t('common.missed', 'Пропущено')}
                      </span>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold font-num">{q.count}</p>
                   <p className="text-[11px] opacity-40 uppercase font-bold">{t('common.times', 'раз')}</p>
                </div>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
};
