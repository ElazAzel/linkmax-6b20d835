import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import X from 'lucide-react/dist/esm/icons/x';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import { cn } from '@/lib/utils/utils';

interface OnboardingStep {
  target: string;
  titleKey: string;
  descKey: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const stepDefs: OnboardingStep[] = [
  { target: 'welcome', titleKey: 'onboardingTour.welcome.title', descKey: 'onboardingTour.welcome.desc', position: 'center' },
  { target: '[data-onboarding="profile-block"]', titleKey: 'onboardingTour.profile.title', descKey: 'onboardingTour.profile.desc', position: 'bottom' },
  { target: '[data-onboarding="add-block"]', titleKey: 'onboardingTour.addBlock.title', descKey: 'onboardingTour.addBlock.desc', position: 'top' },
  { target: '[data-onboarding="block-edit"]', titleKey: 'onboardingTour.editBlock.title', descKey: 'onboardingTour.editBlock.desc', position: 'right' },
  { target: '[data-onboarding="share-button"]', titleKey: 'onboardingTour.share.title', descKey: 'onboardingTour.share.desc', position: 'bottom' },
  { target: 'complete', titleKey: 'onboardingTour.complete.title', descKey: 'onboardingTour.complete.desc', position: 'center' },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  const step = stepDefs[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === stepDefs.length - 1;
  const isCenterStep = step.position === 'center';

  useEffect(() => {
    if (!isCenterStep) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition(rect);
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

    const tooltipOffset = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 640;
    
    // Calculate tooltip dimensions based on screen size
    const tooltipWidth = isMobile ? viewportWidth - 32 : Math.min(320, viewportWidth - 64);
    const tooltipHeight = isMobile ? 180 : 200;
    const safeMargin = isMobile ? 16 : 24;

    // Calculate safe bounds ensuring tooltip stays on screen
    const safeLeft = safeMargin;
    const safeRight = viewportWidth - tooltipWidth - safeMargin;
    const safeTop = safeMargin;
    const safeBottom = viewportHeight - tooltipHeight - safeMargin;

    // Calculate center position of the target element
    const targetCenterX = highlightPosition.left + highlightPosition.width / 2;

    // Determine available space around the element
    const spaceAbove = highlightPosition.top - safeMargin;
    const spaceBelow = viewportHeight - highlightPosition.bottom - safeMargin;

    // Start with horizontal centering, constrained to screen bounds
    let left = targetCenterX - tooltipWidth / 2;
    left = Math.max(safeLeft, Math.min(safeRight, left));

    // Determine vertical position - prefer below, then above, then overlay
    let top: number;
    
    if (spaceBelow >= tooltipHeight + tooltipOffset) {
      // Enough space below
      top = highlightPosition.bottom + tooltipOffset;
    } else if (spaceAbove >= tooltipHeight + tooltipOffset) {
      // Enough space above
      top = highlightPosition.top - tooltipHeight - tooltipOffset;
    } else {
      // Not enough space - position at center of screen on mobile, or best fit on desktop
      if (isMobile) {
        top = Math.max(safeTop, (viewportHeight - tooltipHeight) / 2);
      } else {
        top = spaceBelow > spaceAbove 
          ? Math.min(safeBottom, highlightPosition.bottom + tooltipOffset)
          : Math.max(safeTop, highlightPosition.top - tooltipHeight - tooltipOffset);
      }
    }

    // Final bounds check
    top = Math.max(safeTop, Math.min(safeBottom, top));

    return { 
      top, 
      left,
      width: isMobile ? `calc(100vw - ${safeMargin * 2}px)` : tooltipWidth,
      maxWidth: '100%'
    };
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
          "fixed p-4 shadow-2xl z-[101]",
          isCenterStep && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] sm:w-80 max-w-80"
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
