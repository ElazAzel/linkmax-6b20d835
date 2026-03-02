/**
 * AIBuilderWizard — 5-step stepper wizard
 * Step 1: User info (name, bio, contacts, services, socials, media links)
 * Step 2: Niche selection (from templates DB categories)
 * Step 3: Template carousel (admin templates from DB)
 * Step 4: AI generating (fills template with personalized content)
 * Step 5: Complete
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import User from 'lucide-react/dist/esm/icons/user';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { createBlock as createBaseBlock } from '@/lib/blocks/block-factory';
import { generateBlocksFromTemplate } from '@/lib/blocks/internal-builder';
import type { Block } from '@/types/page';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import { useFreemiumLimits } from '@/hooks/user/useFreemiumLimits';
import { storage } from '@/lib/storage';

interface AIBuilderWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called with generated blocks (to be APPENDED to existing) and optional profile */
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
  /** If true, this is first-time onboarding popup */
  isOnboarding?: boolean;
}

interface DBTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  blocks: any;
  preview_image: string | null;
  is_premium: boolean | null;
}

interface UserInfo {
  name: string;
  bio: string;
  contacts: string;
  services: string;
  socials: string;
  mediaLinks: string;
}

type Step = 'niche' | 'template' | 'dynamic_form' | 'generating' | 'complete';

const STEPS: Step[] = ['niche', 'template', 'dynamic_form', 'generating', 'complete'];

function getStepProgress(step: Step): number {
  const idx = STEPS.indexOf(step);
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

export function AIBuilderWizard({ open, onClose, onComplete, isOnboarding = false }: AIBuilderWizardProps) {
  const { t } = useTranslation();
  const { canUseAIPageGeneration, incrementAIPageGeneration } = useFreemiumLimits();

  const [step, setStep] = useState<Step>('niche');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    bio: '',
    contacts: '',
    services: '',
    socials: '',
    mediaLinks: '',
  });
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DBTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('niche');
      setSelectedNiche(null);
      setSelectedTemplate(null);
      setTemplates([]);
      setCarouselIndex(0);
    }
  }, [open]);

  // Determine which fields to ask based on template blocks
  const formFields = useMemo(() => {
    let needsServices = false;
    let needsContacts = false;
    let needsSocials = false;
    let needsMedia = false;

    if (selectedTemplate && Array.isArray(selectedTemplate.blocks)) {
      for (const b of selectedTemplate.blocks) {
        if (b.type === 'catalog' || b.type === 'pricing') needsServices = true;
        if (b.type === 'messenger' || b.type === 'form') needsContacts = true;
        if (b.type === 'socials') needsSocials = true;
        if (b.type === 'video' || b.type === 'link') needsMedia = true;
      }
    }
    return { needsServices, needsContacts, needsSocials, needsMedia };
  }, [selectedTemplate]);

  // Filtered templates for selected niche
  const nicheTemplates = useMemo(() => {
    if (!selectedNiche) return [];
    return templates.filter(t => t.category === selectedNiche);
  }, [templates, selectedNiche]);

  // Load templates from DB when niche is selected
  const loadTemplates = useCallback(async (niche: Niche) => {
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, category, blocks, preview_image, is_premium')
        .eq('category', niche)
        .eq('is_public', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);

      // Auto-select if only one template
      if (data && data.length === 1) {
        setSelectedTemplate(data[0]);
      } else {
        setSelectedTemplate(null);
      }
      setCarouselIndex(0);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Step handlers
  const handleSelectNiche = async (niche: Niche) => {
    setSelectedNiche(niche);
    await loadTemplates(niche);
    setStep('template');
  };

  const handleSelectTemplateContinue = () => {
    if (!selectedTemplate) return;
    setStep('dynamic_form');
  };

  const handleBackToNiche = () => {
    setStep('niche');
    setSelectedNiche(null);
    setSelectedTemplate(null);
  };

  const handleBackToTemplate = () => {
    setStep('template');
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche || !selectedTemplate) {
      toast.error(t('aiBuilder.selectTemplate', 'Выберите шаблон'));
      return;
    }

    if (!canUseAIPageGeneration()) {
      toast.error(t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан'));
      return;
    }

    setStep('generating');

    try {
      // Build user description for AI
      const userDescription = [
        `Имя/Название: ${userInfo.name}`,
        userInfo.bio && `О себе: ${userInfo.bio}`,
        userInfo.services && `Услуги/Товары: ${userInfo.services}`,
        userInfo.contacts && `Контакты: ${userInfo.contacts}`,
        userInfo.socials && `Соцсети: ${userInfo.socials}`,
        userInfo.mediaLinks && `Медиа: ${userInfo.mediaLinks}`,
      ].filter(Boolean).join('\n');

      // Generate structural layout and inject user data synchronously
      const finalBlocks: Block[] = generateBlocksFromTemplate(
        Array.isArray(selectedTemplate.blocks) ? selectedTemplate.blocks : [],
        userInfo
      );

      // Brief delay to simulate generation and keep UX smooth
      await new Promise(resolve => setTimeout(resolve, 1500));

      incrementAIPageGeneration();

      // Extract profile
      const profile = {
        name: userInfo.name,
        bio: userInfo.bio || `${userInfo.services || ''}`,
      };

      setStep('complete');

      // Brief delay for animation, then complete
      setTimeout(() => {
        onComplete(profile, finalBlocks, selectedNiche);
        // Mark as completed
        storage.set('ai_builder_used', 'true');
        storage.set('niche_onboarding_completed', 'true');
        storage.set('onboarding_completed', 'true');
        toast.success(t('aiBuilder.success', '✨ Страница создана!'));
        onClose();
      }, 1500);
    } catch (err) {
      console.error('AI Builder error:', err);
      toast.error(t('aiBuilder.error', 'Ошибка генерации. Попробуйте ещё раз.'));
      setStep('template');
    }
  }, [selectedNiche, selectedTemplate, userInfo, canUseAIPageGeneration, incrementAIPageGeneration, onComplete, onClose, t]);

  const handleSkip = () => {
    storage.set('niche_onboarding_completed', 'true');
    storage.set('onboarding_completed', 'true');
    onClose();
  };

  // Carousel navigation
  const carouselPrev = () => setCarouselIndex(i => Math.max(0, i - 1));
  const carouselNext = () => setCarouselIndex(i => Math.min(nicheTemplates.length - 1, i + 1));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-[24px] border-0 bg-card/98 backdrop-blur-3xl">
        <DialogTitle className="sr-only">{t('aiBuilder.title', 'AI Builder')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('aiBuilder.description', 'Create your page with AI')}
        </DialogDescription>

        {/* Progress */}
        <div className="px-6 pt-6">
          <Progress value={getStepProgress(step)} className="h-1.5 rounded-full" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{t('aiBuilder.step', 'Шаг')} {STEPS.indexOf(step) + 1}/{STEPS.length}</span>
          </div>
        </div>



        {/* Step 2: Niche Selection */}
        {step === 'niche' && (
          <div className="p-6 pt-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div>
                <h2 className="text-xl font-black">
                  {t('aiBuilder.nicheTitle', 'Выберите сферу')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('aiBuilder.nicheDesc', 'Подберём шаблон для вашей ниши')}
                </p>
              </div>
            </div>

            <ScrollArea className="max-h-[55vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => handleSelectNiche(niche)}
                    className={cn(
                      "p-4 rounded-2xl border-2 border-border transition-all duration-200",
                      "hover:scale-[1.02] hover:border-primary/50 hover:shadow-md",
                      "active:scale-[0.98]",
                      "flex flex-col items-center gap-2"
                    )}
                  >
                    <span className="text-2xl">{NICHE_ICONS[niche]}</span>
                    <p className="font-semibold text-sm text-center">
                      {t(`niches.${niche}`, niche)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {isOnboarding && (
              <div className="pt-2 flex justify-center">
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                  {t('common.skip', 'Пропустить')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Template Selection (Carousel) */}
        {step === 'template' && (
          <div className="p-6 pt-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBackToNiche} className="h-10 w-10 rounded-xl shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black">
                  {t('aiBuilder.templateTitle', 'Выберите шаблон')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('aiBuilder.templateDesc', 'AI заполнит шаблон вашим контентом')}
                </p>
              </div>
            </div>

            {loadingTemplates ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t('common.loading', 'Загрузка...')}</p>
              </div>
            ) : nicheTemplates.length === 0 ? (
              <div className="py-16 text-center">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-bold mb-2">
                  {t('aiBuilder.noTemplates', 'Шаблонов пока нет')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('aiBuilder.noTemplatesDesc', 'Для этой ниши ещё не добавлены шаблоны. Попробуйте другую нишу.')}
                </p>
                <Button variant="outline" onClick={handleBackToNiche}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('aiBuilder.changeNiche', 'Выбрать другую нишу')}
                </Button>
              </div>
            ) : (
              <>
                {/* Carousel */}
                <div className="relative">
                  {nicheTemplates.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={carouselPrev}
                        disabled={carouselIndex === 0}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur shadow-md"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={carouselNext}
                        disabled={carouselIndex >= nicheTemplates.length - 1}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur shadow-md"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}

                  <div className="overflow-hidden rounded-2xl">
                    <div
                      className="flex transition-transform duration-300"
                      style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                    >
                      {nicheTemplates.map((template) => (
                        <div key={template.id} className="w-full flex-shrink-0 px-1">
                          <Card
                            className={cn(
                              "p-5 cursor-pointer border-2 transition-all",
                              selectedTemplate?.id === template.id
                                ? "border-primary shadow-lg"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            {template.preview_image && (
                              <img
                                src={template.preview_image}
                                alt={template.name}
                                className="w-full h-40 object-cover rounded-xl mb-4"
                              />
                            )}
                            <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                            {template.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <LayoutTemplate className="h-3 w-3" />
                              {Array.isArray(template.blocks) ? template.blocks.length : 0} {t('aiBuilder.blocks', 'блоков')}
                            </div>
                            {selectedTemplate?.id === template.id && (
                              <div className="mt-3 flex items-center gap-1 text-primary text-sm font-medium">
                                <Check className="h-4 w-4" />
                                {t('aiBuilder.selected', 'Выбрано')}
                              </div>
                            )}
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dots */}
                  {nicheTemplates.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-4">
                      {nicheTemplates.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            idx === carouselIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 flex gap-3">
                  <Button
                    onClick={handleSelectTemplateContinue}
                    disabled={!selectedTemplate}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    {t('common.next', 'Далее')}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Dynamic Form */}
        {step === 'dynamic_form' && (
          <div className="p-6 pt-4 animate-fade-in flex flex-col h-[75vh]">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleBackToTemplate} className="h-10 w-10 rounded-xl shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black mb-0.5">{t('aiBuilder.nicheQuestions.title', 'Расскажите о себе ✨')}</h2>
                <p className="text-muted-foreground text-sm">
                  {t('aiBuilder.nicheQuestions.desc', 'Эти данные нужны для заполнения блоков. Вы можете пропустить любой шаг.')}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-6 pb-6">
                {/* 1. NAME (Always Required) */}
                <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <Label className="text-base font-semibold">{t('aiBuilder.nicheQuestions.nameLabel', 'Как вас зовут или как называется ваш проект?')} <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground mb-2">{t('aiBuilder.nicheQuestions.nameHint', 'Это будет заголовок вашего профиля')}</p>
                  <Input
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('aiBuilder.nicheQuestions.namePlaceholder', 'Например: Иван Иванов или Студия "Красота"')}
                    className="h-12 rounded-xl bg-background"
                    autoFocus
                  />
                </div>

                {/* 2. BIO (Depends on niche) */}
                <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      {selectedNiche === 'beauty' ? t('aiBuilder.nicheQuestions.bioBeauty', 'Кратко о вашем опыте (Бьюти)') :
                        (selectedNiche === 'art' || selectedNiche === 'tech') ? t('aiBuilder.nicheQuestions.bioFreelance', 'В чем ваша суперсила? (Фриланс)') :
                          selectedNiche === 'business' ? t('aiBuilder.nicheQuestions.bioBusiness', 'Опишите ваш бизнес в 2-х словах') :
                            t('aiBuilder.nicheQuestions.bioGeneric', 'О себе / Описание')}
                    </Label>
                    <span className="text-xs text-muted-foreground">{t('common.optional', 'Необязательно')}</span>
                  </div>
                  <Textarea
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo(p => ({ ...p, bio: e.target.value }))}
                    placeholder={t('aiBuilder.nicheQuestions.bioPlaceholder', 'Напишите пару предложений... Можно добавить ссылку, алгоритм сам сделает из неё красивую кнопку.')}
                    className="rounded-xl flex-1 min-h-[80px] bg-background resize-none"
                  />
                </div>

                {/* 3. SERVICES (If required by template) */}
                {formFields.needsServices && (
                  <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50 animate-fade-in delay-75">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        {selectedNiche === 'beauty' ? t('aiBuilder.nicheQuestions.srvBeauty', 'Какие услуги вы оказываете? (С ценами)') :
                          (selectedNiche === 'art' || selectedNiche === 'tech') ? t('aiBuilder.nicheQuestions.srvFreelance', 'Навыки или Тарифы') :
                            t('aiBuilder.nicheQuestions.srvGeneric', 'Услуги или Навыки')}
                      </Label>
                      <span className="text-xs text-muted-foreground">{t('common.optional', 'Необязательно')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t('aiBuilder.nicheQuestions.srvHint', 'Алгоритм сам раскидает их по карточкам. Если указать слово "скидка" или "подарок" — будет создан бонусный блок!')}</p>
                    <Textarea
                      value={userInfo.services}
                      onChange={(e) => setUserInfo(p => ({ ...p, services: e.target.value }))}
                      placeholder={t('aiBuilder.nicheQuestions.srvPlaceholder', 'Маникюр - 5000 тг\nПедикюр - 7000 тг\nСкидка 10% на первый визит')}
                      className="rounded-xl min-h-[100px] bg-background resize-none"
                    />
                  </div>
                )}

                {/* 4. CONTACTS & LOCATION */}
                {formFields.needsContacts && (
                  <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50 animate-fade-in delay-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{t('aiBuilder.nicheQuestions.contactsLabel', 'Где вас найти? (Контакты и Адрес)')}</Label>
                      <span className="text-xs text-muted-foreground">{t('common.optional', 'Необязательно')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t('aiBuilder.nicheQuestions.contactsHint', 'Укажите номер телефона, почту или физический адрес (начиная с "г." или "ул." — для карты)')}</p>
                    <Textarea
                      value={userInfo.contacts}
                      onChange={(e) => setUserInfo(p => ({ ...p, contacts: e.target.value }))}
                      placeholder={t('aiBuilder.nicheQuestions.contactsPlaceholder', '+7 777 123 45 67\nг. Алматы, пр. Абая 10')}
                      className="rounded-xl min-h-[80px] bg-background resize-none"
                    />
                  </div>
                )}

                {/* 5. SOCIALS */}
                {formFields.needsSocials && (
                  <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50 animate-fade-in delay-150">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{t('aiBuilder.nicheQuestions.socialsLabel', 'Ваши соцсети')}</Label>
                      <span className="text-xs text-muted-foreground">{t('common.optional', 'Необязательно')}</span>
                    </div>
                    <Input
                      value={userInfo.socials}
                      onChange={(e) => setUserInfo(p => ({ ...p, socials: e.target.value }))}
                      placeholder={t('aiBuilder.nicheQuestions.socialsPlaceholder', 'inst: @nickname, t.me/username, youtube.com/...')}
                      className="h-12 rounded-xl bg-background"
                    />
                  </div>
                )}

                {/* 6. MEDIA */}
                {formFields.needsMedia && (
                  <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/50 animate-fade-in delay-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{t('aiBuilder.nicheQuestions.mediaLabel', 'Ссылки на полезные материалы (Медиа)')}</Label>
                      <span className="text-xs text-muted-foreground">{t('common.optional', 'Необязательно')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t('aiBuilder.nicheQuestions.mediaHint', 'Ссылки на YouTube, портфолио или картинки (через запятую)')}</p>
                    <Textarea
                      value={userInfo.mediaLinks}
                      onChange={(e) => setUserInfo(p => ({ ...p, mediaLinks: e.target.value }))}
                      placeholder={t('aiBuilder.nicheQuestions.mediaPlaceholder', 'https://youtube.com/watch?v=..., https://my-portfolio.com')}
                      className="rounded-xl min-h-[80px] bg-background resize-none"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="pt-4 shrink-0 mt-auto bg-card">
              <Button
                onClick={handleGenerate}
                disabled={!userInfo.name.trim()}
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t('aiBuilder.nicheQuestions.generateBtn', 'Сгенерировать магию ✨')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="p-6 py-12 text-center animate-fade-in flex flex-col items-center">
            {/* Animation Container */}
            <div className="relative w-full max-w-sm h-48 mx-auto mb-8 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 overflow-hidden flex items-end justify-center pb-4">
              {/* Magic Wand hovering */}
              <div className="absolute top-4 inset-x-0 flex justify-center animate-bounce">
                <Wand2 className="h-8 w-8 text-primary shadow-primary/50 drop-shadow-lg" />
              </div>

              {/* Simulated blocks building up */}
              <div className="flex flex-col-reverse items-center gap-3 w-full px-8">
                <div className="h-8 w-full bg-primary/20 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-300 flex items-center justify-center text-xs text-primary/70 overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.socials ? t('aiBuilder.gen.socials', 'Подключение соцсетей...') : t('aiBuilder.gen.footer', 'Сборка футера...')}
                </div>
                <div className="h-12 w-full bg-primary/40 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-200 flex items-center justify-center text-xs text-primary/80 font-medium overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.services ? `${t('aiBuilder.gen.services', 'Парсинг услуг:')} ${userInfo.services.slice(0, 15)}...` : t('aiBuilder.gen.blocks', 'Настройка блоков...')}
                </div>
                <div className="h-16 w-full bg-primary/60 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-100 flex items-center justify-center text-sm text-primary-foreground font-bold shadow-md overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.name ? userInfo.name : t('aiBuilder.gen.profile', 'Гидратация профиля...')}
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-3">
              {t('aiBuilder.generatingTitle', 'Нейро-алгоритм собирает страницу')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('aiBuilder.generatingDesc', 'Умные эвристики размещают ваш контент по сетке шаблона')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t('common.pleaseWait', 'Пожалуйста, подождите...')}
            </div>
          </div>
        )}

        {/* Step 5: Complete (Gamified Certificate) */}
        {step === 'complete' && (
          <div className="p-6 py-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-amber-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

            {/* Certificate Container */}
            <div className="relative z-10 animate-in zoom-in duration-700 spring-bounce border-[6px] border-double border-primary/20 bg-card p-8 rounded-2xl shadow-2xl max-w-sm w-full outline outline-1 outline-primary/10">

              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/20 animate-pulse">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>

              <h3 className="text-sm font-bold tracking-widest text-primary/60 uppercase mb-2">
                {t('aiBuilder.cert.subtitle', 'Официальный Сертификат')}
              </h3>
              <h2 className="text-2xl font-black mb-4 leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('aiBuilder.cert.title', 'Страница Успешно Создана!')}
              </h2>

              <div className="py-4 border-y border-border/50 mb-6">
                <p className="text-sm text-muted-foreground mb-1">{t('aiBuilder.cert.owner', 'Владелец:')}</p>
                <p className="text-xl font-bold font-serif text-primary italic">
                  {userInfo.name}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('aiBuilder.cert.desc', 'Теперь вы можете редактировать цвета, шрифты и блоки в панели управления.')}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
