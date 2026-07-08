import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Send from 'lucide-react/dist/esm/icons/send';
import Kanban from 'lucide-react/dist/esm/icons/kanban-square';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function BentoGridSection() {
  const { t } = useTranslation();

  const items = [
    {
      title: t('landing.v5.bento.builder.title', 'Витрина услуг без пустых блоков'),
      description: t(
        'landing.v5.bento.builder.desc',
        'Покажите услуги, расписание, цены и форму заявки так, как это нужно клиенту перед записью.'
      ),
      icon: Smartphone,
      className: 'lg:col-span-2',
      visual: <ServicePreview />,
    },
    {
      title: t('landing.v5.bento.ai.title', 'Структура за пару минут'),
      description: t('landing.v5.bento.ai.desc', 'Опишите нишу - получите основу, которую можно сразу править руками.'),
      icon: Sparkles,
      visual: <TextLines accent />,
    },
    {
      title: t('landing.v5.bento.crm.title', 'Заявки и статусы'),
      description: t(
        'landing.v5.bento.crm.desc',
        'Формы, мессенджеры и бронирования попадают в одну ленту. Telegram сообщает о новых клиентах сразу.'
      ),
      icon: Send,
      visual: <InboxPreview />,
    },
    {
      title: t('landing.bento.bookingTitle_v2', 'Онлайн-запись и оплата'),
      description: t(
        'landing.bento.bookingDesc_v2',
        'Клиент бронирует слот и платит сразу. Robokassa и Kaspi QR подключены из коробки.'
      ),
      icon: Calendar,
      className: 'lg:col-span-2',
      visual: <BookingPreview />,
    },
    {
      title: t('landing.bento.crmTitle_v2', 'Мини-CRM для команды'),
      description: t(
        'landing.bento.crmDesc_v2',
        'Канбан со сделками, ответственный за каждую заявку и история переписки.'
      ),
      icon: Kanban,
      visual: <PipelinePreview />,
    },
    {
      title: t('landing.v5.bento.analytics.title', 'Что сработало'),
      description: t('landing.v5.bento.analytics.desc', 'Видно, какие блоки, источники и услуги приводят заявки.'),
      icon: BarChart3,
      className: 'lg:col-span-2',
      visual: <AnalyticsPreview />,
    },
  ];

  return (
    <SectionWrapper id="features" className="bg-[#f6f7f9] py-20 md:py-24">
      <Reveal>
        <SectionHeading
          title={t('landing.bento.sectionTitle_v2', 'Шесть инструментов вместо десяти подписок')}
          subtitle={t(
            'landing.bento.sectionDesc_v2',
            'Витрина, мессенджеры, inbox, бронирование, оплата и аналитика - без интеграций и Zapier.'
          )}
          className="mb-12"
          titleClassName="text-[#172033]"
        />
      </Reveal>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.title} delay={index * 70}>
            <article
              className={`flex h-full min-h-[320px] flex-col justify-between rounded-[18px] border border-[#d8dee8] bg-white p-5 shadow-[0_1px_0_rgba(23,32,51,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#2563eb]/40 hover:shadow-[0_16px_40px_rgba(23,32,51,0.10)] ${item.className ?? ''}`}
            >
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#eef4ff]">
                  <item.icon className="h-5 w-5 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#172033]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7689]">{item.description}</p>
              </div>
              <div className="mt-6">{item.visual}</div>
            </article>
          </Reveal>
        ))}
      </div>
    </SectionWrapper>
  );
}

function ServicePreview() {
  return (
    <div className="rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {['Consultation', 'Diagnostics', 'Subscription', 'Visit'].map((label, index) => (
          <div key={label} className="rounded-[12px] border border-[#d8dee8] bg-white p-3">
            <div className="text-xs font-semibold text-[#172033]">{label}</div>
            <div className="mt-3 h-2 w-16 rounded-full bg-[#eef4ff]" />
            <div className="mt-2 h-2 w-10 rounded-full bg-[#d8dee8]" style={{ opacity: 0.6 + index * 0.08 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TextLines({ accent = false }: { accent?: boolean }) {
  return (
    <div className="rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7689]">AI Builder</span>
      </div>
      {[100, 72, 88, 54].map((width, index) => (
        <div
          key={width}
          className={accent && index === 1 ? 'mb-2 h-2 rounded-full bg-[#2563eb]' : 'mb-2 h-2 rounded-full bg-[#d8dee8]'}
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

function InboxPreview() {
  return (
    <div className="space-y-2 rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-3">
      {[
        ['Telegram', 'New booking', '#2563eb'],
        ['WhatsApp', 'Price request', '#16a34a'],
        ['Form', 'Callback', '#f59e0b'],
      ].map(([source, title, color]) => (
        <div key={source} className="flex items-center gap-3 rounded-[12px] border border-[#d8dee8] bg-white p-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <div>
            <div className="text-xs font-semibold text-[#172033]">{title}</div>
            <div className="text-[11px] text-[#6b7689]">{source}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingPreview() {
  return (
    <div className="grid gap-3 rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-3 sm:grid-cols-3">
      {['10:00', '12:30', '15:00'].map((time, index) => (
        <div key={time} className="rounded-[12px] border border-[#d8dee8] bg-white p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
            {time}
            {index === 1 ? <CreditCard className="h-4 w-4 text-[#16a34a]" /> : <Calendar className="h-4 w-4 text-[#2563eb]" />}
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#edf1f6]">
            <div className="h-2 rounded-full bg-[#2563eb]" style={{ width: `${50 + index * 18}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PipelinePreview() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-3">
      {[
        ['New', 5],
        ['Active', 3],
        ['Paid', 8],
      ].map(([label, count]) => (
        <div key={label} className="rounded-[12px] border border-[#d8dee8] bg-white p-3 text-center">
          <div className="text-lg font-semibold text-[#172033]">{count}</div>
          <div className="mt-1 text-[11px] font-medium text-[#6b7689]">{label}</div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="rounded-[18px] border border-[#edf1f6] bg-[#f6f7f9] p-4">
      <div className="flex h-28 items-end gap-2">
        {[40, 68, 52, 88, 64, 94, 74].map((height, index) => (
          <div
            key={height}
            className={index === 5 ? 'w-full rounded-t-md bg-[#2563eb]' : 'w-full rounded-t-md bg-[#d8dee8]'}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
