import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: OnboardingStep[] = [
  {
    target: 'welcome',
    title: 'Добро пожаловать в LinkMAX! 👋',
    description: 'Сейчас мы покажем вам основы работы с редактором. Это займет всего минуту.',
    position: 'center',
  },
  {
    target: '[data-onboarding="profile-block"]',
    title: 'Ваш профиль',
    description: 'Кликните на блок профиля, чтобы изменить имя, био и аватар.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="add-block"]',
    title: 'Добавление блоков',
    description: 'Нажмите на кнопку +, чтобы добавить новый блок. Доступны ссылки, товары, видео и многое другое.',
    position: 'top',
  },
  {
    target: '[data-onboarding="block-edit"]',
    title: 'Редактирование блоков',
    description: 'Наведите на любой блок, чтобы увидеть кнопки редактирования, удаления и перетаскивания.',
    position: 'right',
  },
  {
    target: '[data-onboarding="share-button"]',
    title: 'Публикация страницы',
    description: 'Когда закончите, нажмите "Share", чтобы получить публичную ссылку для социальных сетей.',
    position: 'bottom',
  },
  {
    target: 'complete',
    title: 'Готово! 🎉',
    description: 'Теперь вы знаете основы. Начните создавать свою страницу!',
    position: 'center',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isCenterStep = step.position === 'center';

  useEffect(() => {
    if (!isCenterStep) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition(rect);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightPosition(null);
    }
  }, [currentStep, step.target, isCenterStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!highlightPosition) return {};

    const tooltipOffset = 12;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 640;

    // On mobile, always position below or above with centered horizontal
    if (isMobile) {
      const spaceBelow = window.innerHeight - highlightPosition.bottom;
      const positionBelow = spaceBelow > 200;
      
      return {
        top: positionBelow 
          ? highlightPosition.bottom + tooltipOffset 
          : highlightPosition.top - tooltipOffset,
        left: '50%',
        transform: positionBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
      };
    }

    switch (step.position) {
      case 'top':
        return {
          top: highlightPosition.top - tooltipOffset,
          left: Math.min(Math.max(highlightPosition.left + highlightPosition.width / 2, 180), viewportWidth - 180),
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: highlightPosition.bottom + tooltipOffset,
          left: Math.min(Math.max(highlightPosition.left + highlightPosition.width / 2, 180), viewportWidth - 180),
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: highlightPosition.top + highlightPosition.height / 2,
          left: highlightPosition.left - tooltipOffset,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: highlightPosition.top + highlightPosition.height / 2,
          left: highlightPosition.right + tooltipOffset,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay with highlight */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
        {highlightPosition && (
          <div
            className="absolute rounded-lg ring-4 ring-primary/50 animate-pulse"
            style={{
              top: highlightPosition.top - 4,
              left: highlightPosition.left - 4,
              width: highlightPosition.width + 8,
              height: highlightPosition.height + 8,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <Card
        className={cn(
          "absolute w-[calc(100vw-2rem)] max-w-sm p-4 sm:p-6 shadow-2xl mx-4 sm:mx-0",
          isCenterStep && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={!isCenterStep ? getTooltipPosition() : {}}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Пропустить
            </Button>
            
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Назад
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? 'Начать' : 'Далее'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
