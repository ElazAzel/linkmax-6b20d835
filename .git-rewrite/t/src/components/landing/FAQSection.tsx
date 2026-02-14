import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';

export function FAQSection() {
  const { t } = useTranslation();
  const sectionAnimation = useScrollAnimation();

  const faqItems = [
    {
      question: t('landing.faq.q1.question', 'Что такое LinkMAX и для чего он нужен?'),
      answer: t('landing.faq.q1.answer', 'LinkMAX — это AI-конструктор страниц link-in-bio, который позволяет создать мини-сайт за 2 минуты. Идеально подходит для экспертов, фрилансеров и бизнеса, чтобы объединить все ссылки, соцсети и контактные данные в одном месте.')
    },
    {
      question: t('landing.faq.q2.question', 'Сколько стоит использование LinkMAX?'),
      answer: t('landing.faq.q2.answer', 'Базовый тариф бесплатен навсегда и включает неограниченные ссылки, базовые блоки и 3 AI-запроса в день. Премиум тарифы начинаются от $2.50/месяц при годовой оплате и открывают доступ к профессиональным темам, аналитике, CRM и безлимитному AI.')
    },
    {
      question: t('landing.faq.q3.question', 'Как работает AI-генерация страницы?'),
      answer: t('landing.faq.q3.answer', 'При регистрации вы выбираете свою нишу (барбер, фотограф, тренер и т.д.), и AI автоматически создаёт готовую страницу с профилем, нужными блоками и текстами, адаптированными под вашу профессию. Всё это занимает около 30 секунд.')
    },
    {
      question: t('landing.faq.q4.question', 'Можно ли использовать свой домен?'),
      answer: t('landing.faq.q4.answer', 'Да, в тарифе Business вы можете подключить собственный домен с SSL-сертификатом. В бесплатном и Pro тарифах ваша страница будет доступна по адресу linkmax.app/ваше-имя.')
    },
    {
      question: t('landing.faq.q5.question', 'Как принимать оплату через страницу?'),
      answer: t('landing.faq.q5.answer', 'В тарифе Business доступна интеграция с Stripe и Kaspi Pay. Вы можете продавать товары, услуги и цифровые продукты прямо со своей страницы, получать уведомления о платежах и отслеживать их в CRM.')
    },
    {
      question: t('landing.faq.q6.question', 'Поддерживается ли мобильный редактор?'),
      answer: t('landing.faq.q6.answer', 'Да! LinkMAX создан с упором на мобильные устройства. Вы можете полноценно редактировать страницу прямо со смартфона — добавлять блоки, менять дизайн, просматривать аналитику и управлять лидами.')
    },
    {
      question: t('landing.faq.q7.question', 'Какие блоки доступны для страницы?'),
      answer: t('landing.faq.q7.answer', 'Доступно 20+ типов блоков: профиль, ссылки, кнопки, изображения, видео, карусели, товары, прайс-листы, формы, карты, мессенджеры, отзывы, таймеры и многое другое. Premium-блоки открываются в платных тарифах.')
    },
    {
      question: t('landing.faq.q8.question', 'Есть ли аналитика и CRM?'),
      answer: t('landing.faq.q8.answer', 'Да, LinkMAX включает встроенную аналитику просмотров и кликов. В Pro тарифе доступен мини-CRM до 100 лидов/месяц с Telegram-уведомлениями, а в Business — полноценная CRM без ограничений.')
    }
  ];

  return (
    <section ref={sectionAnimation.ref} className="py-20 sm:py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.faq.badge', 'Вопросы и ответы')}</span>
          </div>
          <h2 
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.faq.title', 'Часто задаваемые вопросы')}
          </h2>
          <p 
            className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            {t('landing.faq.subtitle', 'Ответы на популярные вопросы о LinkMAX')}
          </p>
        </div>

        <div 
          className={`opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '400ms' }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 px-6 overflow-hidden hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left py-5 hover:no-underline group">
                  <span className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
