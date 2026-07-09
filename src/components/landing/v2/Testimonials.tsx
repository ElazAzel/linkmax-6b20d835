import BriefcaseBusiness from 'lucide-react/dist/esm/icons/briefcase-business';
import CakeSlice from 'lucide-react/dist/esm/icons/cake-slice';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Scissors from 'lucide-react/dist/esm/icons/scissors';
import Users from 'lucide-react/dist/esm/icons/users';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
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
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export const Testimonials = () => {
  const { t } = useTranslation();

  const scenarios = [
    {
      title: t('landing.testimonials.name1_v2', 'Бьюти-студия на два мастера'),
      context: t('landing.testimonials.role1_v2', 'Алматы - запись и предоплата'),
      signal: t('landing.testimonials.metric1_v2', 'Свободные окна'),
      content: t(
        'landing.testimonials.review1_v2',
        'Клиент видит услуги, выбирает удобное время и оставляет предоплату. Администратор получает заявку в Telegram и сразу понимает, кто отвечает.'
      ),
      Icon: Scissors,
    },
    {
      title: t('landing.testimonials.name2_v2', 'Репетитор с набором групп'),
      context: t('landing.testimonials.role2_v2', 'Астана - формы и мессенджеры'),
      signal: t('landing.testimonials.metric2_v2', 'Единый inbox'),
      content: t(
        'landing.testimonials.review2_v2',
        'Заявки с лендинга, Instagram и WhatsApp собираются в одну ленту. Родители получают понятный следующий шаг вместо ожидания ответа в директе.'
      ),
      Icon: GraduationCap,
    },
    {
      title: t('landing.testimonials.name3_v2', 'Творческая студия'),
      context: t('landing.testimonials.role3_v2', 'Караганда - команда 4 человека'),
      signal: t('landing.testimonials.metric3_v2', 'Канбан заявок'),
      content: t(
        'landing.testimonials.review3_v2',
        'Команда работает с телефона: видно, кто взял заявку, когда ответил и в каком статусе находится клиент. Новые обращения не теряются в чатах.'
      ),
      Icon: Users,
    },
    {
      title: t('landing.testimonials.name4_v2', 'Онлайн-консультант'),
      context: t('landing.testimonials.role4_v2', 'онлайн - календарь и оплата'),
      signal: t('landing.testimonials.metric4_v2', 'Слот + платеж'),
      content: t(
        'landing.testimonials.review4_v2',
        'Витрина, расписание и оплата находятся на одной странице. Клиент сразу выбирает формат консультации.'
      ),
      Icon: BriefcaseBusiness,
    },
    {
      title: t('landing.testimonials.name5_v2', 'Домашняя кондитерская'),
      context: t('landing.testimonials.role5_v2', 'Алматы - каталог и заказ'),
      signal: t('landing.testimonials.metric5_v2', 'Заказ без переписки'),
      content: t(
        'landing.testimonials.review5_v2',
        'Позиции, сроки, варианты начинки и форма заказа собраны в одном месте. В переписку попадают уже уточнения, а не базовые вопросы.'
      ),
      Icon: CakeSlice,
    },
    {
      title: t('landing.testimonials.name6_v2', 'Сервисная команда'),
      context: t('landing.testimonials.role6_v2', 'Шымкент - выездные услуги'),
      signal: t('landing.testimonials.metric6_v2', 'Статус работы'),
      content: t(
        'landing.testimonials.review6_v2',
        'Заявка проходит понятные этапы: новая, в работе, оплачено, закрыто. Клиенту проще объяснить следующий шаг, а менеджеру - не потерять задачу.'
      ),
      Icon: Wrench,
    },
  ];

  return (
    <SectionWrapper className="bg-[#f6f7f9] py-20 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.7fr_1fr] lg:items-end">
          <Reveal>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                {t('landing.testimonials.title_v2', 'Рабочие сценарии')}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172033] md:text-[42px] md:leading-[1.12]">
                {t('landing.testimonials.highlight_v2', 'для услуг')}
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="max-w-2xl text-base leading-7 text-[#6b7689] lg:justify-self-end">
              {t(
                'landing.testimonials.subtitle_v2',
                'Показываем, какие задачи закрывает LinkMAX до того, как вам понадобится тяжелая CRM или набор разрозненных сервисов.'
              )}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario, index) => (
            <Reveal key={scenario.title} delay={index * 60}>
              <article className="flex h-full flex-col rounded-[18px] border border-[#d8dee8] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#2563eb]/40 hover:shadow-[0_16px_40px_rgba(23,32,51,0.10)]">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#eef4ff]">
                    <scenario.Icon className="h-5 w-5 text-[#2563eb]" />
                  </div>
                  <span className="rounded-full bg-[#f6f7f9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b4658]">
                    {scenario.signal}
                  </span>
                </div>

                <p className="text-sm leading-6 text-[#3b4658]">{scenario.content}</p>

                <div className="mt-auto border-t border-[#edf1f6] pt-5">
                  <div className="text-sm font-semibold text-[#172033]">{scenario.title}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7689]">{scenario.context}</div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
