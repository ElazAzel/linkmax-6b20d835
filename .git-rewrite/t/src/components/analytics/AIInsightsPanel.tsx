/**
 * AIInsightsPanel - Analytics with AI-powered insights
 * "Observation + Apply" pattern where applying an insight performs an editor action
 */
import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Eye,
  MousePointer,
  Share2,
  RefreshCw,
  Loader2,
  Wand2,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import type { AnalyticsSummary } from '@/hooks/usePageAnalytics';

interface AIInsight {
  id: string;
  type: 'add' | 'remove' | 'improve' | 'reorder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: {
    type: 'add_block' | 'remove_block' | 'edit_block' | 'reorder_blocks';
    blockType?: string;
    blockId?: string;
    suggestion?: string;
  };
  applied?: boolean;
}

interface AIInsightsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: AnalyticsSummary | null;
  onApplyInsight: (insight: AIInsight) => void;
  onUndoInsight: (insight: AIInsight) => void;
}

export const AIInsightsPanel = memo(function AIInsightsPanel({
  open,
  onOpenChange,
  analytics,
  onApplyInsight,
  onUndoInsight,
}: AIInsightsPanelProps) {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedInsights, setAppliedInsights] = useState<Set<string>>(new Set());

  // Generate AI insights based on analytics
  const generateInsights = useCallback(async () => {
    if (!analytics) return;
    
    setLoading(true);
    try {
      // In production, this would call an AI endpoint
      // For now, generate rule-based insights
      const newInsights: AIInsight[] = [];

      // Low views insight
      if (analytics.totalViews < 50) {
        newInsights.push({
          id: 'low-views-1',
          type: 'add',
          priority: 'high',
          title: t('insights.lowViews.title', 'Добавьте соцсети'),
          description: t('insights.lowViews.description', 'Страницы с соцсетями получают на 40% больше переходов'),
          impact: '+40% трафика',
          action: {
            type: 'add_block',
            blockType: 'socials',
          },
        });
      }

      // Low CTR insight
      const avgCTR = analytics.topBlocks.length > 0 
        ? analytics.topBlocks.reduce((sum, b) => sum + b.ctr, 0) / analytics.topBlocks.length 
        : 0;
      
      if (avgCTR < 5) {
        newInsights.push({
          id: 'low-ctr-1',
          type: 'add',
          priority: 'high',
          title: t('insights.lowCTR.title', 'Добавьте CTA-кнопку'),
          description: t('insights.lowCTR.description', 'Яркая кнопка с призывом к действию увеличит конверсию'),
          impact: '+25% кликов',
          action: {
            type: 'add_block',
            blockType: 'button',
            suggestion: 'Связаться со мной',
          },
        });
      }

      // No products insight
      if (!analytics.topBlocks.some(b => b.blockType === 'product')) {
        newInsights.push({
          id: 'no-products-1',
          type: 'add',
          priority: 'medium',
          title: t('insights.noProducts.title', 'Добавьте товар или услугу'),
          description: t('insights.noProducts.description', 'Страницы с товарами монетизируются лучше'),
          impact: 'Монетизация',
          action: {
            type: 'add_block',
            blockType: 'product',
          },
        });
      }

      // Low performing blocks
      const lowPerformingBlock = analytics.topBlocks.find(b => b.ctr < 1 && b.clicks < 5);
      if (lowPerformingBlock) {
        newInsights.push({
          id: `remove-${lowPerformingBlock.blockId}`,
          type: 'remove',
          priority: 'low',
          title: t('insights.lowPerforming.title', 'Неэффективный блок'),
          description: t('insights.lowPerforming.description', `"${lowPerformingBlock.blockTitle}" получает мало кликов`),
          impact: 'Чистота страницы',
          action: {
            type: 'remove_block',
            blockId: lowPerformingBlock.blockId,
          },
        });
      }

      // Mobile optimization
      if (analytics.deviceBreakdown.mobile > analytics.deviceBreakdown.desktop * 2) {
        newInsights.push({
          id: 'mobile-opt-1',
          type: 'improve',
          priority: 'medium',
          title: t('insights.mobileOpt.title', 'Оптимизируйте для мобильных'),
          description: t('insights.mobileOpt.description', '80%+ вашей аудитории используют телефоны'),
          impact: 'UX улучшение',
          action: {
            type: 'edit_block',
            suggestion: 'Увеличить размер кнопок и текста',
          },
        });
      }

      setInsights(newInsights);
      
      if (newInsights.length === 0) {
        toast.success(t('insights.noInsights', 'Ваша страница отлично оптимизирована!'));
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error(t('insights.error', 'Ошибка анализа'));
    } finally {
      setLoading(false);
    }
  }, [analytics, t]);

  const handleApply = (insight: AIInsight) => {
    onApplyInsight(insight);
    setAppliedInsights(prev => new Set(prev).add(insight.id));
    
    toast.success(t('insights.applied', 'Инсайт применён'), {
      description: insight.title,
      action: {
        label: t('common.undo', 'Отменить'),
        onClick: () => handleUndo(insight),
      },
    });
  };

  const handleUndo = (insight: AIInsight) => {
    onUndoInsight(insight);
    setAppliedInsights(prev => {
      const next = new Set(prev);
      next.delete(insight.id);
      return next;
    });
    toast.success(t('insights.undone', 'Действие отменено'));
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const typeIcons = {
    add: Plus,
    remove: Trash2,
    improve: Edit2,
    reorder: RefreshCw,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl [&>button]:hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/25" />
        </div>

        <SheetHeader className="px-6 pb-4 border-b border-border/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black">
                  {t('insights.title', 'AI Инсайты')}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {t('insights.description', 'Рекомендации для улучшения')}
                </SheetDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateInsights}
              disabled={loading || !analytics}
              className="h-10 rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t('insights.analyze', 'Анализ')}
            </Button>
          </div>
        </SheetHeader>

        {/* Analytics Summary */}
        {analytics && (
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-border/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-black">
                <Eye className="h-5 w-5 text-muted-foreground" />
                {analytics.totalViews}
              </div>
              <div className="text-xs text-muted-foreground">{t('analytics.views', 'Просмотры')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-black">
                <MousePointer className="h-5 w-5 text-muted-foreground" />
                {analytics.totalClicks}
              </div>
              <div className="text-xs text-muted-foreground">{t('analytics.clicks', 'Клики')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-black">
                <Share2 className="h-5 w-5 text-muted-foreground" />
                {analytics.totalShares}
              </div>
              <div className="text-xs text-muted-foreground">{t('analytics.shares', 'Репосты')}</div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 h-[calc(80vh-220px)]">
          <div className="p-5 space-y-4">
            {loading ? (
              // Loading skeletons
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-4 rounded-2xl border border-border/10">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : insights.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  {t('insights.empty', 'Нажмите "Анализ" для получения рекомендаций')}
                </p>
                <Button onClick={generateInsights} disabled={!analytics} className="rounded-xl">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('insights.analyze', 'Анализировать')}
                </Button>
              </div>
            ) : (
              insights.map((insight) => {
                const TypeIcon = typeIcons[insight.type];
                const isApplied = appliedInsights.has(insight.id);

                return (
                  <Card 
                    key={insight.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      isApplied 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "border-border/10 hover:border-border/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                        priorityColors[insight.priority]
                      )}>
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold truncate">{insight.title}</h4>
                          <Badge variant="outline" className={cn("shrink-0 text-[10px]", priorityColors[insight.priority])}>
                            {insight.priority === 'high' ? t('insights.priority.high', 'Важно') : 
                             insight.priority === 'medium' ? t('insights.priority.medium', 'Средне') : 
                             t('insights.priority.low', 'Низко')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">{insight.impact}</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <Button
                        size="sm"
                        variant={isApplied ? "outline" : "default"}
                        onClick={() => isApplied ? handleUndo(insight) : handleApply(insight)}
                        className={cn(
                          "h-10 rounded-xl shrink-0",
                          isApplied && "text-emerald-500 border-emerald-500/30"
                        )}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            {t('insights.applied', 'Применено')}
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-1" />
                            {t('insights.apply', 'Применить')}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
