import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import KanbanSquare from 'lucide-react/dist/esm/icons/kanban-square';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface HeroBentoOSProps {
  onStart: () => void;
  onExamples: () => void;
}

export function HeroBentoOS({ onStart, onExamples }: HeroBentoOSProps) {
  const { t } = useTranslation();

  const metrics = [
    { value: '15', label: t('landing.v5.metric1', 'минут до запуска') },
    { value: '7%', label: t('landing.v5.metric2', 'комиссия Starter') },
    { value: '1', label: t('landing.v5.metric3', 'лента заявок') },
  ];

  const capabilities = [
    {
      icon: CalendarCheck2,
      title: t('landing.v5.bento.builder.badge', 'запись открыта'),
      body: t('landing.v5.bento.builder.cta', 'Записаться на свободное время'),
    },
    {
      icon: Send,
      title: t('landing.v5.bento.crm.notify_title', 'Новая заявка'),
      body: t('landing.v5.bento.crm.notify_desc', 'Анна - запись на 14:00'),
    },
    {
      icon: CreditCard,
      title: t('landing.v5.bento.pay.title', 'Оплата до визита'),
      body: t('landing.v5.bento.pay.desc', 'Kaspi QR, Robokassa, Stripe'),
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(238,244,255,0.72),rgba(246,247,249,0)_42%)]" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.015em] text-[#172033] sm:text-5xl lg:text-[58px] lg:leading-[1.06]">
              LinkMAX - {t('landing.v5.title1', 'Страница, где клиент записывается,')}{' '}
              <span className="text-[#2563eb]">{t('landing.v5.title2', 'платит и попадает в CRM')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3b4658]">
              {t(
                'landing.v5.subtitle',
                'LinkMAX соединяет витрину услуг, мессенджеры, онлайн-запись, оплату и аналитику так, чтобы владелец видел весь путь клиента в одном месте.'
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onStart}
                className="h-12 rounded-[12px] bg-[#2563eb] px-6 text-base font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {t('landing.v5.cta_primary', 'Создать страницу бесплатно')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={onExamples}
                variant="outline"
                className="h-12 rounded-[12px] border-[#d8dee8] bg-white px-6 text-base font-semibold text-[#172033] hover:bg-[#edf1f6]"
              >
                {t('landing.v5.cta_secondary', 'Открыть примеры')}
              </Button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
                  <div className="text-2xl font-semibold tracking-tight text-[#172033]">{metric.value}</div>
                  <div className="mt-1 text-xs font-medium leading-4 text-[#6b7689]">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#d8dee8] bg-white p-3 shadow-[0_16px_40px_rgba(23,32,51,0.10)]">
            <div className="rounded-[14px] border border-[#edf1f6] bg-[#f6f7f9] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    {t('landing.v5.preview.eyebrow', 'живой контур')}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#172033]">
                    {t('landing.v5.preview.title', 'Страница, CRM и оплата вместе')}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t('landing.v5.preview.status', 'онлайн')}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
                <div className="rounded-[18px] bg-[#172033] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/70">master.linkmax</span>
                    <Sparkles className="h-4 w-4 text-blue-200" />
                  </div>
                  <div className="mt-5 rounded-[14px] bg-white/10 p-3">
                    <div className="h-24 rounded-[12px] bg-gradient-to-br from-blue-200 to-emerald-200" />
                    <div className="mt-3 h-2 w-28 rounded-full bg-white/40" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-white/20" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      t('landing.v5.bento.builder.service1', 'Консультация'),
                      t('landing.v5.bento.builder.service4', 'Разовый визит'),
                    ].map((service) => (
                      <div key={service} className="rounded-[12px] bg-white/10 p-2 text-xs font-semibold">
                        {service}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[12px] bg-white px-3 py-2 text-center text-xs font-semibold text-[#172033]">
                    {t('landing.v5.bento.builder.cta', 'Записаться на свободное время')}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {capabilities.map((item) => (
                      <div key={item.title} className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
                        <item.icon className="h-5 w-5 text-[#2563eb]" />
                        <div className="mt-3 text-sm font-semibold text-[#172033]">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-[#6b7689]">{item.body}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_0.85fr]">
                    <div className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
                          <KanbanSquare className="h-4 w-4 text-[#2563eb]" />
                          {t('landing.v5.bento.crm.pipeline', 'Воронка: 12 заявок')}
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['5', '3', '4'].map((count, index) => (
                          <div key={count} className="rounded-[12px] bg-[#f6f7f9] p-3 text-center">
                            <div className="text-lg font-semibold text-[#172033]">{count}</div>
                            <div className="mt-1 h-1.5 rounded-full bg-[#2563eb]" style={{ opacity: 0.35 + index * 0.22 }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-[#6b7689]">
                            {t('landing.v5.bento.analytics.title', 'Что сработало')}
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-[#172033]">+38%</p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="mt-4 flex h-20 items-end gap-1.5">
                        {[42, 58, 46, 74, 62, 90].map((height, index) => (
                          <div
                            key={height}
                            className={index === 5 ? 'w-full rounded-t-md bg-[#2563eb]' : 'w-full rounded-t-md bg-[#d8dee8]'}
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                        <MessageCircle className="h-5 w-5 text-[#2563eb]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">{t('landing.v5.bento.crm.notify_title', 'Новая заявка')}</p>
                        <p className="text-xs text-[#6b7689]">{t('landing.v5.bento.crm.pipeline_desc', 'Новые, в работе, оплачено')}</p>
                      </div>
                      <span className="ml-auto rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                        3-5 sec
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {capabilities.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-[18px] border border-[#d8dee8] bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eef4ff]">
                <item.icon className="h-5 w-5 text-[#2563eb]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#172033]">{item.title}</div>
                <div className="mt-1 text-sm leading-5 text-[#6b7689]">{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
