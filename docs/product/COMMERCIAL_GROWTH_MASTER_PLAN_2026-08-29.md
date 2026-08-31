# LinkMAX: коммерческая продуктовая стратегия и мастер-план

**Дата исследования:** 29 августа 2026 года  
**Горизонт:** 18 месяцев  
**Режим:** аудит репозитория, локальной сборки, публичной версии и авторизованного кабинета; внешнее исследование прямых, косвенных и open-source аналогов  
**Ограничение:** данные одного авторизованного аккаунта использованы только как качественный сигнал. Они не являются статистикой всей платформы. Персональные и финансовые сведения из кабинета в документ не вынесены.

---

## 1. Итог в одном абзаце

LinkMAX уже технически значительно шире обычной «ссылки в био»: здесь есть конструктор, услуги и товары, заявки, запись, платежный контур, CRM, аналитика, автоматизации, AI, маркетплейс, документы, Telegram и десятки дополнительных модулей. Но коммерчески продукт пока проигрывает не по количеству возможностей, а по концентрации на результате. Пользователь видит много инструментов, но не проходит короткую, надежную и измеримую цепочку **«пришел из Instagram/Telegram → выбрал услугу → записался → внес предоплату → пришел → записался повторно»**. Рекомендуемая стратегия — перестать продавать абстрактную «Business OS для всех» и занять более узкую позицию: **Revenue & Booking OS для частных специалистов услуг в Казахстане и Центральной Азии**, начиная с мастеров красоты. После доказанного удержания ядро можно расширять на преподавателей, консультантов, тренеров и небольшие студии.

## 2. Главный диагноз

### Что уже является активом

- Глубокая продуктовая база: публичные страницы, блоковый редактор, локализация, заявки, booking, платежи, кошелек, CRM, аналитика, AI, Telegram Mini App, реферальные механики.
- Хорошая визуальная ДНК: контрастный бренд, мобильная направленность, современная компонентная база.
- Региональный контекст: KZT, русский/казахский языки, Telegram, потенциал интеграций с Kaspi и локальными платежами.
- Возможность замкнуть полный цикл выручки, а не только выдавать пользователю страницу.
- Уже подключен PostHog, поэтому значительная часть необходимой продуктовой аналитики достижима без строительства еще одной внутренней аналитической системы.

### Что мешает коммерческому успеху

1. **Размытое позиционирование.** В коде и документации одновременно живут link-in-bio, creator commerce, Sales OS, Solo OS и Business OS. Разные обещания привлекают разные сегменты и требуют разных продуктов.
2. **Feature sprawl.** Более 1 000 исходных файлов, 66 Edge Functions и 300 миграций — это уже сложная платформа, но не доказанный повторяемый бизнес. Поверхность продукта растет быстрее, чем качество ключевого пути.
3. **Нет единой «денежной истины».** Аналитика считает просмотры и CTR, но главный экран не объясняет пользователю, сколько записей, оплаченных визитов, сохраненных no-show и повторных клиентов принес LinkMAX.
4. **Ненадежный путь доверия.** На публичных и внутренних страницах обнаружены повторяющиеся секции, ошибки локализации, разъезжающиеся валютные символы, технический текст, placeholder-контент и неподтвержденные маркетинговые проценты.
5. **Монетизация наказывает рост.** Бесплатный тариф с комиссией 7% делает наиболее успешных продавцов наиболее мотивированными увести оплату из системы. При этом Taplink публично заявляет 0% собственной комиссии, а нишевые booking-системы продают понятную операционную ценность.
6. **Слабый GTM-контур.** В текущем founder playbook ключевой демонстрационный URL `/demo-nails` ведет на 404, тогда как рабочий пример использует `/demo_nails`. Это ломает продажи буквально на первой ссылке.
7. **Продукт сообщает советы раньше, чем доказывает причинность.** Формулировки вроде «цены дают +40% запросов» и «отзывы повышают конверсию на 25%» показываются как факт, хотя в интерфейсе нет источника, доверительного интервала или расчета на данных пользователя.

## 3. Что показал аудит продукта

### 3.1. Публичный путь

1. **Главная — состояние: условно здоровое.** Сильный визуальный стиль и обещание быстрого запуска, но ниже первого экрана появляются дубли секций. Обещание пока больше про создание страницы, чем про выручку клиента.
2. **Регистрация — состояние: хорошая основа.** Низкий порог входа, AI-обещание, Google/email. Следует заменить продуктовый результат «страница создана» на «страница опубликована и готова принять первую запись».
3. **Галерея — состояние: нездоровое.** Десятки карточек с именем `Your Name`, пустыми изображениями или слабым содержанием разрушают социальное доказательство. Галерея должна быть курируемой витриной качественных и, позднее, проверенных специалистов.
4. **Тарифы — состояние: нездоровое.** Неполный заголовок, языковые ошибки, конфликт цен с pitch deck, нет калькулятора окупаемости и ясного ответа, за что берется комиссия.
5. **Нишевая посадочная — состояние: риск.** В пользовательский текст попала техническая инструкция о передаче параметра в `/auth`; при полном рендере видны крупные пустые зоны и дубли.
6. **Демонстрационная страница — состояние: критический риск доверия.** Рабочий путь отличается от указанного в GTM-документе; встречаются дубли booking/FAQ, двойные символы валюты и телефона, а демонстрационные показатели выглядят как реальные, но не маркированы как пример.

Публичные артефакты аудита находятся в `docs/audits/2026-08-29-product-strategy/`. Приватные снимки авторизованного кабинета намеренно не используются в презентационных материалах.

### 3.2. Авторизованный кабинет

1. **Дом — состояние: перегруженное.** На одном экране находятся чеклист запуска, wallet/GMV, performance, воронка, карточка страницы, SEO и быстрые действия. Некоторые секции физически повторяются. Главный экран должен отвечать на два вопроса: «что принесло деньги?» и «какое одно действие сделать сейчас?»
2. **Редактор — состояние: функциональное, но сложное.** Много способов добавить и отредактировать блок; есть дизайн-оценка и AI. В доступном DOM видны `object Object`, служебные строки и неестественные переводы. Нужен режим «быстрый запуск по нише», а продвинутый редактор следует оставить вторым слоем.
3. **Входящие — состояние: концептуально смешанное.** В одном месте соединены заявки, сообщения, отзывы, wallet и GMV. Для малого предпринимателя лучше единый timeline клиента, а не несколько параллельных сущностей.
4. **Аналитика — состояние: данные есть, решения слабые.** Есть просмотры, уникальные посетители, клики, CTR, источник и устройства. Нет связного revenue funnel: источник → услуга → слот → депозит → визит → повторная запись → выручка. AI-рекомендации повторяются и не объясняют доказательность.
5. **Навигация — состояние: приемлемая оболочка.** Нижняя мобильная навигация компактна. Основная проблема — не количество пяти вкладок, а слишком широкое содержание каждой из них.

### 3.3. Техническая готовность

- `npm run quality:check` не проходит: ESLint завершился с 1 ошибкой и 1 238 предупреждениями.
- Блокирующая ошибка: `src/components/dashboard-v2/widgets/DigitalGoodsManager.tsx:86` (`no-useless-escape`).
- Предупреждения включают большое количество `any`, неиспользуемого кода, console-вызовов и пропущенных зависимостей React hooks.
- В локализациях встречается поврежденная кодировка валюты (`в‚ё`), русские строки в английском locale и разные коммерческие обещания.
- `PITCH_DECK.md` описывает Starter 5% и Pro 6 000 ₸ / $13, а принятый ADR и продакшен показывают Starter 7% и Pro 3 045 ₸ + 1%. До следующей продажи должна существовать одна версия тарифной истины.

## 4. Рекомендуемая позиция на рынке

### Выбранный wedge

**LinkMAX превращает аудиторию частного специалиста из Instagram и Telegram в оплаченные записи и повторных клиентов — без отдельного сайта, CRM и сложной booking-системы.**

### Первый ICP

Частный beauty-мастер в Алматы, Астане и городах Казахстана:

- работает самостоятельно или с одним помощником;
- получает лиды из Instagram, WhatsApp и Telegram;
- ведет расписание в переписке или календаре;
- сталкивается с no-show, вопросами о цене, ручными напоминаниями и потерянными повторными продажами;
- не хочет внедрять полноценную систему уровня салона;
- готов платить, если продукт приносит хотя бы одну дополнительную запись или спасает один no-show в месяц.

### Почему не «для всех» сейчас

| Стратегия | Плюсы | Минусы | Решение |
|---|---|---|---|
| A. Revenue OS для соло-услуг | Ясная боль, понятный ROI, региональная дифференциация, естественная связка страницы и booking | Уже рынок booking-систем; нужна безупречная надежность | **Выбрать сейчас** |
| B. Creator commerce / link-in-bio для всех | Большой рынок, легко объяснить базовую функцию | Linktree, Beacons, Stan и Taplink намного сильнее в бренде и дистрибуции; слабая локальная защита | Не фокусировать ближайшие 12 месяцев |
| C. White-label/API-конструктор | Высокие чеки, инфраструктурный moat | Длинные продажи, поддержка, безопасность, преждевременная платформенность | Вернуться после доказанного B2C/B2B2C ядра |

## 5. North Star и система метрик

### North Star

**Weekly Completed Paid Appointments (WCPA)** — количество завершенных оплаченных записей за неделю у активных продавцов, подтвержденных после окна отмены/возврата.

Почему не MAU, просмотры или опубликованные страницы: они могут расти без пользы для клиента. Завершенная оплаченная запись означает, что клиент нашел услугу, доверился специалисту, выбрал время, оплатил и получил результат.

### Дерево метрик

```text
WCPA
├── активные продавцы с опубликованной страницей
│   ├── регистрация → выбран нишевой kit
│   ├── time-to-publish
│   └── ссылка размещена в источнике трафика
├── квалифицированные посещения
│   ├── источник / UTM / smart link
│   ├── просмотр услуги
│   └── доступный слот
├── конверсия в запись
│   ├── start_booking
│   ├── slot_selected
│   ├── booking_confirmed
│   └── deposit_paid
├── явка
│   ├── reminder_delivered
│   ├── confirmed_by_client
│   └── appointment_completed
└── удержание
    ├── verified_review_submitted
    ├── rebook_within_window
    ├── package_or_membership_purchase
    └── winback_conversion
```

### Обязательные guardrails

- no-show rate;
- refund/chargeback rate;
- успешность доставки уведомлений;
- доля платежей, ушедших off-platform после начала booking;
- время загрузки публичной страницы на мобильной сети;
- количество обращений в поддержку на 100 завершенных записей;
- доля пользователей, отключивших коммуникации;
- инциденты приватности, платежей и RLS.

### Первые целевые пороги

Это **гипотезы**, а не уже достигнутые KPI. Их нужно откалибровать после 4 недель корректной телеметрии.

| Метрика | 90 дней | 6 месяцев | 12 месяцев |
|---|---:|---:|---:|
| Регистрация → опубликованная revenue-ready страница за 24 часа | 40% | 55% | 65% |
| Median time-to-publish | <20 мин | <12 мин | <8 мин |
| Опубликованная страница → первая запись за 14 дней | 20% | 30% | 40% |
| Booking start → подтвержденная запись | 35% | 45% | 55% |
| Доля записей с депозитом | 20% | 40% | 60% |
| 8-недельное retained usage у activated sellers | 25% | 35% | 45% |
| Повторная запись в подходящее нишевое окно | baseline | +15% | +30% |
| Support contacts / 100 completed appointments | baseline | −25% | −50% |

## 6. Четыре продуктовых цикла роста

### 6.1. Activation loop

Нишевой шаблон → услуги и цены → доступность → способ связи/оплаты → публикация → размещение в Instagram/Telegram → первая квалифицированная сессия.

Ключевой продуктовый объект — не «страница», а **Revenue Kit**. Для мастера маникюра kit сразу содержит набор услуг, длительности, диапазоны цен, booking, депозит, FAQ, правила отмены, отзывы и шаблоны напоминаний. Пользователь редактирует данные, а не собирает систему с нуля.

### 6.2. Revenue loop

Посещение → выбор услуги → слот → депозит → напоминание → подтверждение → завершенная запись → финансовый итог.

Главный экран показывает: «LinkMAX принес X подтвержденных записей, Y ₸ выручки и предотвратил Z потенциальных no-show». Пока таких данных нет, показывает одно следующее действие, повышающее вероятность первой записи.

### 6.3. Retention loop

Завершенный визит → проверенный отзыв → предложение записаться повторно в правильное окно → пакет/абонемент → win-back при пропуске окна.

Это важнее еще одного типа блока. У booking-продуктов повторная запись и no-show protection напрямую связаны с платежеспособностью пользователя.

### 6.4. Distribution loop

Проверенная запись → проверенный отзыв/работа → индексируемая страница услуги → локальная галерея/маркетплейс → новый клиент → одноразовый acquisition fee → повторные записи без повторной acquisition-комиссии.

Так LinkMAX перестает быть только инструментом, куда пользователь сам приносит трафик, и начинает генерировать спрос.

## 7. Конкуренты: что брать, а чего не копировать

### 7.1. Прямые creator/link-in-bio конкуренты

| Продукт | Актуальный сигнал на август 2026 | Что взять | Чего не копировать |
|---|---|---|---|
| [Linktree](https://linktr.ee/s/pricing) | 70+ млн пользователей; smart routing, продажи, affiliate, email/SMS, social scheduling | Простоту первой страницы, сильное распространение Powered-by, smart links и атрибуцию | Гонку за универсальным профилем и функциями для любого creator |
| [Beacons](https://home.beacons.ai/plans) | Free с 9% seller fee; $30 Plus с 0%, courses, memberships, booking, order bumps | Упаковку monetization suite и понятный переход «плата вместо комиссии» | Одновременное развитие media kit, courses, email и store без доказанного ICP |
| [Stan](https://help.stan.store/article/31-creator-vs-creator-pro) | $29/$99; store, bookings, subscriptions, funnels, upsells, email flows | Продажу результата, upsell/order bump, lead magnet → nurturing → purchase | Высокую цену до локального доказанного ROI и инфобизнес-позиционирование |
| [Taplink](https://taplink.at/en/) | 8,7 млн страниц, 30+ инструментов, forms/payments/CRM; заявляет 0% комиссии платформы | Локализованные формы, уведомления, встроенный CRM и широкий набор payment providers | Еще больше свободных блоков без вертикального guided flow |

### 7.2. Нишевые и региональные конкуренты

| Продукт | Что у него сильнее | Вывод для LinkMAX |
|---|---|---|
| [Fresha](https://www.fresha.com/for-business/features) | Marketplace, no-show protection, rich client profile, loyalty, packages, verified reviews, tagged portfolio | Комиссию логичнее брать за **нового клиента, найденного платформой**, а не за каждую транзакцию пользователя. Портфолио должно быть shoppable/bookable. |
| [Booksy](https://biz.booksy.com/) | Привлечение клиентов, запись, платежи, memberships/packages/gift cards | Побеждает связка discovery + operations + retention, не просто календарь. |
| [YCLIENTS](https://www.yclients.com/) | Глубокая автоматизация салонов, booking на множестве площадок, склад, сотрудники, зарплаты | Не конкурировать лоб в лоб за салоны. Выигрывать простотой для solo-first и бесшовным переходом из соцсетей. |
| [Altegio](https://alteg.io/en/) | Активная локализация в Казахстане, KZT, WhatsApp, loyalty, staff/finance/stock | Локальные платежи и коммуникации — обязательный минимум, а не будущий бонус. |
| [DIKIDI](https://dikidi.net/) | Бесплатный вход и каталог/поиск специалистов | Бесплатный booking может быть acquisition channel; монетизировать следует рост, платежи, коммуникации и привлечение. |
| [HoneyBook](https://www.honeybook.com/) | Lead form создает проект; smart file соединяет предложение, договор, invoice, payment и scheduling | Для консультантов позже сделать единый client flow, а не россыпь документов и CRM-экранов. |
| [Calendly](https://calendly.com/features) | Routing forms, reminders/follow-ups, analytics; в августе 2026 развивает AI email workflows | Точная маршрутизация и follow-up ценнее декоративного AI. |
| [systeme.io](https://systeme.io/features) | Funnel/email/course/affiliate/community в одном продукте | Хороший ориентир упаковки, но предупреждение: all-in-one требует жестких шаблонов и одной бизнес-модели. |

### 7.3. Косвенные региональные альтернативы

Реальный конкурент LinkMAX — не только SaaS. Это связка **Instagram bio + WhatsApp/Telegram + Google Calendar + Kaspi invoice/QR + заметки/Excel**. Она бесплатна, знакома и гибка. LinkMAX обязан побеждать ее не количеством модулей, а тремя измеримыми преимуществами:

1. меньше переписки до подтвержденной записи;
2. меньше no-show благодаря депозиту и напоминаниям;
3. больше повторных записей без ручного поиска клиентов.

[Kaspi Pay для самозанятых](https://mybank.kaspi.kz/online/selfaccount/) задает локальное ожидание мгновенного QR/invoice и понятных чеков. Интеграция либо максимально простой handoff с Kaspi должна быть стратегическим приоритетом после юридической и партнерской проверки.

## 8. Open-source проекты: что применить

Лицензии нужно проверять перед копированием кода. Ниже — прежде всего продуктовые и архитектурные паттерны.

| Репозиторий | Сигнал | Применение в LinkMAX |
|---|---|---|
| [LinkStack](https://github.com/LinkStackOrg/LinkStack) | Self-hosted profiles, темы, community marketplace | Тема/шаблон как распространяемый пакет; экспорт и переносимость повышают доверие |
| [LittleLink](https://github.com/sethcottle/littlelink) | Минимальный статический профиль, ориентация на performance/accessibility/SEO | Публичная revenue-page должна оставаться предельно легкой, даже если кабинет сложный |
| [Dub](https://github.com/dubinc/dub) | Современная атрибуция ссылок, conversions, affiliate | Единый link/event graph, source-level ROI, партнерские и реферальные ссылки |
| [Cal.com / Cal.diy](https://github.com/calcom/cal.com) | Сильные scheduling patterns; в 2026 репозиторий изменил позицию и состав Community Edition | Брать UX/модель времени как ориентир, но не строить критический коммерческий контур на нестабильной open-source зависимости |
| [Twenty](https://github.com/twentyhq/twenty) | Настраиваемые CRM objects/views/workflows | Внутри хранить гибкие primitives; снаружи показывать нишевой клиентский timeline, а не Salesforce-подобную CRM |
| [Formbricks](https://github.com/formbricks/formbricks) | Контекстные опросы и сегментация | Собирать feedback в момент отмены, no-show, первой оплаты и churn, а не общим NPS-попапом |
| [PostHog](https://github.com/PostHog/posthog) | Analytics, replay, flags, experiments, surveys, workflows | Использовать уже установленный PostHog как единый слой событий и экспериментов; не дублировать функции в кастомном growth admin |
| [n8n](https://github.com/n8n-io/n8n) | 1 500+ интеграций и 9 000+ workflow templates | Автоматизации продавать готовыми рецептами: «напомнить за 24 часа», «попросить отзыв», «вернуть через 4 недели» |
| [Novu](https://github.com/novuhq/novu) | Единая conversation-модель, digests, preferences, много каналов | Один слой уведомлений с предпочтениями, дедупликацией и delivery status для Telegram/WhatsApp/email |
| [Documenso](https://github.com/documenso/documenso) | Open-source e-signing и trust infrastructure | Для юридических документов интегрировать специализированного провайдера; не строить собственную ЭЦП/ЭДО раньше ядра |
| [Nexo Links](https://github.com/Aetherinox/nexolinks) | Privacy-first/cookieless analytics, multilingual, QR, WCAG | Снизить cookie friction на публичных страницах и сделать базовую аналитику privacy-first после юридической проверки |

## 9. Целевая продуктовая модель

### 9.1. Пять поверхностей вместо десятков равноправных модулей

1. **Сегодня** — выручка, записи, риски и одно следующее действие.
2. **Страница** — нишевой kit, услуги, портфолио, доверие и публикация.
3. **Клиенты** — единый timeline: сообщение, запись, оплата, визит, отзыв, повтор.
4. **Календарь** — доступность, подтверждения, депозит, no-show и перепланирование.
5. **Рост** — источники, воронка, повторные записи, кампании и marketplace.

Счета, документы, товары, автоматизации, задачи и продвинутый CRM не удаляются из системы, но открываются по контексту, тарифу и стадии зрелости. Новичку они не должны конкурировать с первой записью.

### 9.2. Progressive disclosure

- До публикации показывать только setup.
- После первых посещений — conversion fixes.
- После первой записи — депозит, напоминания и клиентский timeline.
- После пяти завершенных визитов — отзывы и rebooking.
- После регулярной выручки — пакеты, loyalty, automation и advanced analytics.
- Командные, складские и сложные CRM-функции — только для studio plan или явного включения.

### 9.3. AI как outcome copilot

AI не должен быть отдельным развлечением «улучшить текст». Он должен:

- создать revenue-ready страницу из Instagram/анкеты;
- найти конкретный разрыв в воронке на данных пользователя;
- объяснить, почему рекомендует действие;
- оценить ожидаемый эффект диапазоном, а не фальшивой точностью;
- подготовить follow-up или win-back, но отправлять только после одобрения;
- суммировать клиента и следующий шаг;
- автоматически провести безопасный A/B-тест там, где есть достаточный трафик.

## 10. Монетизация

### Проблема текущей модели

Комиссия 7% на Starter выглядит терпимо до появления оборота, а затем превращается в налог на успех. Она создает incentive принимать депозит в LinkMAX, а остаток — в Kaspi/наличными, то есть разрушает полноту данных и future revenue.

### Рекомендуемая модель для теста

| План | Для кого | Предлагаемая ценность | Модель |
|---|---|---|---|
| Identity | Еще не принимает online-записи | Публичная страница, ссылки, базовая аналитика | 0 ₸; без commerce/booking automation |
| Start | Проверяет спрос | Revenue Kit, booking, простые напоминания, ограниченные активные клиенты | 0 ₸ или небольшой flat fee; прозрачная processing fee, без 7% platform tax на self-sourced клиента |
| Growth | Уже получает записи | Депозиты, rebooking, reviews, клиентская база, автоматизации, advanced attribution | 4 990–7 990 ₸/мес как тестовый диапазон; 0% platform fee на direct traffic |
| Studio | 2–10 специалистов | Команда, ресурсы, роли, payroll/export, расширенная поддержка | От 14 990 ₸/мес, после доказанного solo retention |
| Marketplace acquisition | Платформа привела нового клиента | Discovery, ranking, verified review, first booking | Разовая комиссия 8–15% только за first completed appointment; повторные визиты без acquisition fee |

Это направление, а не финальный прайс. Перед запуском нужно посчитать payment processing, refunds, support cost, CAC payback и локальные налогово-юридические ограничения.

### Pricing page должна показывать

- «одна сохраненная отмена окупает Growth»;
- калькулятор оборота и сравнение текущей/новой комиссии;
- что считается direct и marketplace клиентом;
- отдельные platform fee и payment processing fee;
- примеры по нишам в KZT;
- честную таблицу ограничений;
- одну актуальную цену во всех документах, locale и paywall.

## 11. Приоритеты: build / improve / integrate / defer / retire

### Build now

- Revenue Kit для nail/lash/brow masters.
- Полная revenue funnel telemetry.
- Deposit + cancellation/no-show policy flow.
- Unified client timeline.
- Rebooking window и post-visit workflow.
- Verified review после завершенной записи.
- Source attribution до выручки.

### Improve now

- Публичный performance, доступность и SEO.
- Редактор: guided mode, надежный preview/publish, ясный undo/versioning.
- Mobile dashboard: устранение дублей, состояния загрузки и единственная CTA.
- Локализация RU/KK, машинная проверка кодировки и языка.
- Галерея: moderation/quality threshold.
- Demo environments и demo data labeling.

### Integrate before building

- PostHog для событий, feature flags, experiments, replay и surveys.
- Telegram Mini Apps для onboarding, auth и уведомлений. Для цифровых товаров внутри Telegram соблюдать правила [Telegram Stars](https://core.telegram.org/bots/payments-stars); для физических услуг — корректный third-party payment flow.
- Локальные payment/QR partners после due diligence.
- Google booking entry points через совместимого провайдера/интеграцию там, где доступно [Reserve with Google](https://developers.google.com/actions-center/verticals/appointments/overview).
- Специализированный e-sign provider для документов.

### Defer

- Полноценный склад и бухгалтерия.
- Продвинутая HR/payroll система.
- Универсальные онлайн-курсы и community platform.
- Сложный email marketing builder.
- Собственный omnichannel provider.
- Агентские и white-label возможности до стабильного solo retention.

### Retire or hide

- Сломанные/непроверенные шаблоны и gallery cards.
- Неподтвержденные «AI» проценты конверсии.
- Дублированные интерфейсные секции.
- Мертвые GTM URL.
- Фичи, не имеющие владельца, событий аналитики и активных пользователей за согласованное окно.

## 12. Roadmap на 18 месяцев

### Фаза 0: 0–14 дней — восстановить доверие и измеримость

**Цель:** перестать терять пользователей из-за базовых дефектов и получить корректный baseline.

- Исправить `/demo-nails` или везде заменить на единственный canonical URL.
- Устранить дубли секций на Home, Insights, niche landing и demo page.
- Исправить `₸ ₸`, `++телефон`, технические строки, `object Object`, `Снимите крышку`, `Reviews` и поврежденную кодировку.
- Убрать/маркировать неподтвержденную социальную статистику demo.
- Синхронизировать цену в ADR, pitch, pricing UI, FAQ, locale и paywall.
- Сделать CI зеленым; ESLint error = 0. Создать ratchet для предупреждений: новые предупреждения запрещены, старые снижаются по спринтам.
- Определить event dictionary, identity stitching и источник истины для booking/payment/completion/refund.
- В PostHog собрать один funnel dashboard и один retention dashboard.
- Провести 10 интервью с активными и 10 с ушедшими beauty-мастерами; разбирать реальные последние записи, не спрашивать «нравится ли идея».

**Exit criteria:** canonical demo проходит end-to-end; нет UI-дублей на 5 ключевых экранах; revenue funnel события имеют тесты; тарифная информация непротиворечива.

### Фаза 1: дни 15–45 — первая оплаченная запись

- Один Beauty Revenue Kit.
- Setup wizard: профиль → услуги/цены → доступность → депозит → канал связи → preview → publish/share.
- Импорт базовой информации из Instagram/анкеты с подтверждением.
- Mobile preview в каждом шаге.
- Источник ссылки и QR с UTM preset.
- Booking UX: меньше полей, понятное timezone, время/длительность, policy до подтверждения.
- First booking concierge для первых 100 целевых пользователей.

**Exit criteria:** median time-to-publish <20 минут; не менее 40% целевого cohort публикует страницу за 24 часа; измеряется first-booking conversion.

### Фаза 2: дни 46–90 — no-show и деньги

- Депозит фиксированной суммой или процентом.
- Confirmation/reminder через выбранный канал, delivery status и retry.
- Кнопка клиента подтвердить/перенести/отменить без регистрации.
- Ясный policy builder из 3 безопасных шаблонов.
- Appointment completion и ручная корректировка с audit trail.
- Revenue dashboard: booked, paid, completed, refunded, no-show prevented.
- Pricing experiment: current 7% против flat Growth / 0% direct platform fee.

**Exit criteria:** доказано снижение no-show или сокращение ручной переписки; первые пользователи платят за outcome, а не за доступ к блокам.

### Фаза 3: 3–6 месяцев — повторная выручка

- Verified reviews только после completed appointment.
- Rebooking CTA сразу после визита и в нишевое окно.
- Пакеты/абонементы для повторяемых услуг.
- Win-back рецепты, frequency caps и unsubscribe/preferences.
- Client timeline и легкая сегментация: new / active / due / lapsed / VIP.
- Cohort retention и revenue retention.

**Exit criteria:** экспериментально подтвержден рост повторных записей; Growth plan окупается понятным ROI; 8-недельное удержание activated sellers растет.

### Фаза 4: 6–12 месяцев — локальная дистрибуция

- Курируемая searchable gallery: город, услуга, цена, ближайший слот, verified review.
- Портфолио, привязанное к услуге и booking.
- Verified identity/business/payment badges.
- Marketplace ranking с quality/fairness guardrails.
- Referral loop клиент → специалист и специалист → специалист.
- Telegram Mini App discovery/share; партнерства с beauty schools и поставщиками.
- Тест acquisition fee только после completed first appointment.

**Exit criteria:** платформа приводит измеримое число новых клиентов; marketplace cohort удерживается лучше direct-only cohort; жалобы и fake reviews контролируются.

### Фаза 5: 12–18 месяцев — соседние ниши и платформа

- Перенести proven primitives в Tutor Kit и Consultant/Coach Kit.
- Для high-ticket услуг — единый proposal/form/schedule/invoice/payment flow по паттерну HoneyBook.
- Studio plan для 2–10 специалистов только при подтвержденном спросе.
- Ограниченный API/webhooks и партнерский каталог автоматизаций.
- White-label pilot не более чем с 3 design partners.

**Exit criteria:** новая ниша достигает не менее 70% activation и retention показателей beauty cohort без отдельного продукта с нуля.

## 13. Экспериментальный backlog

| № | Гипотеза | Изменение | Primary metric | Guardrail |
|---:|---|---|---|---|
| 1 | Нишевой kit ускорит value | Beauty wizard против пустого редактора | publish within 24h | support tickets, undo usage |
| 2 | Outcome-copy лучше AI-copy | «Получите первую запись» против «AI-страница за 2 минуты» | qualified signup → publish | signup quality |
| 3 | Цена до слота повышает качество | Service + price above booking | booking completion | bounce, avg ticket |
| 4 | Депозит снижает no-show | optional default deposit template | completed / confirmed | refunds, complaints |
| 5 | Client self-reschedule снижает ручной труд | magic-link reschedule | conversations per booking | late cancellations |
| 6 | ROI pricing конвертит лучше feature table | калькулятор «сколько теряете на no-show» | trial → paid | refund/churn |
| 7 | Flat fee удерживает успешных | Growth 0% platform fee vs 7% | paid retention, on-platform GMV | margin, fraud |
| 8 | Проверенные отзывы конвертят | verified badge + service-linked review | service view → booking | report rate |
| 9 | Своевременный rebook повышает LTV | niche-based rebook reminder | rebook within window | opt-out/spam |
| 10 | Одно действие лучше dashboard wall | next-best-action home | task completion → WCPA | discoverability |
| 11 | Курируемая галерея создает trust | убрать low-quality cards | gallery → qualified visit | creator exposure fairness |
| 12 | Marketplace fee воспринимается честнее | acquisition fee only on new platform client | adoption + marketplace bookings | bypass/fraud |

Эксперимент запускается только при заранее заданных audience, exposure, sample/stop rule и guardrails. «AI рекомендует +25%» без эксперимента запрещено.

## 14. GTM: первые 100, 1 000 и 10 000 платящих

### Первые 100 activated sellers

- Один город/кластер за раз; сначала Алматы, затем Астана.
- Канал: beauty schools, микроинфлюенсеры, поставщики материалов, локальные сообщества мастеров.
- Предложение: concierge setup за 30 минут и 30 дней outcome-гарантии формата «запустим страницу, запись и напоминания», а не скидка на SaaS.
- Каждую неделю founder-led review: сколько мастеров опубликовались, получили запись, депозит, completed visit и rebook.
- Публичные кейсы только с проверяемым до/после: время переписки, no-show, доля предоплаты, повторные записи.

### 100–1 000 платящих

- Productized onboarding вместо ручного setup.
- Сертифицированные шаблоны от топ-мастеров.
- Referral credits после первой completed appointment приглашенного продавца.
- Партнеры: школы и поставщики получают attribution dashboard, не просто промокод.
- Локальная support/community операция на RU/KK.

### 1 000–10 000 платящих

- Marketplace/discovery как отдельный канал спроса.
- Programmatic SEO по услуге/городу только для качественных проверенных страниц.
- Telegram Mini App и deep links.
- Второй вертикальный kit на основе данных, а не размера TAM на слайде.
- Продажи studio plan и limited partner API.

## 15. Организация команды и правила принятия решений

### Один поток результата

На ближайшие 90 дней команда должна иметь единый product bet: **первая completed paid appointment**. Отдельные дорожные карты AI, CRM, marketplace, fintech и editor подчиняются этому bet.

### Правило новой функции

Функция не попадает в roadmap, пока не отвечает на пять вопросов:

1. Какой этап revenue loop она улучшает?
2. Для какого ICP?
3. Какое событие и метрика докажут эффект?
4. Что будет остановлено или скрыто взамен?
5. Как функция обрабатывает ошибки, приватность, локализацию и поддержку?

### Definition of done для коммерческого пути

- happy path и recovery path покрыты E2E;
- события аналитики валидированы;
- RU/KK и валюта проверены автоматически;
- mobile public page проходит performance budget;
- нет новых lint warnings;
- payment/notification действия идемпотентны;
- есть support playbook и rollback;
- пользовательское обещание совпадает с реальным тарифом.

## 16. Риски

| Риск | Вероятность / ущерб | Митигация |
|---|---|---|
| Продолжение feature sprawl | Высокая / высокая | 90-дневный product bet, kill list, progressive disclosure |
| Ненадежные платежи/booking | Средняя / критическая | idempotency, audit trail, reconciliation, E2E, staged rollout |
| Комиссия вызывает обход | Высокая / высокая | 0% direct platform fee test, acquisition fee только за marketplace value |
| Fake reviews/marketplace abuse | Средняя / высокая | verified completion, moderation, appeals, fraud signals |
| Telegram/payment policy mismatch | Средняя / высокая | отдельные правила для digital goods и physical services, legal review |
| Локализация портит доверие | Высокая / средняя | locale CI, encoding checks, human review RU/KK |
| AI отправляет ошибочные сообщения | Средняя / высокая | approval by default, audit log, frequency caps, opt-out |
| Privacy/analytics compliance | Средняя / высокая | data minimization, consent design, retention limits, legal review |
| Команда не может поддерживать поверхность | Высокая / высокая | hide/deprecate unused modules, ownership map, SLO и error budget |

## 17. Конкретный первый двухнедельный спринт

### Product/UX

- Выбрать одну формулировку позиционирования и заменить ей hero, auth и onboarding.
- Нарисовать один golden path от signup до completed appointment.
- Упростить Home до outcome summary + next best action.
- Зафиксировать Beauty Revenue Kit v1 и провести 5 usability sessions.

### Engineering

- Исправить блокирующий lint error и ввести warning ratchet.
- Найти первопричину повторного рендера секций, добавить visual regression на ключевые экраны.
- Исправить canonical demo route и smoke test публичного URL.
- Создать типизированный event dictionary и тесты server/client event parity.
- Исправить валюту/телефон/i18n encoding и добавить locale validation в CI.

### Data

- PostHog funnel: signup → kit selected → service added → availability set → published → qualified visit → booking started → confirmed → paid → completed.
- Retention cohorts по `completed_paid_appointment`, а не login.
- Dashboard качества событий: missing visitor/session/source, duplicates, late events, refund reconciliation.

### GTM

- Набрать 10 активных и 10 churned мастеров.
- Обновить demo и один honest case study.
- Продать concierge pilot до строительства новых модулей.
- Записать objections: комиссия, Kaspi, расписание, no-show, WhatsApp/Telegram, доверие клиента.

### Решения, которые должны быть приняты к концу спринта

1. Beauty solo — официальный первый ICP или нет.
2. North Star = completed paid appointment или иной завершенный outcome.
3. Тестируем ли отмену 7% комиссии для direct traffic.
4. Какие существующие модули скрываются из default experience на 90 дней.

## 18. Приоритетный backlog в формате RICE-lite

Оценки относительные: 5 — максимум. Перед реализацией их нужно заменить фактическим reach из аналитики.

| Initiative | Reach | Impact | Confidence | Effort (обратно) | Приоритет |
|---|---:|---:|---:|---:|---:|
| Исправление дублей, demo, i18n и тарифной истины | 5 | 5 | 5 | 4 | **P0** |
| Revenue event model + PostHog funnels | 5 | 5 | 5 | 3 | **P0** |
| Beauty Revenue Kit + guided onboarding | 5 | 5 | 4 | 3 | **P0** |
| Deposit/no-show flow | 4 | 5 | 4 | 3 | **P0** |
| Unified client timeline | 4 | 4 | 4 | 3 | **P1** |
| Rebooking + verified reviews | 4 | 5 | 4 | 3 | **P1** |
| Pricing/commission experiment | 4 | 5 | 3 | 4 | **P1** |
| Curated gallery | 3 | 4 | 4 | 4 | **P1** |
| Local marketplace | 3 | 5 | 2 | 2 | **P2** |
| Studio operations | 2 | 4 | 2 | 2 | **P3** |
| White-label/API marketplace | 1 | 4 | 2 | 1 | **P3** |

## 19. Что должно стать moat

Не редактор и не количество блоков. Их легко повторить. Защитимость LinkMAX может состоять из четырех слоев:

1. **Локальный revenue graph:** источник → услуга → запись → оплата → визит → повтор, адаптированный под KZT, Telegram/WhatsApp и местные способы оплаты.
2. **Вертикальные operating recipes:** реальные booking, cancellation, reminder и rebooking паттерны для конкретных услуг.
3. **Trust graph:** проверенные визиты, отзывы, портфолио и надежность специалиста.
4. **Demand network:** локальный marketplace и партнерские каналы, которые приносят новых клиентов, а не просто обслуживают существующий трафик.

## 20. Финальный критерий успеха

Через 12 месяцев пользователь должен описывать LinkMAX не как «конструктор ссылок» и не как «много функций в одном месте», а так:

> «Я поставила одну ссылку в Instagram. Клиент видит мои работы и цены, сам выбирает время, вносит депозит, получает напоминание, а через нужный срок LinkMAX возвращает его на следующую запись.»

Если продукт стабильно выполняет это обещание, подписка, marketplace fee, studio plan и соседние вертикали становятся естественным расширением. Если не выполняет, дополнительные AI, CRM, документы и автоматизации только увеличивают стоимость поддержки.

---

## Основные внешние источники

- [Linktree pricing](https://linktr.ee/s/pricing) и [features](https://linktr.ee/features)
- [Beacons plans](https://home.beacons.ai/plans)
- [Stan plan comparison, обновлено в 2026](https://help.stan.store/article/31-creator-vs-creator-pro)
- [Taplink](https://taplink.at/en/)
- [Fresha features](https://www.fresha.com/for-business/features) и [marketplace fee model](https://www.fresha.com/help-center/knowledge-base/billing-and-fees/188-marketplace-new-client-fees)
- [Booksy for business](https://biz.booksy.com/)
- [YCLIENTS](https://www.yclients.com/)
- [Altegio](https://alteg.io/en/)
- [HoneyBook](https://www.honeybook.com/)
- [Calendly features](https://calendly.com/features) и [release notes](https://calendly.com/release-notes)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps), [bot platform](https://core.telegram.org/bots/features) и [Stars](https://core.telegram.org/bots/payments-stars)
- Open-source: [LinkStack](https://github.com/LinkStackOrg/LinkStack), [LittleLink](https://github.com/sethcottle/littlelink), [Dub](https://github.com/dubinc/dub), [Cal.com/Cal.diy](https://github.com/calcom/cal.com), [Twenty](https://github.com/twentyhq/twenty), [Formbricks](https://github.com/formbricks/formbricks), [PostHog](https://github.com/PostHog/posthog), [n8n](https://github.com/n8n-io/n8n), [Novu](https://github.com/novuhq/novu), [Documenso](https://github.com/documenso/documenso)

