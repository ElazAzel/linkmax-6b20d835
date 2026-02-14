import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bot, ChevronDown, Clock, MessageSquare, Star, Bell, Loader2, Save, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Automation {
  id?: string;
  user_id: string;
  automation_type: 'follow_up' | 'time_clarification' | 'review_request';
  is_enabled: boolean;
  trigger_hours: number;
  template_message: string;
}

interface AutomationsPanelProps {
  userId: string;
  isPremium: boolean;
}

const DEFAULT_TEMPLATES = {
  follow_up: {
    ru: 'Здравствуйте, {lead_name}! Это {owner_name}. Хотела уточнить — вы всё ещё рассматриваете запись? Буду рада помочь!',
    en: 'Hi {lead_name}! This is {owner_name}. Just checking in — are you still interested in booking? Happy to help!',
    kk: 'Сәлеметсіз бе, {lead_name}! Бұл {owner_name}. Сіз әлі де жазылуды қарастырасыз ба? Көмектесуге қуаныштымын!'
  },
  time_clarification: {
    ru: 'Здравствуйте, {lead_name}! Подскажите удобное время для записи? У меня есть свободные окна на этой неделе.',
    en: 'Hi {lead_name}! What time works best for you? I have some openings this week.',
    kk: 'Сәлеметсіз бе, {lead_name}! Сізге қай уақыт ыңғайлы? Осы аптада бос орындар бар.'
  },
  review_request: {
    ru: 'Здравствуйте, {lead_name}! Спасибо, что были у меня! Буду благодарна за короткий отзыв — это очень помогает! ⭐',
    en: 'Hi {lead_name}! Thanks for visiting! A quick review would mean a lot to me! ⭐',
    kk: 'Сәлеметсіз бе, {lead_name}! Маған келгеніңізге рахмет! Қысқа пікір қалдырсаңыз өте ризамын! ⭐'
  }
};

export function AutomationsPanel({ userId, isPremium }: AutomationsPanelProps) {
  const { t, i18n } = useTranslation();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const lang = i18n.language as 'ru' | 'en' | 'kk';

  useEffect(() => {
    loadAutomations();
  }, [userId]);

  const loadAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_automations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Initialize with defaults if not exists
      const types: Automation['automation_type'][] = ['follow_up', 'time_clarification', 'review_request'];
      const existingTypes = new Set((data || []).map(a => a.automation_type));
      
      const allAutomations: Automation[] = (data || []).map(a => ({
        id: a.id,
        user_id: a.user_id,
        automation_type: a.automation_type as Automation['automation_type'],
        is_enabled: a.is_enabled,
        trigger_hours: a.trigger_hours,
        template_message: a.template_message
      }));
      
      for (const type of types) {
        if (!existingTypes.has(type)) {
          allAutomations.push({
            user_id: userId,
            automation_type: type,
            is_enabled: false,
            trigger_hours: type === 'follow_up' ? 24 : type === 'time_clarification' ? 12 : 48,
            template_message: DEFAULT_TEMPLATES[type][lang] || DEFAULT_TEMPLATES[type].ru
          });
        }
      }

      setAutomations(allAutomations);
    } catch (error) {
      console.error('Error loading automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAutomation = async (automation: Automation) => {
    setSaving(automation.automation_type);
    try {
      if (automation.id) {
        const { error } = await supabase
          .from('crm_automations')
          .update({
            is_enabled: automation.is_enabled,
            trigger_hours: automation.trigger_hours,
            template_message: automation.template_message
          })
          .eq('id', automation.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('crm_automations')
          .insert({
            user_id: userId,
            automation_type: automation.automation_type,
            is_enabled: automation.is_enabled,
            trigger_hours: automation.trigger_hours,
            template_message: automation.template_message
          })
          .select()
          .single();

        if (error) throw error;

        setAutomations(prev => prev.map(a => 
          a.automation_type === automation.automation_type ? { ...a, id: data.id } : a
        ));
      }

      toast.success(t('automations.saved', 'Automation saved'));
    } catch (error) {
      console.error('Error saving automation:', error);
      toast.error(t('automations.saveError', 'Failed to save automation'));
    } finally {
      setSaving(null);
    }
  };

  const updateAutomation = (type: string, updates: Partial<Automation>) => {
    setAutomations(prev => prev.map(a => 
      a.automation_type === type ? { ...a, ...updates } : a
    ));
  };

  const getAutomationConfig = (type: Automation['automation_type']) => {
    switch (type) {
      case 'follow_up':
        return {
          icon: Bell,
          title: t('automations.followUp.title', 'Follow-up Reminder'),
          description: t('automations.followUp.description', 'Send reminder if lead is inactive'),
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        };
      case 'time_clarification':
        return {
          icon: Clock,
          title: t('automations.timeClarification.title', 'Time Clarification'),
          description: t('automations.timeClarification.description', 'Ask to choose a time slot'),
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10'
        };
      case 'review_request':
        return {
          icon: Star,
          title: t('automations.reviewRequest.title', 'Review Request'),
          description: t('automations.reviewRequest.description', 'Ask for feedback after completion'),
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        };
    }
  };

  if (!isPremium) {
    return (
      <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">{t('automations.title', 'Smart Automations')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {t('automations.premiumRequired', 'Upgrade to Pro to use smart automations')}
        </p>
        <Button variant="outline" size="sm" className="w-full" disabled>
          {t('automations.unlockPremium', 'Available in Pro')}
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{t('automations.title', 'Smart Automations')}</h3>
          <p className="text-xs text-muted-foreground">{t('automations.subtitle', 'Auto-reminders via Telegram')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {automations.map((automation) => {
          const config = getAutomationConfig(automation.automation_type);
          const Icon = config.icon;
          const isExpanded = expandedType === automation.automation_type;

          return (
            <Collapsible 
              key={automation.automation_type}
              open={isExpanded}
              onOpenChange={(open) => setExpandedType(open ? automation.automation_type : null)}
            >
              <div className="rounded-xl bg-background/30 border border-border/20 overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{config.title}</Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.is_enabled}
                        onCheckedChange={(enabled) => {
                          updateAutomation(automation.automation_type, { is_enabled: enabled });
                          saveAutomation({ ...automation, is_enabled: enabled });
                        }}
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-3 border-t border-border/20 pt-3">
                    {/* Trigger time */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t('automations.triggerAfter', 'Trigger after')}
                      </Label>
                      <Select
                        value={String(automation.trigger_hours)}
                        onValueChange={(val) => updateAutomation(automation.automation_type, { trigger_hours: parseInt(val) })}
                      >
                        <SelectTrigger className="bg-background/50 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 {t('automations.hours', 'hours')}</SelectItem>
                          <SelectItem value="12">12 {t('automations.hours', 'hours')}</SelectItem>
                          <SelectItem value="24">24 {t('automations.hours', 'hours')}</SelectItem>
                          <SelectItem value="48">48 {t('automations.hours', 'hours')}</SelectItem>
                          <SelectItem value="72">72 {t('automations.hours', 'hours')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t('automations.messageTemplate', 'Message template')}
                      </Label>
                      <Textarea
                        value={automation.template_message}
                        onChange={(e) => updateAutomation(automation.automation_type, { template_message: e.target.value })}
                        className="mt-1 bg-background/50 text-sm"
                        rows={3}
                      />
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {t('automations.variables', 'Use {lead_name}, {owner_name} for personalization')}
                        </p>
                      </div>
                    </div>

                    {/* Save button */}
                    <Button
                      size="sm"
                      onClick={() => saveAutomation(automation)}
                      disabled={saving === automation.automation_type}
                      className="w-full"
                    >
                      {saving === automation.automation_type ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {t('automations.saveSettings', 'Save settings')}
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      <div className="mt-3 p-2 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          {t('automations.telegramNote', 'Reminders are sent to your Telegram')}
        </p>
      </div>
    </Card>
  );
}
