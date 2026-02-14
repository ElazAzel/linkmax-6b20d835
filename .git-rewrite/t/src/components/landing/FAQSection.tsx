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
      answer: t('landing.faq.q2.answer', 'Базовый тариф бесплатен навсегда. Premium начинается от 2 610₸/мес ($5.10) при оплате за 12 месяцев. Также доступны тарифы на 3 месяца (4 350₸/мес) и 6 месяцев (3 500₸/мес).')
    },
    {
      question: t('landing.faq.q3.question', 'Как работает AI-генерация страницы?'),
      answer: t('landing.faq.q3.answer', 'При регистрации вы выбираете свою нишу (барбер, фотограф, тренер и т.д.), и AI автоматически создаёт готовую страницу с профилем, нужными блоками и текстами, адаптированными под вашу профессию.')
    },
    {
      question: t('landing.faq.q4.question', 'Можно ли использовать свой домен?'),
      answer: t('landing.faq.q4.answer', 'Да, в Premium тарифе вы можете подключить собственный домен с SSL-сертификатом. В бесплатном тарифе ваша страница будет доступна по адресу lnkmx.my/ваше-имя.')
    },
    {
      question: t('landing.faq.q5.question', 'Как принимать оплату через страницу?'),
      answer: t('landing.faq.q5.answer', 'В Premium тарифе доступна интеграция с RoboKassa. Вы можете продавать товары, услуги и цифровые продукты прямо со своей страницы.')
    },
    {
      question: t('landing.faq.q6.question', 'Поддерживается ли мобильный редактор?'),
      answer: t('landing.faq.q6.answer', 'Да! LinkMAX создан с упором на мобильные устройства. Вы можете полноценно редактировать страницу прямо со смартфона.')
    },
    {
      question: t('landing.faq.q7.question', 'Какие блоки доступны для страницы?'),
      answer: t('landing.faq.q7.answer', 'Доступно 20+ типов блоков: профиль, ссылки, кнопки, изображения, видео, карусели, товары, прайс-листы, формы, карты, мессенджеры, отзывы, таймеры и многое другое.')
    },
    {
      question: t('landing.faq.q8.question', 'Есть ли аналитика и CRM?'),
      answer: t('landing.faq.q8.answer', 'Да, LinkMAX включает встроенную аналитику просмотров и кликов. В Premium тарифе доступна полноценная CRM без ограничений, а также Telegram-уведомления о новых лидах.')
    },
    {
      question: t('landing.faq.q9.question', 'Как оплатить Premium подписку?'),
      answer: t('landing.faq.q9.answer', 'Оплата производится через платёжную систему RoboKassa. Доступны банковские карты, электронные кошельки и другие способы оплаты.')
    },
    {
      question: t('landing.faq.q10.question', 'Какие интеграции поддерживает LinkMAX?'),
      answer: t('landing.faq.q10.answer', 'LinkMAX интегрируется с Telegram для уведомлений, RoboKassa для платежей. Также поддерживаются все социальные сети и мессенджеры.')
    },
    {
      question: t('landing.faq.q11.question', 'Берёт ли LinkMAX комиссию с продаж?'),
      answer: t('landing.faq.q11.answer', 'Нет! Мы не берём процент с ваших транзакций — 0% комиссии. Вы платите только за тариф, все деньги от продаж остаются у вас.')
    },
    {
      question: t('landing.faq.q12.question', 'Какие условия возврата средств?'),
      answer: t('landing.faq.q12.answer', 'Возврат возможен в течение 14 дней с момента оплаты, если вы не использовали платные функции. Подробнее в Пользовательском соглашении.')
    },
    {
      question: t('landing.faq.q13.question', 'Можно ли посмотреть примеры страниц?'),
      answer: t('landing.faq.q13.answer', 'Да! В нашей галерее представлены реальные страницы пользователей из разных ниш: барберы, фотографы, тренеры, психологи, магазины и другие.')
    },
    {
      question: t('landing.faq.q14.question', 'Чем LinkMAX лучше Linktree и Taplink?'),
      answer: t('landing.faq.q14.answer', 'LinkMAX предлагает AI-генерацию контента, 0% комиссии с продаж, встроенную CRM, современный дизайн и поддержку русского/казахского языков. Цены от 2 610₸/мес.')
    }
  ];

  return (
    <section ref={sectionAnimation.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
          <div 
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
          >
            <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-primary">{t('landing.faq.badge', 'Вопросы и ответы')}</span>
          </div>
          <h2 
            className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.faq.title', 'Часто задаваемые вопросы.')}
          </h2>
          <p 
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 font-normal ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            {t('landing.faq.subtitle', 'Ответы на популярные вопросы о LinkMAX')}
          </p>
        </div>

        <div 
          className={`opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '400ms' }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 px-5 sm:px-6 overflow-hidden hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left py-5 sm:py-6 hover:no-underline group">
                  <span className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors pr-2">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 sm:pb-6 leading-relaxed text-sm sm:text-base">
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
