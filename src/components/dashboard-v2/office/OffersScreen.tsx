import { useTranslation } from 'react-i18next';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { getI18nText } from '@/lib/i18n-helpers';
import type { Block, PageData } from '@/types/page';
import { DashboardHeader } from '../layout/DashboardHeader';
import { formatOffersAmount, getOffersInventory, isOffersTutorPage, type OffersInventoryItem } from './offers-inventory';

interface OffersScreenProps {
  pageData: PageData | null;
  loading: boolean;
  onEditBlock: (block: Block) => void;
  onInsertBlock: (type: string) => void;
  onOpenPage: () => void;
}

export function OffersScreen({ pageData, loading, onEditBlock, onInsertBlock, onOpenPage }: OffersScreenProps) {
  const { t, i18n } = useTranslation();
  const key = 'digitalOffice.offers.';
  if (loading) return <LoadingState variant="skeleton-cards" skeletonCount={3} />;
  if (!pageData) return <EmptyState variant="card" title={t(key + 'noPageTitle', 'Выберите страницу для ваших услуг')}
    description={t(key + 'noPageDescription', 'Откройте свою страницу, чтобы добавить или посмотреть услуги.')}
    action={{ label: t(key + 'openPage', 'Открыть мою страницу'), onClick: onOpenPage }} />;
  const inventory = getOffersInventory(pageData, i18n.language);
  if (!inventory) return <ErrorState variant="card" title={t(key + 'errorTitle', 'Не удалось прочитать услуги')}
    description={t(key + 'errorDescription', 'Откройте страницу и проверьте список услуг в редакторе.')} onRetry={onOpenPage} />;
  const price = (item: OffersInventoryItem) => {
    if (item.price === null) return t(key + 'priceUnspecified', 'Цена не указана');
    if (item.price === 0 && item.priceType !== 'from' && item.priceType !== 'range') return t(key + 'free', 'Бесплатно');
    const amount = formatOffersAmount(item.price, item.currency, i18n.language);
    if (item.priceType === 'from') return t(key + 'priceFrom', 'от {{price}}', { price: amount });
    if (item.priceType === 'range' && item.priceMax !== null && item.priceMax >= item.price) {
      return t(key + 'priceRange', '{{min}} – {{max}}', { min: amount, max: formatOffersAmount(item.priceMax, item.currency, i18n.language) });
    }
    return amount;
  };
  return <div className="space-y-5 p-4 md:p-0" data-testid="office-offers">
    <DashboardHeader title={t('digitalOffice.navigation.offers', 'Предложения')} hideLivePill
      actions={<Button onClick={() => onInsertBlock('pricing')}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />{t(key + 'addService', 'Добавить услугу')}</Button>} />
    <div><h2 className="text-xl font-semibold">{t(key + 'title', 'Что вы предлагаете клиентам?')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t(key + 'description', 'Начните с услуги: укажите, что получит клиент, сколько это стоит и сколько времени займёт.')}</p></div>
    {inventory.items.length === 0 ? <EmptyState variant="card" icon={Layers} title={t(key + 'emptyTitle', 'Добавьте первую услугу')}
      description={t(key + 'emptyDescription', 'Название, цена и длительность помогут клиенту выбрать вас.')}
      action={{ label: t(key + 'emptyAction', 'Добавить первую услугу'), onClick: () => onInsertBlock('pricing') }} />
      : <div className="grid gap-4 md:grid-cols-2">{inventory.items.map((item) => {
        const name = item.name || t(key + 'unnamedService', 'Услуга без названия');
        return <Card key={item.key}><CardHeader><CardTitle className="text-base">{name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {item.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>}
            <p className="font-num text-lg font-semibold">{price(item)}</p>
            <p className="text-sm text-muted-foreground">{item.duration !== null ? t(key + 'duration', '{{minutes}} мин', { minutes: item.duration }) : t(key + 'durationUnspecified', 'Длительность не указана')}{item.period && ` · ${item.period}`}</p>
            {item.bookingBlocks.length > 0 && <StatusBadge tone="success">{t(key + 'bookingLinked', 'Есть форма записи')}</StatusBadge>}
            <div><Button variant="outline" aria-label={t(key + 'editNamed', 'Изменить услугу: {{name}}', { name })} onClick={() => onEditBlock(item.block)}>{t(key + 'edit', 'Изменить услугу')}</Button></div>
          </CardContent></Card>;
      })}</div>}
    <Card><CardHeader><CardTitle className="text-base">{t(key + 'availabilityTitle', 'Когда вы принимаете клиентов?')}</CardTitle></CardHeader>
      <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{t(key + 'availabilityDescription', 'Настройте рабочие дни, часы и интервалы записи.')}</p>
        {inventory.hasUnresolvedServices && <p className="text-sm text-warning">{t(key + 'unresolvedServices')}</p>}
        {inventory.bookingBlocks.length ? inventory.bookingBlocks.map((block) => {
          const name = getI18nText(block.title, i18n.language) || t(key + 'unnamedBooking', 'Онлайн-запись');
          return <Button key={block.id} variant="outline" className="mr-2" aria-label={t(key + 'editAvailabilityNamed', 'Настроить время записи: {{name}}', { name })} onClick={() => onEditBlock(block)}>
            <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />{name}</Button>;
        }) : <Button variant="outline" onClick={() => onInsertBlock('booking')}>{t(key + 'setupBooking', 'Настроить онлайн-запись')}</Button>}
      </CardContent></Card>
    {isOffersTutorPage(pageData) && <Card><CardHeader><CardTitle className="text-base">{t(key + 'tutorTitle', 'Идея для репетитора')}</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{t(key + 'tutorDescription', 'Начните с индивидуального занятия. В редакторе укажите предмет, длительность и свою цену.')}</p>
      <Button variant="outline" onClick={() => onInsertBlock('pricing')}>{t(key + 'tutorAction', 'Создать услугу для занятия')}</Button>
    </CardContent></Card>}
    <Button variant="ghost" onClick={onOpenPage}>{t(key + 'openPage', 'Открыть мою страницу')}</Button>
  </div>;
}
