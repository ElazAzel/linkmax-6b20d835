import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { auditRu, humanizeText, isRussian } from '@/lib/text/humanizer-ru';
import { cn } from '@/lib/utils/utils';

interface HumanizeButtonProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'secondary';
}

/**
 * Кнопка «Очеловечить» — детерминированная чистка текста от AI-клише,
 * канцелярита и оформительского мусора (humanizer-ru).
 */
export function HumanizeButton({
  value,
  onChange,
  className,
  size = 'sm',
  variant = 'outline',
}: HumanizeButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    const source = (value || '').trim();
    if (!source) {
      toast.error(t('humanizer.empty', 'Сначала напишите текст'));
      return;
    }
    setBusy(true);
    try {
      const next = humanizeText(source);
      if (next === source) {
        toast.success(t('humanizer.alreadyClean', 'Текст уже звучит по-человечески'));
        return;
      }
      onChange(next);
      const after = auditRu(next);
      toast.success(
        t('humanizer.done', 'Текст стал живее') +
          (isRussian(next) ? ` · ${after.score}/100` : ''),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={busy}
      onClick={handleClick}
      className={cn('rounded-xl gap-2', className)}
    >
      <Wand2 className="h-4 w-4" />
      {t('humanizer.action', 'Очеловечить')}
    </Button>
  );
}
