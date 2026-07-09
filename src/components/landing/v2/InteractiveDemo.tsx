import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import User from 'lucide-react/dist/esm/icons/user';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { cn } from '@/lib/utils/utils';

type DemoStep = {
  title: string;
  description: string;
  icon: ReactNode;
  panel: ReactNode;
};

export const InteractiveDemo = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const steps: DemoStep[] = [
    {
      title: t('landing.demo.step1Title', 'Выберите нишу'),
      description: t(
        'landing.demo.step1Desc',
        'Скажите AI, чем занимаетесь. Бьюти, фитнес, репетитор - AI понимает вашу специфику.'
      ),
      icon: <User className="h-5 w-5" />,
      panel: <NichePanel />,
    },
    {
      title: t('landing.demo.step2Title', 'AI собирает страницу'),
      description: t(
        'landing.demo.step2Desc',
        'Прайс, описание, контакты - все генерируется за секунды. Без дизайнера и кода.'
      ),
      icon: <Zap className="h-5 w-5" />,
      panel: <BuilderPanel />,
    },
    {
      title: t('landing.demo.step3Title', 'Клиенты пишут вам'),
      description: t(
        'landing.demo.step3Desc',
        'Клиент нажимает кнопку на странице - вам приходит уведомление в Telegram. Закрываете сделку мгновенно.'
      ),
      icon: <MessageSquare className="h-5 w-5" />,
      panel: <LeadPanel />,
    },
  ];

  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172033] md:text-[42px] md:leading-[1.12]">
              {t('landing.demo.title', 'Как это работает')}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-[#6b7689] lg:justify-self-end">
            {t(
              'landing.bento.sectionDesc_v2',
              'Витрина, мессенджеры, inbox, бронирование, оплата и аналитика - без интеграций и Zapier.'
            )}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                onMouseEnter={() => setActiveStep(index)}
                className={cn(
                  'w-full rounded-[18px] border p-4 text-left transition-all',
                  activeStep === index
                    ? 'border-[#2563eb] bg-[#eef4ff] shadow-[0_16px_40px_rgba(23,32,51,0.10)]'
                    : 'border-[#d8dee8] bg-[#f6f7f9] hover:border-[#2563eb]/40'
                )}
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]',
                      activeStep === index ? 'bg-[#2563eb] text-white' : 'bg-white text-[#2563eb]'
                    )}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#172033]">
                      {index + 1}. {step.title}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#6b7689]">{step.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[18px] border border-[#d8dee8] bg-[#f6f7f9] p-4 shadow-[0_16px_40px_rgba(23,32,51,0.10)]">
            <div className="rounded-[14px] border border-[#edf1f6] bg-white p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7689]">LinkMAX Studio</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#172033]">{steps[activeStep].title}</h3>
                </div>
                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {activeStep + 1}/3
                </span>
              </div>
              {steps[activeStep].panel}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function NichePanel() {
  const { t } = useTranslation();
  const items = [
    t('landing.demo.nicheBeauty', 'Бьюти-мастер'),
    t('landing.demo.nicheFitness', 'Фитнес-тренер'),
    t('landing.demo.nicheTutor', 'Репетитор'),
    t('landing.demo.nicheFood', 'Кондитер'),
    t('landing.demo.nichePhoto', 'Фотограф'),
    t('landing.demo.nicheCoach', 'Коуч / Эксперт'),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item}
          className={cn(
            'rounded-[14px] border p-4 text-sm font-semibold',
            index === 0 ? 'border-[#2563eb] bg-[#eef4ff] text-[#2563eb]' : 'border-[#d8dee8] bg-[#f6f7f9] text-[#3b4658]'
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function BuilderPanel() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <div className="rounded-[18px] bg-[#172033] p-4 text-white">
        <div className="text-xs font-semibold text-white/60">{t('landing.demo.aiGenerating', 'AI генерирует...')}</div>
        <div className="mt-4 h-28 rounded-[14px] bg-gradient-to-br from-blue-200 to-emerald-200" />
        <div className="mt-4 space-y-2">
          <div className="h-2 w-3/4 rounded-full bg-white/45" />
          <div className="h-2 w-1/2 rounded-full bg-white/25" />
          <div className="h-9 rounded-[12px] bg-white text-center text-xs font-semibold leading-9 text-[#172033]">
            {t('landing.v5.bento.builder.cta', 'Записаться на свободное время')}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {[
          t('landing.v5.bento.builder.service1', 'Консультация'),
          t('landing.v5.bento.builder.service2', 'Диагностика'),
          t('landing.v5.bento.builder.service3', 'Абонемент'),
        ].map((label) => (
          <div key={label} className="rounded-[14px] border border-[#d8dee8] bg-[#f6f7f9] p-4">
            <div className="text-sm font-semibold text-[#172033]">{label}</div>
            <div className="mt-3 h-2 w-24 rounded-full bg-[#d8dee8]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadPanel() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <div className="space-y-3">
        <div className="ml-auto max-w-[80%] rounded-[18px] rounded-br-[6px] bg-[#2563eb] p-4 text-sm font-medium text-white">
          {t('landing.demo.chatMsg1', 'Здравствуйте! Хочу записаться на маникюр')}
        </div>
        <div className="max-w-[80%] rounded-[18px] rounded-bl-[6px] bg-[#eef4ff] p-4 text-sm font-medium text-[#172033]">
          {t('landing.demo.chatMsg2', 'Отлично! Запишу вас на завтра 15:00')}
        </div>
        <div className="flex items-center gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="text-sm font-semibold text-emerald-700">{t('landing.demo.leadCaptured', 'Новая заявка получена')}</div>
        </div>
      </div>
      <div className="rounded-[18px] border border-[#d8dee8] bg-[#f6f7f9] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7689]">CRM</p>
        <div className="mt-4 space-y-2">
          {['New', 'Contacted', 'Paid'].map((status, index) => (
            <div key={status} className="rounded-[12px] bg-white p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                {status}
                <span>{[5, 3, 8][index]}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[#edf1f6]">
                <div className="h-1.5 rounded-full bg-[#2563eb]" style={{ width: `${42 + index * 22}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
