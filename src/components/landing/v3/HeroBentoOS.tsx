import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  CreditCard,
  KanbanSquare,
  Send,
  Sparkles,
} from 'lucide-react';

interface HeroBentoOSProps {
  onStart: () => void;
  onExamples: () => void;
}

/**
 * LinkMAX Landing Hero + Bento.
 * Keeps the first screen product-specific: site, booking, payments, Telegram, CRM.
 */
export function HeroBentoOS({ onStart, onExamples }: HeroBentoOSProps) {
  const { t } = useTranslation();

  return (
    <section
      className="relative min-h-screen bg-[#fafbfc] pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-700/10 mb-6">
            {t('landing.v5.badge', 'Для услуг, экспертов и небольших команд')}
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t('landing.v5.title1', 'Сайт, где клиент записывается')}{' '}
            <br className="hidden md:block" />
            <span className="text-blue-600">{t('landing.v5.title2', 'платит и попадает в CRM')}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10">
            {t(
              'landing.v5.subtitle',
              'LinkMAX собирает страницу, заявки из форм и мессенджеров, онлайн-запись, оплату и аналитику в одном рабочем контуре.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={onStart}
              className="px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base shadow-lg shadow-blue-200/50"
            >
              {t('landing.v5.cta_primary', 'Создать страницу бесплатно')}
            </Button>
            <Button
              onClick={onExamples}
              variant="outline"
              className="px-8 py-6 h-auto bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl text-base border-slate-200"
            >
              {t('landing.v5.cta_secondary', 'Открыть примеры')}
            </Button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[180px]">
          {/* Service storefront */}
          <div className="md:col-span-8 md:row-span-2 rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between overflow-hidden relative group min-h-[320px]">
            <div className="relative z-10">
              <h2
                className="text-2xl font-bold text-slate-900 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {t('landing.v5.bento.builder.title', 'Витрина услуг без пустых блоков')}
              </h2>
              <p className="text-slate-500 max-w-xs">
                {t(
                  'landing.v5.bento.builder.desc',
                  'Покажите услуги, расписание, цены и форму заявки так, как это нужно клиенту перед записью.'
                )}
              </p>
            </div>
            <div className="hidden md:block absolute bottom-0 right-0 w-2/3 h-2/3 bg-slate-50 rounded-tl-3xl border-t border-l border-slate-200 translate-y-4 translate-x-4 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform">
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-3 w-28 bg-slate-300 rounded" />
                    <div className="h-2 w-20 bg-slate-200 rounded mt-2" />
                  </div>
                  <div className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700">
                    {t('landing.v5.bento.builder.badge', 'запись открыта')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    t('landing.v5.bento.builder.service1', 'Консультация'),
                    t('landing.v5.bento.builder.service2', 'Диагностика'),
                    t('landing.v5.bento.builder.service3', 'Абонемент'),
                    t('landing.v5.bento.builder.service4', 'Разовый визит'),
                  ].map((service) => (
                    <div key={service} className="rounded-xl bg-white border border-slate-200 p-3">
                      <div className="text-xs font-semibold text-slate-800">{service}</div>
                      <div className="mt-2 h-2 w-16 rounded bg-blue-100" />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-sm">
                  {t('landing.v5.bento.builder.cta', 'Записаться на свободное время')}
                </div>
              </div>
            </div>

            {/* Mobile compact service chips (no clipping) */}
            <div className="md:hidden mt-6 grid grid-cols-2 gap-2 relative z-10">
              {[
                t('landing.v5.bento.builder.service1', 'Консультация'),
                t('landing.v5.bento.builder.service2', 'Диагностика'),
                t('landing.v5.bento.builder.service3', 'Абонемент'),
                t('landing.v5.bento.builder.service4', 'Разовый визит'),
              ].map((service) => (
                <div key={service} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 text-center">
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Draft generator */}
          <div className="md:col-span-4 md:row-span-1 rounded-3xl bg-slate-900 p-6 flex flex-col justify-center text-white relative overflow-hidden min-h-[180px]">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {t('landing.v5.bento.ai.eyebrow', 'Черновик страницы')}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-1">
                {t('landing.v5.bento.ai.title', 'Структура за пару минут')}
              </h2>
              <p className="text-slate-400 text-sm">
                {t('landing.v5.bento.ai.desc', 'Опишите нишу - получите основу, которую можно сразу править руками.')}
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20">
              <Sparkles className="w-24 h-24" />
            </div>
          </div>

          {/* Local payments */}
          <div className="md:col-span-4 md:row-span-1 rounded-3xl bg-white border border-slate-200 p-6 flex items-center justify-between overflow-hidden min-h-[180px]">
            <div>
              <h2
                className="text-lg font-bold text-slate-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {t('landing.v5.bento.pay.title', 'Оплата до визита')}
              </h2>
              <p className="text-slate-500 text-sm">
                {t('landing.v5.bento.pay.desc', 'Kaspi QR, Robokassa, Stripe')}
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="inline-flex items-center justify-end gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                <CreditCard className="h-3.5 w-3.5" />
                Kaspi QR
              </div>
              <div className="inline-flex items-center justify-end rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                Robokassa
              </div>
              <div className="inline-flex items-center justify-end rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                Stripe
              </div>
            </div>
          </div>

          {/* Mini-CRM & Telegram */}
          <div className="md:col-span-5 md:row-span-2 rounded-3xl bg-[#e8ecf1] p-8 flex flex-col relative overflow-hidden min-h-[320px]">
            <div className="mb-4">
              <h2
                className="text-2xl font-bold text-slate-900 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {t('landing.v5.bento.crm.title', 'Заявки и статусы')}
              </h2>
              <p className="text-slate-600">
                {t(
                  'landing.v5.bento.crm.desc',
                  'Формы, мессенджеры и бронирования попадают в одну ленту. Telegram сообщает о новых клиентах сразу.'
                )}
              </p>
            </div>
            <div className="mt-auto space-y-2">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-300/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {t('landing.v5.bento.crm.notify_title', 'Новая заявка')}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {t('landing.v5.bento.crm.notify_desc', 'Анна - запись на 14:00')}
                  </p>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 border border-slate-300/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <KanbanSquare className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {t('landing.v5.bento.crm.pipeline', 'Воронка: 12 заявок')}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {t('landing.v5.bento.crm.pipeline_desc', 'Новые, в работе, оплачено')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="md:col-span-7 md:row-span-2 rounded-3xl bg-white border border-slate-200 p-8 flex flex-col min-h-[320px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2
                  className="text-2xl font-bold text-slate-900 mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {t('landing.v5.bento.analytics.title', 'Что сработало')}
                </h2>
                <p className="text-slate-500">
                  {t(
                    'landing.v5.bento.analytics.desc',
                    'Видно, какие блоки, источники и услуги приводят заявки.'
                  )}
                </p>
              </div>
              <div className="text-right">
                <BarChart3 className="ml-auto h-6 w-6 text-green-500" />
                <p className="text-[10px] text-slate-400">
                  {t('landing.v5.bento.analytics.week', 'по дням')}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-2">
              {[40, 60, 90, 70, 50, 85, 45].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-lg ${i === 2 ? 'bg-blue-500' : 'bg-slate-100'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
