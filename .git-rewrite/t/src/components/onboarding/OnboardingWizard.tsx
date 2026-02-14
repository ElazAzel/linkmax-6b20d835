/**
 * OnboardingWizard - 3-step wizard after signup
 * 1. Template selection by niche
 * 2. Short description input
 * 3. AI page generation (Aha-moment)
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Check,
  Wand2,
  Layout,
  User,
  Scissors, 
  Camera, 
  Brain, 
  Dumbbell, 
  Music, 
  Palette, 
  GraduationCap,
  Store,
  Heart,
  ChefHat,
  Plane,
  Home,
  PartyPopper,
  Wrench,
  MoreHorizontal,
  Laptop,
} from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Block } from '@/types/page';
import { NICHES, type Niche } from '@/lib/niches';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: {
    profile: { name: string; bio: string };
    blocks: Block[];
    niche: Niche;
  }) => void;
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
  beauty: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  fitness: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  food: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  education: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  art: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
  music: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  tech: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  business: 'from-teal-500/20 to-green-500/20 border-teal-500/30',
  health: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  fashion: 'from-pink-400/20 to-fuchsia-500/20 border-pink-400/30',
  travel: 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
  realestate: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  events: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
  services: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
  other: 'from-gray-400/20 to-gray-500/20 border-gray-400/30',
};

type Step = 'niche' | 'details' | 'generating' | 'complete';

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('niche');
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);

  const progress = step === 'niche' ? 33 : step === 'details' ? 66 : 100;

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('niche');
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche || !name.trim()) {
      toast.error(t('onboarding.enterName', 'Введите ваше имя'));
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
            details: description.trim(),
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

      setStep('complete');
      
      // Brief delay for animation
      setTimeout(() => {
        toast.success(t('onboarding.pageGenerated', 'Страница создана!'));
        onComplete({ profile, blocks: formattedBlocks, niche: selectedNiche });
        localStorage.setItem('linkmax_onboarding_completed', 'true');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(t('onboarding.generationFailed', 'Ошибка генерации'));
      setStep('details');
    } finally {
      setGenerating(false);
    }
  }, [selectedNiche, name, description, t, onComplete, onClose]);

  const handleSkip = () => {
    localStorage.setItem('linkmax_onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-[32px] border-0 bg-card/98 backdrop-blur-3xl">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5 rounded-full" />
        </div>

        {/* Step 1: Niche Selection */}
        {step === 'niche' && (
          <div className="p-6 pt-8 animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-primary/10 mb-4">
                <Layout className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black mb-2">
                {t('onboarding.nicheTitle', 'Выберите нишу')}
              </h2>
              <p className="text-muted-foreground">
                {t('onboarding.nicheDescription', 'AI создаст страницу специально для вас')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[45vh] overflow-y-auto pb-4">
              {NICHES.map((niche) => {
                const Icon = NICHE_ICON_MAP[niche];
                const isSelected = selectedNiche === niche;
                return (
                  <button
                    key={niche}
                    onClick={() => handleSelectNiche(niche)}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all duration-300",
                      `bg-gradient-to-br ${NICHE_COLORS[niche]}`,
                      "hover:scale-[1.02] active:scale-[0.98]",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-background/60 backdrop-blur flex items-center justify-center mb-3 mx-auto">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-sm text-center">
                      {t(`niches.${niche}`, niche)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-center">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                {t('onboarding.skip', 'Пропустить')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details Input */}
        {step === 'details' && selectedNiche && (
          <div className="p-6 pt-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-12 w-12 rounded-2xl shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-black">
                  {t('onboarding.detailsTitle', 'Расскажите о себе')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('onboarding.detailsDescription', 'AI персонализирует страницу под вас')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('onboarding.yourName', 'Ваше имя')} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.namePlaceholder', 'Как вас зовут?')}
                  className="h-14 rounded-2xl text-lg px-5"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('onboarding.additionalDetails', 'Описание (опционально)')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('onboarding.detailsPlaceholder', 'Например: фотограф из Алматы, специализируюсь на свадьбах')}
                  className="min-h-[120px] rounded-2xl text-base p-5 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.detailsHint', 'Чем подробнее описание, тем лучше результат')}
                </p>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="flex-1 h-14 rounded-2xl text-base font-bold"
              >
                {t('onboarding.skip', 'Пропустить')}
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={!name.trim()}
                className="flex-[2] h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                {t('onboarding.generatePage', 'Создать страницу')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="p-6 py-20 text-center animate-fade-in">
            <div className="relative mx-auto w-28 h-28 mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-violet-500 to-pink-500 animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <Wand2 className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-3">
              {t('onboarding.generatingTitle', 'AI создаёт вашу страницу')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('onboarding.generatingDescription', 'Подбираем контент и стиль специально для вас')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('onboarding.pleaseWait', 'Пожалуйста, подождите...')}
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="p-6 py-20 text-center animate-scale-in">
            <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8">
              <Check className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-3">
              {t('onboarding.completeTitle', 'Готово!')}
            </h3>
            <p className="text-muted-foreground">
              {t('onboarding.completeDescription', 'Ваша страница создана и готова к редактированию')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
