import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CountdownBlock as CountdownBlockType } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface CountdownBlockProps {
  block: CountdownBlockType;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownBlock = React.memo(function CountdownBlock({ block }: CountdownBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const title = block.title ? getTranslatedString(block.title, currentLang) : '';
  const expiredText = block.expiredText 
    ? getTranslatedString(block.expiredText, currentLang) 
    : t('blocks.countdown.expired', 'Время вышло!');

  const showDays = block.showDays !== false;
  const showHours = block.showHours !== false;
  const showMinutes = block.showMinutes !== false;
  const showSeconds = block.showSeconds !== false;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(block.targetDate).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      setIsExpired(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [block.targetDate]);

  if (!block.targetDate) {
    return (
      <Card className="w-full bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('blocks.countdown.noDate', 'Укажите дату')}
        </CardContent>
      </Card>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-card border border-border shadow-sm rounded-lg p-3 min-w-[60px]">
        <span className="text-2xl md:text-3xl font-bold text-primary">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs md:text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className="w-full space-y-3">
      {title && (
        <h3 className="text-xl font-semibold text-center">{title}</h3>
      )}
      
      {isExpired ? (
        <div className="text-center py-6">
          <p className="text-lg font-medium text-primary">{expiredText}</p>
        </div>
      ) : timeLeft ? (
        <div className="flex justify-center gap-2 md:gap-4">
          {showDays && (
            <TimeUnit 
              value={timeLeft.days} 
              label={t('blocks.countdown.days', 'дней')} 
            />
          )}
          {showHours && (
            <TimeUnit 
              value={timeLeft.hours} 
              label={t('blocks.countdown.hours', 'часов')} 
            />
          )}
          {showMinutes && (
            <TimeUnit 
              value={timeLeft.minutes} 
              label={t('blocks.countdown.minutes', 'минут')} 
            />
          )}
          {showSeconds && (
            <TimeUnit 
              value={timeLeft.seconds} 
              label={t('blocks.countdown.seconds', 'секунд')} 
            />
          )}
        </div>
      ) : null}
    </div>
  );
});
