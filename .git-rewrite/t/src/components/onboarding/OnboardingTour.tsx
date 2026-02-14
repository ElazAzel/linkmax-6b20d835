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
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(320, viewportWidth - 32); // Max 320px or viewport - padding
    const tooltipHeight = 200; // Approximate height
    const safeMargin = 16;

    // Calculate safe bounds
    const safeLeft = safeMargin;
    const safeRight = viewportWidth - tooltipWidth - safeMargin;
    const safeTop = safeMargin;
    const safeBottom = viewportHeight - tooltipHeight - safeMargin;

    // Calculate center position of the target element
    const targetCenterX = highlightPosition.left + highlightPosition.width / 2;
    const targetCenterY = highlightPosition.top + highlightPosition.height / 2;

    // Determine best position based on available space
    const spaceAbove = highlightPosition.top - safeMargin;
    const spaceBelow = viewportHeight - highlightPosition.bottom - safeMargin;
    const spaceLeft = highlightPosition.left - safeMargin;
    const spaceRight = viewportWidth - highlightPosition.right - safeMargin;

    // Default: position below if enough space, otherwise above
    let top = highlightPosition.bottom + tooltipOffset;
    let left = Math.max(safeLeft, Math.min(safeRight, targetCenterX - tooltipWidth / 2));
    let transform = 'none';

    if (spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
      // Position above
      top = Math.max(safeTop, highlightPosition.top - tooltipOffset - tooltipHeight);
    } else {
      // Position below
      top = Math.min(safeBottom, highlightPosition.bottom + tooltipOffset);
    }

    // Ensure left is within bounds
    left = Math.max(safeLeft, Math.min(safeRight, left));

    // Ensure top is within bounds
    top = Math.max(safeTop, Math.min(safeBottom, top));

    return { top, left };
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
          "fixed p-4 sm:p-5 shadow-2xl z-[101] max-w-[calc(100vw-2rem)] w-80",
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
