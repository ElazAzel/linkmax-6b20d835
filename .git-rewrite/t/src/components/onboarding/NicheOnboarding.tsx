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
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Block } from '@/types/page';

interface NicheOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: { name: string; bio: string }, blocks: Block[]) => void;
}

const NICHES = [
  { id: 'barber', icon: Scissors, label: 'niche.barber', color: 'from-amber-500 to-orange-600' },
  { id: 'photographer', icon: Camera, label: 'niche.photographer', color: 'from-purple-500 to-pink-600' },
  { id: 'psychologist', icon: Brain, label: 'niche.psychologist', color: 'from-blue-500 to-cyan-600' },
  { id: 'fitness', icon: Dumbbell, label: 'niche.fitness', color: 'from-green-500 to-emerald-600' },
  { id: 'musician', icon: Music, label: 'niche.musician', color: 'from-red-500 to-rose-600' },
  { id: 'designer', icon: Palette, label: 'niche.designer', color: 'from-indigo-500 to-violet-600' },
  { id: 'teacher', icon: GraduationCap, label: 'niche.teacher', color: 'from-yellow-500 to-amber-600' },
  { id: 'shop', icon: Store, label: 'niche.shop', color: 'from-teal-500 to-green-600' },
  { id: 'marketer', icon: Megaphone, label: 'niche.marketer', color: 'from-orange-500 to-red-600' },
  { id: 'beauty', icon: Heart, label: 'niche.beauty', color: 'from-pink-500 to-rose-600' },
  { id: 'chef', icon: ChefHat, label: 'niche.chef', color: 'from-amber-600 to-yellow-500' },
];

export function NicheOnboarding({ isOpen, onClose, onComplete }: NicheOnboardingProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'niche' | 'details' | 'generating'>('niche');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleSelectNiche = (nicheId: string) => {
    setSelectedNiche(nicheId);
    setStep('details');
  };

  const handleBack = () => {
    setStep('niche');
    setSelectedNiche(null);
  };

  const handleGenerate = async () => {
    if (!selectedNiche || !name.trim()) {
      toast.error(t('onboarding.enterName'));
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

      toast.success(t('onboarding.pageGenerated'));
      onComplete(profile, formattedBlocks);
      
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
        {step === 'niche' && (
          <>
            <DialogHeader className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                <DialogTitle className="text-xl sm:text-2xl">{t('onboarding.nicheTitle')}</DialogTitle>
              </div>
              <DialogDescription className="text-sm sm:text-base">
                {t('onboarding.nicheDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-6">
              {NICHES.map((niche) => (
                <Card
                  key={niche.id}
                  onClick={() => handleSelectNiche(niche.id)}
                  className="p-4 cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${niche.color} flex items-center justify-center mb-3 mx-auto`}>
                    <niche.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-center">{t(niche.label)}</p>
                </Card>
              ))}
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
              <div className="space-y-2">
                <Label htmlFor="name">{t('onboarding.yourName')} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.namePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">{t('onboarding.additionalDetails')}</Label>
                <Input
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('onboarding.detailsPlaceholder')}
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
              <Button onClick={handleGenerate} disabled={!name.trim()}>
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
