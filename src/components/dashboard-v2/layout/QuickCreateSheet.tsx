import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function QuickCreateSheet({ open, onOpenChange, onAction }: { open: boolean; onOpenChange: (open: boolean) => void; onAction: (action: string) => void }) {
  const { t } = useTranslation();
  const actions = [
    ['block', 'pageV2.actions.block', 'Добавить блок'],
    ['theme', 'pageV2.actions.theme', 'Оформление'],
    ['order', 'pageV2.actions.order', 'Порядок блоков'],
    ['templates', 'pageV2.actions.templates', 'Шаблоны'],
    ['ai', 'pageV2.actions.ai', 'AI-помощник'],
  ];
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
    <SheetHeader className="pr-10 text-left"><SheetTitle>{t('pageV2.navigation.add', 'Добавить')}</SheetTitle></SheetHeader>
    <div className="mt-4 grid gap-2">{actions.map(([id, key, fallback]) => <Button key={id} variant="secondary" className="min-h-12 justify-start rounded-2xl" onClick={() => { onOpenChange(false); onAction(id); }}>{t(key, fallback)}</Button>)}</div>
  </SheetContent></Sheet>;
}
