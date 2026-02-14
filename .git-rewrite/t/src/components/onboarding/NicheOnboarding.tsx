import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  Scissors, 
  Camera, 
  Brain, 
  Dumbbell, 
  Music, 
  Palette, 
  GraduationCap,
  Store,
  Megaphone,
  Heart,
  ChefHat,
  Plane,
  Home,
  PartyPopper,
  Wrench,
  MoreHorizontal,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Laptop,
  Crown,
  Lock,
  MousePointerClick,
  MessageSquare,
  CalendarCheck
} from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { Block } from '@/types/page';
import { NICHES, type Niche } from '@/lib/niches';

interface NicheOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
}

// Map niches to icons
const NICHE_ICON_MAP: Record<Niche, React.ComponentType<{ className?: string }>> = {
  beauty: Heart,
  fitness: Dumbbell,
  food: ChefHat,
  education: GraduationCap,
  art: Palette,
  music: Music,
  tech: Laptop,
  business: Store,
  health: Brain,
  fashion: Heart,
  travel: Plane,
  realestate: Home,
  events: PartyPopper,
  services: Wrench,
  other: MoreHorizontal,
};

// Gradient colors for each niche
const NICHE_COLORS: Record<Niche, string> = {
  beauty: 'from-pink-500 to-rose-600',
  fitness: 'from-green-500 to-emerald-600',
  food: 'from-amber-600 to-yellow-500',
  education: 'from-yellow-500 to-amber-600',
  art: 'from-indigo-500 to-violet-600',
  music: 'from-red-500 to-rose-600',
  tech: 'from-blue-500 to-cyan-600',
  business: 'from-teal-500 to-green-600',
  health: 'from-purple-500 to-pink-600',
  fashion: 'from-pink-400 to-fuchsia-600',
  travel: 'from-sky-500 to-blue-600',
  realestate: 'from-orange-500 to-red-600',
  events: 'from-violet-500 to-purple-600',
  services: 'from-gray-500 to-slate-600',
  other: 'from-gray-400 to-gray-600',
};

export function NicheOnboarding({ isOpen, onClose, onComplete }: NicheOnboardingProps) {
  const { t } = useTranslation();
  const { canUseAIPageGeneration, getRemainingAIPageGenerations, incrementAIPageGeneration, isPremium, limits } = useFreemiumLimits();
  const [step, setStep] = useState<'goal' | 'niche' | 'details' | 'generating'>('goal');
  const [selectedGoal, setSelectedGoal] = useState<'clicks' | 'leads' | 'bookings' | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [generating, setGenerating] = useState(false);

  const canGenerate = canUseAIPageGeneration();
  const remainingGenerations = getRemainingAIPageGenerations();

  const handleSelectGoal = (goal: 'clicks' | 'leads' | 'bookings') => {
    setSelectedGoal(goal);
    localStorage.setItem('linkmax_primary_goal', goal);
    setStep('niche');
  };

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('niche');
      setSelectedNiche(null);
    } else if (step === 'niche') {
      setStep('goal');
    }
  };

  const handleGenerate = async () => {
    if (!selectedNiche || !name.trim() || !selectedGoal) {
      toast.error(t('onboarding.enterName'));
      return;
    }

    if (!canGenerate) {
      toast.error(t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан'));
      return;
    }

    setStep('generating');
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'niche-builder',
          input: {
            niche: selectedNiche,
            name: name.trim(),
            details: details.trim(),
            primaryGoal: selectedGoal,
          },
        },
      });

      if (error) throw error;

      const { profile, blocks } = data.result;
      
      // Transform blocks to proper Block format
      const formattedBlocks: Block[] = blocks.map((block: any, index: number) => ({
        id: `${block.type}-${Date.now()}-${index}`,
        ...block,
      }));

      // Increment usage counter
      incrementAIPageGeneration();

      toast.success(t('onboarding.pageGenerated'));
      onComplete(profile, formattedBlocks, selectedNiche);
      
      // Mark onboarding as completed
      localStorage.setItem('linkmax_niche_onboarding_completed', 'true');
      onClose();
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(t('onboarding.generationFailed'));
      setStep('details');
    } finally {
      setGenerating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('linkmax_niche_onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {step === 'goal' && (
          <>
            <DialogHeader className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                <DialogTitle className="text-xl sm:text-2xl">{t('onboarding.goalTitle')}</DialogTitle>
              </div>
              <DialogDescription className="text-sm sm:text-base">
                {t('onboarding.goalDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6">
              <Card
                onClick={() => handleSelectGoal('clicks')}
                className="p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                  <MousePointerClick className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-center">{t('onboarding.goalClicks')}</p>
              </Card>
              <Card
                onClick={() => handleSelectGoal('leads')}
                className="p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-center">{t('onboarding.goalLeads')}</p>
              </Card>
              <Card
                onClick={() => handleSelectGoal('bookings')}
                className="p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-center">{t('onboarding.goalBookings')}</p>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleSkip}>
                {t('onboarding.skip')}
              </Button>
            </div>
          </>
        )}

        {step === 'niche' && (
          <>
            <DialogHeader className="space-y-3 text-center">
              <div className="flex items-center gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  <DialogTitle className="text-xl sm:text-2xl">{t('onboarding.nicheTitle')}</DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-sm sm:text-base">
                {t('onboarding.nicheDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-6">
              {NICHES.map((niche) => {
                const Icon = NICHE_ICON_MAP[niche];
                const color = NICHE_COLORS[niche];
                return (
                  <Card
                    key={niche}
                    onClick={() => handleSelectNiche(niche)}
                    className="p-4 cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
                  >
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 mx-auto`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-center">{t(`niches.${niche}`, niche)}</p>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleSkip}>
                {t('onboarding.skip')}
              </Button>
            </div>
          </>
        )}

        {step === 'details' && selectedNiche && (
          <>
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg sm:text-xl">{t('onboarding.detailsTitle')}</DialogTitle>
              </div>
              <DialogDescription>
                {t('onboarding.detailsDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!canGenerate && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                    <Lock className="h-4 w-4" />
                    {t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан')}
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">
                    {isPremium 
                      ? t('freemium.aiLimitResetMonthlyPro', 'Лимит обновится в следующем месяце')
                      : t('freemium.upgradeForMoreGenerations', 'Обновите до Premium для 5 генераций в месяц')
                    }
                  </p>
                  {!isPremium && (
                    <Button size="sm" variant="outline" onClick={openPremiumPurchase} className="w-full">
                      <Crown className="h-3 w-3 mr-1.5 text-amber-500" />
                      {t('freemium.getPremium', 'Получить Premium')}
                    </Button>
                  )}
                </div>
              )}
              {canGenerate && !isPremium && (
                <div className="p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {t('freemium.aiGenerationsRemaining', 'Осталось генераций: {{count}}/{{total}}', { 
                    count: remainingGenerations, 
                    total: limits.maxAIPageGenerationsPerMonth 
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t('onboarding.yourName')} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.namePlaceholder')}
                  autoFocus
                  disabled={!canGenerate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">{t('onboarding.additionalDetails')}</Label>
                <Input
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('onboarding.detailsPlaceholder')}
                  disabled={!canGenerate}
                />
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.detailsHint')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleSkip}>
                {t('onboarding.skip')}
              </Button>
              <Button onClick={handleGenerate} disabled={!name.trim() || !canGenerate}>
                {t('onboarding.generatePage')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 'generating' && (
          <div className="py-16 text-center space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{t('onboarding.generatingTitle')}</h3>
              <p className="text-muted-foreground">{t('onboarding.generatingDescription')}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('onboarding.pleaseWait')}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
