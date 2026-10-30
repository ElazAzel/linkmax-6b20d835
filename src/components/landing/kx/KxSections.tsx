import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { getLandingFaq } from '@/lib/seo/landing-head';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Check from 'lucide-react/dist/esm/icons/check';
import Play from 'lucide-react/dist/esm/icons/play';
import { ClaimForm, KxMark, Reveal } from './primitives';
import { LANDING_DEMO_MEDIA as DEMO_MEDIA } from '@/lib/demo-media';

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

function SectionHead({ title, sub, id }: { title: string; sub?: string; id: string }) {
  return (
    <Reveal className="mb-10 grid gap-4 md:mb-14 md:grid-cols-[1.1fr_.9fr] md:items-end">
      <h2 id={id} className="kx-display text-[34px] sm:text-[48px] lg:text-[60px]">{title}</h2>
      {sub && <p className="max-w-[30rem] text-lg leading-relaxed text-[var(--kx-muted)]">{sub}</p>}
    </Reveal>
  );
}

/* ---------- What you can build ---------- */

export function KxBuild() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-32" aria-labelledby="kx-build">
      <div className="kx-wrap">
        <SectionHead
          id="kx-build"
          title={t('landing.kx.build.title', 'Не мультиссылка. Целый сайт.')}
          sub={t('landing.kx.build.sub', 'Блоки складываются в сетку, как у дизайнера. Только дизайнер тут ты, и уходит на это один вечер.')}
        />
        <div className="kx-bento">
          <Reveal className="kx-card kx-span-2" delay={0}>
            <div className="grid grid-cols-4 gap-2" aria-hidden="true">
              {['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'].map((slot, i) => (
                <span key={slot} className="kx-slot" data-pick={i === 2 || i === 5 ? '' : undefined} style={v({ '--d': `${i === 5 ? 2.4 : 0}s` })}>{slot}</span>
              ))}
            </div>
            <div>
              <h3>{t('landing.kx.build.booking', 'Онлайн-запись')}</h3>
              <p>{t('landing.kx.build.bookingText', 'Услуги, свободные окна и предоплата. Одно время не продашь дважды.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card" delay={80}>
            <div className="kx-money" aria-hidden="true"><span>+</span>12 000 ₸</div>
            <div>
              <h3>{t('landing.kx.build.pay', 'Оплата')}</h3>
              <p>{t('landing.kx.build.payText', 'Карта, предоплата, счёт. Деньги приходят, пока ты спишь.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card kx-row-2" delay={160}>
            <div className="flex flex-col gap-2" aria-hidden="true">
              <span className="kx-bubble" style={v({ '--d': '0s' })}>{t('landing.kx.build.msg1', 'Здравствуйте! Есть окно в пятницу?')}</span>
              <span className="kx-bubble" style={v({ '--d': '.8s' })}>{t('landing.kx.build.msg2', 'Заявка: маникюр, пт 13:00')}</span>
              <span className="kx-bubble" style={v({ '--d': '1.6s' })}>{t('landing.kx.build.msg3', 'Оплачено 8 000 ₸')}</span>
            </div>
            <div>
              <h3>{t('landing.kx.build.leads', 'Заявки в Telegram')}</h3>
              <p>{t('landing.kx.build.leadsText', 'Каждая заявка сразу в мессенджере и в карточке клиента. Ничего не теряется в директе.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card" delay={0}>
            <div className="kx-shuffle flex gap-2" aria-hidden="true">
              {[DEMO_MEDIA.wedding, DEMO_MEDIA.portrait, DEMO_MEDIA.nails].map((image, i) => (
                <img key={image} src={image} alt="" width={120} height={160} loading="lazy" className="h-24 min-w-0 flex-1 rounded-2xl object-cover" style={v({ '--d': `${i * 0.25}s`, '--r': `${(i - 1) * 4}deg` })} />
              ))}
            </div>
            <div>
              <h3>{t('landing.kx.build.gallery', 'Портфолио')}</h3>
              <p>{t('landing.kx.build.galleryText', 'Фото, видео, кейсы. Сетка 2 колонки, как в Pinterest, только твоя.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card" delay={80}>
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="kx-pulse grid h-12 w-12 place-items-center rounded-full bg-[var(--kx-accent)] text-black"><Play className="h-5 w-5 fill-current" /></span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--kx-surface-2)]"><span className="kx-type block h-full bg-[var(--kx-text)]" style={{ animationDuration: '8s' }} /></span>
            </div>
            <div>
              <h3>{t('landing.kx.build.video', 'Видео')}</h3>
              <p>{t('landing.kx.build.videoText', 'YouTube и Vimeo: вставляешь ссылку, плеер появляется сам.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card" delay={160}>
            <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 1].map((h, i) => (
                <span key={i} className="kx-bar" data-hot={i === 5 ? '' : undefined} style={v({ '--d': `${i * 0.15}s`, height: `${h * 100}%` })} />
              ))}
            </div>
            <div>
              <h3>{t('landing.kx.build.stats', 'Аналитика')}</h3>
              <p>{t('landing.kx.build.statsText', 'Сколько зашло, куда нажали, откуда пришли заявки.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card kx-span-2" delay={0}>
            <div className="text-[15px] text-[var(--kx-muted)]" aria-hidden="true">
              <span className="kx-type">{t('landing.kx.build.aiPrompt', 'Я мастер маникюра в Алматы')}</span><span className="kx-caret" />
            </div>
            <div>
              <h3>{t('landing.kx.build.ai', 'AI соберёт черновик')}</h3>
              <p>{t('landing.kx.build.aiText', 'Опиши себя одной фразой: тексты, услуги и структура появятся за минуту. Дальше правишь пальцем.')}</p>
            </div>
          </Reveal>

          <Reveal className="kx-card kx-span-2" delay={80}>
            <div className="kx-display text-[26px]" aria-hidden="true">
              <span className="text-[var(--kx-dim)]">https://</span>you<span className="text-[var(--kx-accent)]">.kz</span>
            </div>
            <div>
              <h3>{t('landing.kx.build.seo', 'Видно в поиске и нейросетях')}</h3>
              <p>{t('landing.kx.build.seoText', 'Страница сразу читается Google, Яндексом и ChatGPT. На PRO можно подключить свой домен.')}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Steps ---------- */

export function KxSteps() {
  const { t } = useTranslation();
  const steps = [
    { title: t('landing.kx.steps.s1', 'Займи адрес'), text: t('landing.kx.steps.s1Text', 'lnkmx.my/твоё-имя. Короткий и твой, пока не занял кто-то другой.') },
    { title: t('landing.kx.steps.s2', 'Расскажи о себе'), text: t('landing.kx.steps.s2Text', 'Пара ответов, и AI собирает страницу. Меняй блоки, цвета и шрифты как хочешь.') },
    { title: t('landing.kx.steps.s3', 'Поставь в био'), text: t('landing.kx.steps.s3Text', 'Instagram, TikTok, Telegram, 2ГИС. Дальше заявки идут сами.') },
  ];
  return (
    <section className="border-y border-[var(--kx-line)] py-20 md:py-28" aria-labelledby="kx-steps">
      <div className="kx-wrap">
        <SectionHead id="kx-steps" title={t('landing.kx.steps.title', 'Три шага. Серьёзно.')} />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} className="kx-step" delay={i * 100}>
              <span className="kx-step-num" aria-hidden="true">0{i + 1}</span>
              <h3 className="kx-display mt-5 text-[26px]">{step.title}</h3>
              <p className="mt-3 max-w-[22rem] text-[var(--kx-muted)]">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */

export function KxPricing({ onStart, onPricing }: { onStart: () => void; onPricing: () => void }) {
  const { t } = useTranslation();
  const free = [
    t('landing.kx.price.f1', 'Страница и все блоки'),
    t('landing.kx.price.f2', 'Заявки и мини-CRM'),
    t('landing.kx.price.f3', 'Приём оплат, комиссия 7%'),
    t('landing.kx.price.f4', 'Без водяного знака'),
  ];
  const pro = [
    t('landing.kx.price.p1', 'Комиссия 1% вместо 7%'),
    t('landing.kx.price.p2', 'Свой домен'),
    t('landing.kx.price.p3', 'Расширенная аналитика'),
    t('landing.kx.price.p4', 'AI-генерации каждый месяц'),
  ];
  return (
    <section className="py-20 md:py-32" aria-labelledby="kx-price">
      <div className="kx-wrap">
        <SectionHead
          id="kx-price"
          title={t('landing.kx.price.title', 'Бесплатно. По\u2011настоящему.')}
          sub={t('landing.kx.price.sub', 'Платишь только когда зарабатываешь через страницу. PRO нужен, чтобы отдавать меньше.')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="kx-card !min-h-0 gap-8">
            <div>
              <p className="!mt-0 text-sm uppercase tracking-[.14em] text-[var(--kx-muted)]">{t('landing.kx.price.freeName', 'Старт')}</p>
              <p className="kx-display mt-3 !text-[56px] !text-[var(--kx-text)]">0 ₸</p>
              <ul className="mt-6 grid gap-3">
                {free.map((item) => <li key={item} className="flex items-center gap-3 text-[15px]"><Check className="h-4 w-4 shrink-0 text-[var(--kx-accent)]" />{item}</li>)}
              </ul>
            </div>
            <button type="button" onClick={onStart} className="kx-btn kx-btn-primary w-full">{t('landing.kx.price.freeCta', 'Начать бесплатно')}</button>
          </Reveal>
          <Reveal className="kx-card !min-h-0 gap-8 !border-[var(--kx-accent)]" delay={100}>
            <div>
              <p className="!mt-0 text-sm uppercase tracking-[.14em] text-[var(--kx-accent)]">PRO</p>
              <p className="kx-display mt-3 !text-[56px] !text-[var(--kx-text)]">
                3 045 ₸
              </p>
              <p className="!mt-1 text-sm">{t('landing.kx.price.perMonth', '/мес при оплате за год')}</p>
              <ul className="mt-6 grid gap-3">
                {pro.map((item) => <li key={item} className="flex items-center gap-3 text-[15px]"><Check className="h-4 w-4 shrink-0 text-[var(--kx-accent)]" />{item}</li>)}
              </ul>
            </div>
            <button type="button" onClick={onPricing} className="kx-btn kx-btn-ghost w-full">
              {t('landing.kx.price.proCta', 'Все тарифы')}<ArrowUpRight className="h-4 w-4" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

function useKxFaq() {
  const { t } = useTranslation();
  return getLandingFaq(t);
}

export function KxFaq() {
  const { t } = useTranslation();
  const faq = useKxFaq();
  return (
    <section id="faq" className="scroll-mt-24 bg-[#111] py-20 md:py-32" aria-labelledby="kx-faq">
      <div className="kx-wrap grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <Reveal className="flex flex-col justify-between gap-10">
          <div>
            <h2 id="kx-faq" className="kx-display text-[34px] sm:text-[48px] lg:text-[60px]">{t('landing.kx.faq.title', 'Вопросы')}</h2>
            <p className="mt-4 max-w-[26rem] text-lg text-[var(--kx-muted)]">{t('landing.kx.faq.sub', 'Не нашёл ответ? Напиши нам, разберёмся.')}</p>
          </div>
          <SupportMail className="hidden lg:block" />
        </Reveal>
        <Reveal delay={100}>
          {faq.map((item, i) => (
            <details key={item.q} className="kx-faq-item" open={i === 0}>
              <summary>{item.q}<span className="kx-plus" aria-hidden="true" /></summary>
              <p>{item.a}</p>
            </details>
          ))}
          <SupportMail className="mt-10 lg:hidden" />
        </Reveal>
      </div>
    </section>
  );
}

function SupportMail({ className }: { className?: string }) {
  return (
    <a href="mailto:support@lnkmx.my" className={`kx-display block break-all text-[28px] transition-colors hover:text-[var(--kx-accent)] sm:text-[40px] ${className ?? ''}`}>
      support<span className="text-[var(--kx-dim)]">@lnkmx.my</span>
    </a>
  );
}

/* ---------- Final CTA ---------- */

export function KxCta({ onStart }: { onStart: (slug?: string) => void }) {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24" aria-labelledby="kx-cta">
      <div className="kx-wrap">
        <Reveal className="kx-cta px-6 py-14 md:px-16 md:py-24">
          <span aria-hidden="true" className="kx-cta-ring -right-24 -top-24 h-72 w-72 border-dashed" />
          <span aria-hidden="true" className="kx-cta-ring -bottom-40 -left-20 h-96 w-96" style={{ animationDirection: 'reverse' }} />
          <div className="relative max-w-[44rem]">
            <h2 id="kx-cta" className="kx-display text-[32px] min-[400px]:text-[36px] sm:text-[60px] lg:text-[80px]">{t('landing.kx.cta.title', 'Ну что, попробуешь?')}</h2>
            <p className="mt-4 max-w-[30rem] text-lg text-black/70">{t('landing.kx.cta.sub', 'Через пять минут у тебя будет страница, которую не стыдно поставить в био.')}</p>
            <div className="mt-8 [&_.kx-claim-prefix]:text-white/60 [&_input]:text-white">
              <ClaimForm id="kx-claim-cta" onSubmit={onStart} tone="accent" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

export function KxFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const columns = [
    {
      title: t('landing.kx.footer.product', 'Продукт'),
      links: [
        { href: '/gallery', label: t('landing.kx.nav.examples', 'Примеры') },
        { href: '/pricing', label: t('landing.kx.nav.pricing', 'Тарифы') },
        { href: '/experts', label: t('landing.kx.footer.experts', 'Каталог экспертов') },
        { href: '/blog', label: t('landing.kx.footer.blog', 'Блог') },
      ],
    },
    {
      title: t('landing.kx.footer.guides', 'Полезное'),
      links: [
        { href: '/blog/skolko-stoit-sayt-vizitka-v-kazakhstane', label: t('landing.kx.footer.guidePrice', 'Цена сайта-визитки') },
        { href: '/blog/telegram-vizitka-dlya-koucha-poshagovo', label: t('landing.kx.footer.guideTelegram', 'Telegram-визитка') },
        { href: '/blog/kak-prinimat-oplatu-cherez-whatsapp-v-kazakhstane', label: t('landing.kx.footer.guideWhatsapp', 'Оплата через WhatsApp') },
        { href: '/blog/mini-crm-dlya-frilansera-zachem-i-kak', label: t('landing.kx.footer.guideCrm', 'Мини-CRM для фрилансера') },
        { href: '/blog/taplink-vs-linkmax-sravnenie-2026', label: t('landing.kx.footer.guideTaplink', 'Taplink или LinkMAX') },
        { href: '/blog/how-to-add-link-in-bio-to-instagram', label: t('landing.kx.footer.guideInstagram', 'Ссылка в bio Instagram') },
      ],
    },
    {
      title: t('landing.kx.footer.info', 'Информация'),
      links: [
        { href: '/privacy', label: t('landing.kx.footer.privacy', 'Конфиденциальность') },
        { href: '/terms', label: t('landing.kx.footer.terms', 'Оферта') },
        { href: '/payment-terms', label: t('landing.kx.footer.payments', 'Оплата и возврат') },
      ],
    },
    {
      title: t('landing.kx.footer.contact', 'Связь'),
      links: [
        { href: 'mailto:support@lnkmx.my', label: 'support@lnkmx.my' },
        { href: 'https://t.me/LinkMAX_app', label: 'Telegram' },
      ],
    },
  ];
  return (
    <footer className="border-t border-[var(--kx-line)] pb-10 pt-16">
      <div className="kx-wrap grid gap-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <KxMark className="!text-[28px]" />
          <p className="mt-4 max-w-[22rem] text-[var(--kx-muted)]">{t('landing.kx.footer.about', 'Конструктор страниц для тех, кто работает на себя: мастеров, экспертов, авторов и маленьких студий.')}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-[15px] text-[var(--kx-muted)] transition-colors hover:text-[var(--kx-text)]" {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="kx-wrap mt-14 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--kx-dim)]">
        <span>© {year} LinkMAX</span>
        <span>lnkmx.my</span>
      </div>
    </footer>
  );
}
