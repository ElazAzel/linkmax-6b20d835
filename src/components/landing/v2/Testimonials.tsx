import BriefcaseBusiness from 'lucide-react/dist/esm/icons/briefcase-business';
import CakeSlice from 'lucide-react/dist/esm/icons/cake-slice';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Scissors from 'lucide-react/dist/esm/icons/scissors';
import Users from 'lucide-react/dist/esm/icons/users';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { SectionWrapper } from '@/components/shared/SectionWrapper';

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)', transition: `all 0.5s ease ${delay}ms` }}>
            {children}
        </div>
    );
}

export const Testimonials = () => {
    const { t } = useTranslation();

    const scenarios = [
        {
            title: t('landing.testimonials.name1_v2', 'Бьюти-студия на два мастера'),
            context: t('landing.testimonials.role1_v2', 'Алматы · запись и предоплата'),
            signal: t('landing.testimonials.metric1_v2', 'Свободные окна'),
            content: t('landing.testimonials.review1_v2', 'Клиент видит услуги, выбирает удобное время и оставляет предоплату. Администратор получает заявку в Telegram и сразу понимает, кто отвечает.'),
            Icon: Scissors,
        },
        {
            title: t('landing.testimonials.name2_v2', 'Репетитор с набором групп'),
            context: t('landing.testimonials.role2_v2', 'Астана · формы и мессенджеры'),
            signal: t('landing.testimonials.metric2_v2', 'Единый inbox'),
            content: t('landing.testimonials.review2_v2', 'Заявки с лендинга, Instagram и WhatsApp собираются в одну ленту. Родители получают понятный следующий шаг вместо ожидания ответа в директе.'),
            Icon: GraduationCap,
        },
        {
            title: t('landing.testimonials.name3_v2', 'Творческая студия'),
            context: t('landing.testimonials.role3_v2', 'Караганда · команда 4 человека'),
            signal: t('landing.testimonials.metric3_v2', 'Канбан заявок'),
            content: t('landing.testimonials.review3_v2', 'Команда работает с телефона: видно, кто взял заявку, когда ответил и в каком статусе находится клиент. Новые обращения не растворяются в чатах.'),
            Icon: Users,
        },
        {
            title: t('landing.testimonials.name4_v2', 'Онлайн-консультант'),
            context: t('landing.testimonials.role4_v2', 'онлайн · календарь и оплата'),
            signal: t('landing.testimonials.metric4_v2', 'Слот + платеж'),
            content: t('landing.testimonials.review4_v2', 'Витрина, расписание и оплата находятся на одной странице. Клиент не прыгает между ссылками, а сразу выбирает формат консультации.'),
            Icon: BriefcaseBusiness,
        },
        {
            title: t('landing.testimonials.name5_v2', 'Домашняя кондитерская'),
            context: t('landing.testimonials.role5_v2', 'Алматы · каталог и заказ'),
            signal: t('landing.testimonials.metric5_v2', 'Заказ без переписки'),
            content: t('landing.testimonials.review5_v2', 'Позиции, сроки, варианты начинки и форма заказа собраны в одном месте. В переписку попадают уже уточнения, а не базовые вопросы.'),
            Icon: CakeSlice,
        },
        {
            title: t('landing.testimonials.name6_v2', 'Сервисная команда'),
            context: t('landing.testimonials.role6_v2', 'Шымкент · выездные услуги'),
            signal: t('landing.testimonials.metric6_v2', 'Статус работы'),
            content: t('landing.testimonials.review6_v2', 'Заявка проходит понятные этапы: новая, в работе, оплачено, закрыто. Клиенту проще объяснить следующий шаг, а менеджеру - не потерять задачу.'),
            Icon: Wrench,
        },
    ];

    return (
        <SectionWrapper className="overflow-hidden z-10 bg-transparent">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="container px-4 mx-auto relative">
                <Reveal>
                    <h2 className="text-section-title text-center mb-4">
                        {t('landing.testimonials.title_v2', 'Рабочие сценарии')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.testimonials.highlight_v2', 'для услуг')}</span>
                    </h2>
                </Reveal>
                <Reveal delay={100}>
                    <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
                        {t('landing.testimonials.subtitle_v2', 'Показываем, какие задачи закрывает LinkMAX до того, как вам понадобится тяжелая CRM или набор разрозненных сервисов.')}
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10">
                    {scenarios.map((scenario, i) => (
                        <Reveal key={i} delay={i * 80}>
                            <div className="glass border-white/10 rounded-2xl sm:rounded-[2rem] p-6 sm:p-7 flex flex-col gap-4 transition-all duration-700 hover:-translate-y-2 hover:bg-white/10 shadow-glass-lg group h-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="flex items-start justify-between gap-3 relative">
                                    <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
                                        <scenario.Icon className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                                        {scenario.signal}
                                    </span>
                                </div>

                                <p className="text-sm md:text-base leading-relaxed text-foreground/85 font-medium relative">
                                    {scenario.content}
                                </p>

                                <div className="flex items-center gap-3 mt-auto relative pt-4 border-t border-white/5">
                                    <div>
                                        <div className="text-sm font-bold tracking-tight text-foreground">{scenario.title}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/70">{scenario.context}</div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};
