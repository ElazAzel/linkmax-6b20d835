import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Send from 'lucide-react/dist/esm/icons/send';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Download from 'lucide-react/dist/esm/icons/download';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Users from 'lucide-react/dist/esm/icons/users';

interface Props {
  onStart: () => void;
  onPricing: () => void;
}

export function LandingSections({ onStart, onPricing }: Props) {
  const { t } = useTranslation();

  const features = [
    { icon: CalendarCheck2, wide: true, title: t('landing.k.f.booking', 'Онлайн-запись'), body: t('landing.k.f.bookingBody', 'Услуги с ценой и длительностью, свободные слоты, специалисты и кабинеты. Занятое время не продать дважды.') },
    { icon: Send, title: t('landing.k.f.leads', 'Заявки в мессенджер'), body: t('landing.k.f.leadsBody', 'Каждая заявка мгновенно приходит в Telegram.') },
    { icon: CreditCard, title: t('landing.k.f.pay', 'Оплата'), body: t('landing.k.f.payBody', 'Предоплата и оплата услуг прямо со страницы.') },
    { icon: Ticket, title: t('landing.k.f.events', 'Мероприятия и билеты'), body: t('landing.k.f.eventsBody', 'Регистрация, билеты с QR и сканер по ссылке для ваших помощников.') },
    { icon: Download, title: t('landing.k.f.digital', 'Цифровые товары'), body: t('landing.k.f.digitalBody', 'Гайды, курсы и файлы с выдачей после оплаты.') },
    { icon: Users, wide: true, title: t('landing.k.f.crm', 'Карточка клиента'), body: t('landing.k.f.crmBody', 'Заявки, записи и покупки собираются в историю клиента. Этапы, заметки и общая выручка в одном месте.') },
    { icon: Bot, title: t('landing.k.f.ai', 'Помощник на странице'), body: t('landing.k.f.aiBody', 'Отвечает гостям по вашим услугам и ценам.') },
    { icon: Palette, title: t('landing.k.f.themes', '25 тем оформления'), body: t('landing.k.f.themesBody', 'Красиво с телефона, без дизайнера.') },
  ];

  const steps = [
    { n: '01', title: t('landing.k.s1', 'Выберите адрес'), body: t('landing.k.s1b', 'lnkmx.my/вашеимя — за 10 секунд.') },
    { n: '02', title: t('landing.k.s2', 'Добавьте услуги'), body: t('landing.k.s2b', 'Цены, расписание, контакты, оплата.') },
    { n: '03', title: t('landing.k.s3', 'Поставьте ссылку в био'), body: t('landing.k.s3b', 'Instagram, Telegram, WhatsApp, 2ГИС.') },
  ];

  return (
    <>
      <section className="bg-background px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="max-w-[720px] text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
            {t('landing.k.f.title', 'Всё, что нужно для продаж, в одной ссылке')}
          </h2>
          <p className="mt-4 max-w-[560px] text-base text-muted-foreground sm:text-lg">
            {t('landing.k.f.sub', 'Не просто список ссылок. Ваша страница принимает записи, деньги и заявки сама.')}
          </p>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title} className={`flex min-h-[200px] flex-col justify-between rounded-[28px] bg-muted p-6 ${f.wide ? 'lg:col-span-2' : ''}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background">
                  <f.icon className="h-5 w-5 text-primary" />
                </span>
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
            {t('landing.k.s.title', 'Запуск за 5 минут')}
          </h2>
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[28px] bg-background p-7">
                <span className="font-num text-sm text-muted-foreground">{s.n}</span>
                <h3 className="mt-10 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-20 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center rounded-[36px] bg-foreground px-6 py-16 text-center text-background sm:py-20">
          <h2 className="max-w-[640px] text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
            {t('landing.k.cta.title', 'Начните принимать клиентов сегодня')}
          </h2>
          <p className="mt-4 text-background/65">{t('landing.k.cta.sub', 'Бесплатно. Без карты. Pro, когда понадобится больше.')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onStart} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-background px-7 text-sm font-semibold text-foreground hover:opacity-90">
              {t('landing.short.ctaPrimary', 'Создать бесплатно')} <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onPricing} className="inline-flex h-14 items-center justify-center rounded-full border border-background/20 px-7 text-sm font-semibold hover:bg-background/10">
              {t('landing.k.cta.pricing', 'Тарифы')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
