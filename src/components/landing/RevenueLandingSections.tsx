import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import Check from 'lucide-react/dist/esm/icons/check';
import CircleDollarSign from 'lucide-react/dist/esm/icons/circle-dollar-sign';
import Clock3 from 'lucide-react/dist/esm/icons/clock-3';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import UserRoundCheck from 'lucide-react/dist/esm/icons/user-round-check';

import { Button } from '@/components/ui/button';
import { getProPrice } from '@/domain/billing/catalog';

interface RevenueLandingSectionsProps {
  onStart: () => void;
  onPricing: () => void;
}

const ANNUAL_PRO_PRICE = getProPrice(12);

function formatKzt(value: number) {
  return value.toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
}

export function RevenueLandingSections({ onStart, onPricing }: RevenueLandingSectionsProps) {
  const { t } = useTranslation();

  const outcomes = [
    {
      id: 'offer',
      icon: Sparkles,
      title: t('landing.revenue.outcomes.offer.title', 'Предложение понятно сразу'),
      body: t('landing.revenue.outcomes.offer.body', 'Услуги, цены, примеры работ и ответы на частые вопросы собраны в одном месте.'),
    },
    {
      id: 'booking',
      icon: CalendarCheck2,
      title: t('landing.revenue.outcomes.booking.title', 'Запись без долгой переписки'),
      body: t('landing.revenue.outcomes.booking.body', 'Клиент выбирает подходящую услугу и время, а вы получаете оформленную заявку.'),
    },
    {
      id: 'payment',
      icon: CircleDollarSign,
      title: t('landing.revenue.outcomes.payment.title', 'Деньги не теряются между сообщениями'),
      body: t('landing.revenue.outcomes.payment.body', 'Стоимость, предоплата и статус заказа остаются рядом с данными клиента.'),
    },
    {
      id: 'return',
      icon: RefreshCw,
      title: t('landing.revenue.outcomes.return.title', 'Есть повод вернуться к клиенту'),
      body: t('landing.revenue.outcomes.return.body', 'Рабочий список помогает увидеть, кому ответить, кого подтвердить и кому напомнить о повторной услуге.'),
    },
  ];

  const journey = [
    {
      id: 'discover',
      label: t('landing.revenue.journey.discover.label', '01 · Знакомство'),
      title: t('landing.revenue.journey.discover.title', 'Клиент открывает вашу ссылку'),
      body: t('landing.revenue.journey.discover.body', 'За несколько секунд понимает, чем вы можете помочь и сколько это стоит.'),
    },
    {
      id: 'act',
      label: t('landing.revenue.journey.act.label', '02 · Действие'),
      title: t('landing.revenue.journey.act.title', 'Выбирает следующий шаг'),
      body: t('landing.revenue.journey.act.body', 'Записывается, оставляет заявку или получает понятные инструкции для оплаты.'),
    },
    {
      id: 'work',
      label: t('landing.revenue.journey.work.label', '03 · Работа'),
      title: t('landing.revenue.journey.work.title', 'Вы ведёте клиента без хаоса'),
      body: t('landing.revenue.journey.work.body', 'Заявка, контакт, статус и история остаются в одном рабочем пространстве.'),
    },
    {
      id: 'return',
      label: t('landing.revenue.journey.return.label', '04 · Возврат'),
      title: t('landing.revenue.journey.return.title', 'Следующая продажа не начинается с нуля'),
      body: t('landing.revenue.journey.return.body', 'Вы видите подходящий момент для повторной записи или нового предложения.'),
    },
  ];

  const audiences = [
    {
      id: 'beauty',
      title: t('landing.revenue.segments.beauty.title', 'Бьюти и wellness'),
      body: t('landing.revenue.segments.beauty.body', 'Услуги, расписание, предоплата и повторная запись.'),
    },
    {
      id: 'experts',
      title: t('landing.revenue.segments.experts.title', 'Эксперты и консультанты'),
      body: t('landing.revenue.segments.experts.body', 'Форматы консультаций, бриф, выбор времени и счёт.'),
    },
    {
      id: 'education',
      title: t('landing.revenue.segments.education.title', 'Преподаватели и наставники'),
      body: t('landing.revenue.segments.education.body', 'Программы, пробные занятия, запись и работа с учениками.'),
    },
    {
      id: 'creative',
      title: t('landing.revenue.segments.creative.title', 'Фотографы и креативные специалисты'),
      body: t('landing.revenue.segments.creative.body', 'Портфолио, пакеты услуг, заявка, бронь даты и оплата.'),
    },
  ];

  return (
    <>
      <section id="outcomes" className="bg-[#f6f6f1] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-6 border-b border-[#ded9c9] pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5701]">
                {t('landing.revenue.outcomes.eyebrow', 'Что меняется для бизнеса')}
              </p>
              <h2 className="mt-4 max-w-[13ch] text-4xl font-semibold leading-[0.96] tracking-[-0.045em] text-[#101318] md:text-[60px]">
                {t('landing.revenue.outcomes.title', 'Не просто ссылка. Рабочий путь клиента.')}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#62675f] lg:justify-self-end lg:text-lg">
              {t('landing.revenue.outcomes.subtitle', 'Страница привлекает внимание, но ценность LinkMAX начинается дальше: когда интерес превращается в понятное действие и не теряется после первой покупки.')}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {outcomes.map((item, index) => (
              <article key={item.id} className="rounded-[28px] border border-[#ded9c9] bg-white p-6 shadow-[0_14px_38px_rgba(16,19,24,0.05)] md:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101318] text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-[#a0a59d]">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em] text-[#101318]">{item.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#62675f]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#101318] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7840]">
                {t('landing.revenue.journey.eyebrow', 'Один непрерывный процесс')}
              </p>
              <h2 className="mt-4 max-w-[11ch] text-4xl font-semibold leading-[0.96] tracking-[-0.045em] md:text-[60px]">
                {t('landing.revenue.journey.title', 'От первого клика до следующего визита')}
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/65">
                {t('landing.revenue.journey.subtitle', 'Каждый шаг можно подключать постепенно. Начните со страницы и заявок, затем добавьте запись, оплату и работу с возвращением клиентов.')}
              </p>
            </div>

            <ol className="space-y-3">
              {journey.map((step) => (
                <li key={step.id} className="grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-5 sm:grid-cols-[150px_1fr] sm:p-6">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff7840]">{step.label}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="examples" className="bg-[#f6f6f1] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5701]">
              {t('landing.revenue.segments.eyebrow', 'Не одна ниша')}
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#101318] md:text-[60px]">
              {t('landing.revenue.segments.title', 'Один принцип — разные услуги')}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#62675f]">
              {t('landing.revenue.segments.subtitle', 'LinkMAX подходит тем, у кого клиенту нужно объяснить предложение, выбрать формат или время и довести договорённость до оплаты.')}
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((audience, index) => (
              <article key={audience.id} className="flex min-h-[230px] flex-col justify-between rounded-[26px] bg-white p-6 shadow-[0_14px_38px_rgba(16,19,24,0.06)]">
                <span className="text-4xl font-semibold tracking-[-0.06em] text-[#ff5701]">0{index + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold leading-6 text-[#101318]">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#62675f]">{audience.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px] rounded-[32px] border border-[#ded9c9] p-5 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5701]">
                {t('landing.revenue.comparison.eyebrow', 'Почему не обычный link-in-bio')}
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#101318] md:text-[52px]">
                {t('landing.revenue.comparison.title', 'Ссылка показывает. LinkMAX помогает довести дело до результата.')}
              </h2>
              <p className="mt-5 text-base leading-7 text-[#62675f]">
                {t('landing.revenue.comparison.subtitle', 'Можно начать как с простой страницы. Разница становится заметна, когда появляются заявки, расписание, оплаты и клиенты, которым важно вовремя ответить.')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#f6f6f1] p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#62675f]">
                  {t('landing.revenue.comparison.links.title', 'Обычная страница ссылок')}
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#62675f]">
                  <li>{t('landing.revenue.comparison.links.one', 'Показывает кнопки и контакты')}</li>
                  <li>{t('landing.revenue.comparison.links.two', 'Переводит работу обратно в мессенджеры')}</li>
                  <li>{t('landing.revenue.comparison.links.three', 'Не подсказывает, что делать после заявки')}</li>
                </ul>
              </div>
              <div className="rounded-[24px] bg-[#101318] p-5 text-white">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#ff7840]">LinkMAX</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
                  {[
                    t('landing.revenue.comparison.product.one', 'Показывает предложение и принимает действие'),
                    t('landing.revenue.comparison.product.two', 'Сохраняет заявку, запись и статус рядом'),
                    t('landing.revenue.comparison.product.three', 'Помогает увидеть следующий шаг по клиенту'),
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#ff7840]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f6f6f1] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5701]">
              {t('landing.revenue.pricing.eyebrow', 'Начните с того, что нужно сейчас')}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-[#101318] md:text-[56px]">
              {t('landing.revenue.pricing.title', 'Бесплатный старт. Pro — когда бизнесу тесно.')}
            </h2>
          </div>

          <div className="mx-auto mt-9 grid max-w-4xl gap-4 md:grid-cols-2">
            <article className="rounded-[28px] border border-[#ded9c9] bg-white p-6 md:p-7">
              <p className="text-sm font-bold text-[#62675f]">{t('landing.revenue.pricing.free.name', 'Free')}</p>
              <div className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#101318]">0 ₸</div>
              <p className="mt-2 text-sm text-[#62675f]">{t('landing.revenue.pricing.free.note', 'Можно пользоваться без ограничения по времени')}</p>
              <ul className="mt-7 space-y-3 text-sm text-[#42473f]">
                {[
                  t('landing.revenue.pricing.free.one', 'Публичная страница и основные блоки'),
                  t('landing.revenue.pricing.free.two', 'Заявки, запись и рабочий список в базовом объёме'),
                  t('landing.revenue.pricing.free.three', 'QR-код и базовая статистика'),
                ].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5701]" />{item}</li>
                ))}
              </ul>
              <Button onClick={onStart} variant="outline" className="mt-8 h-12 w-full rounded-[14px] border-[#101318] text-[#101318] hover:bg-[#101318] hover:text-white">
                {t('landing.revenue.pricing.free.cta', 'Начать бесплатно')}
              </Button>
            </article>

            <article className="relative overflow-hidden rounded-[28px] bg-[#101318] p-6 text-white shadow-[0_24px_70px_rgba(16,19,24,0.18)] md:p-7">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-[#ff5701]/25 blur-3xl" />
              <div className="relative">
                <p className="text-sm font-bold text-white/60">{t('landing.revenue.pricing.pro.name', 'Pro · при оплате за год')}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.06em]">{formatKzt(ANNUAL_PRO_PRICE.monthlyKzt)} ₸</span>
                  <span className="pb-1 text-sm text-white/55">/{t('landing.revenue.pricing.month', 'месяц')}</span>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  {t('landing.revenue.pricing.pro.total', '{{total}} ₸ за 12 месяцев', { total: formatKzt(ANNUAL_PRO_PRICE.totalKzt) })}
                </p>
                <ul className="mt-7 space-y-3 text-sm text-white/80">
                  {[
                    t('landing.revenue.pricing.pro.one', 'Безлимитные обращения клиентов'),
                    t('landing.revenue.pricing.pro.two', 'Расширенная аналитика и экспорт'),
                    t('landing.revenue.pricing.pro.three', 'До шести страниц и подключение своего домена'),
                  ].map((item) => (
                    <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7840]" />{item}</li>
                  ))}
                </ul>
                <Button onClick={onPricing} className="mt-8 h-12 w-full rounded-[14px] bg-white text-[#101318] hover:bg-[#f6f6f1]">
                  {t('landing.revenue.pricing.pro.cta', 'Посмотреть все тарифы')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </article>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-[#777c75]">
            {t('landing.revenue.pricing.disclaimer', 'Функции и лимиты зависят от тарифа. Точная стоимость и условия всегда показаны на странице оплаты до подключения.')}
          </p>
        </div>
      </section>

      <section className="bg-[#f6f6f1] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-[1120px] gap-6 overflow-hidden rounded-[32px] bg-[#ff5701] px-6 py-8 text-white shadow-[0_24px_70px_rgba(255,87,1,0.20)] md:grid-cols-[1fr_auto] md:items-center md:px-9 md:py-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              <Clock3 className="h-4 w-4" />
              {t('landing.revenue.final.eyebrow', 'Можно начать с простой версии')}
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-[48px]">
              {t('landing.revenue.final.title', 'Соберите понятный путь для клиента — остальное подключите по мере роста')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
              {t('landing.revenue.final.subtitle', 'Без карты и обязательной подписки. Создайте страницу, проверьте её на реальных клиентах и развивайте тот сценарий, который приносит вам работу.')}
            </p>
          </div>
          <Button onClick={onStart} className="h-14 rounded-[16px] bg-[#101318] px-6 text-base font-semibold text-white hover:bg-[#232832]">
            <UserRoundCheck className="mr-2 h-5 w-5" />
            {t('landing.revenue.final.cta', 'Создать свою страницу')}
          </Button>
        </div>
      </section>
    </>
  );
}
