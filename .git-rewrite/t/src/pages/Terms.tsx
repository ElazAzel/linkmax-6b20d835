import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOHead } from '@/components/SEOHead';
import { COMPANY_DETAILS } from '@/components/legal/TermsOfServiceModal';

const Terms = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const getTermsContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">LinkMAX Platform User Agreement</h1>
          <p className="mb-6 text-muted-foreground">Version: 1.0 | Effective: January 5, 2026</p>
          
          <p className="mb-6">
            The LinkMAX Platform User Agreement (hereinafter - "Agreement") governs access to and use of the LinkMAX web platform and related services (hereinafter - "Platform"), including the website, subdomains, PWA, and API. By using the Platform and/or creating an account, the User confirms that they have read and accept this Agreement, the Privacy Policy, and applicable Payment Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Rights Holder Details</h2>
          <p className="mb-2">Rights Holder/Administration: {COMPANY_DETAILS.name}, BIN (IIN) {COMPANY_DETAILS.bin}.</p>
          <p className="mb-2">Address: {COMPANY_DETAILS.address}.</p>
          <p className="mb-2">Bank: {COMPANY_DETAILS.bank}, BIC {COMPANY_DETAILS.bik}, KBe {COMPANY_DETAILS.kbe}, Account {COMPANY_DETAILS.account}.</p>
          <p className="mb-4">Email: {COMPANY_DETAILS.email}, Phone: {COMPANY_DETAILS.phone}.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Terms and Definitions</h2>
          <p className="mb-2">2.1. LinkMAX - an online platform for creating personal mini-sites (link-in-bio pages/micro-landings), analytics, and lead management, including AI-based features.</p>
          <p className="mb-2">2.2. Platform - the website https://lnkmx.my, subdomains, API, PWA, and other interfaces for accessing LinkMAX services.</p>
          <p className="mb-2">2.3. User - a legally capable individual and/or representative of a legal entity/sole proprietor using the Platform.</p>
          <p className="mb-2">2.4. Account - User's account (email/password, social logins, Telegram ID, etc.) for authentication.</p>
          <p className="mb-2">2.5. User Content - any materials posted by the User (texts, images, videos, links, products, forms, files, etc.).</p>
          <p className="mb-2">2.6. Public Page - User's page/mini-site available at a unique address (slug).</p>
          <p className="mb-2">2.7. Privacy Policy - document on personal data processing at https://lnkmx.my/privacy.</p>
          <p className="mb-4">2.8. Payment Terms - separate document with payment/refund/commission/provider terms published by the Administration on the Platform.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Subject of Agreement and Acceptance</h2>
          <p className="mb-2">3.1. The Administration provides the User access to the Platform and Services on an "as is" basis and within the selected functionality (free and/or paid).</p>
          <p className="mb-2">3.2. The Agreement is a public offer; acceptance is registration, subscription payment (if applicable), and/or actual use of the Platform.</p>
          <p className="mb-4">3.3. The Administration may modify the Agreement; the new version takes effect upon publication on the Platform unless otherwise specified.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Registration, Access, and Account Security</h2>
          <p className="mb-2">4.1. Registration is possible via email/password and/or third-party login methods (e.g., Google/Apple) and/or Telegram verification (if available).</p>
          <p className="mb-2">4.2. The User agrees to provide accurate information and keep it up to date.</p>
          <p className="mb-2">4.3. The User is responsible for the security of access credentials and all actions performed in the Account.</p>
          <p className="mb-4">4.4. Certain features (e.g., notifications, mini CRM) may require linking a Telegram account through the official LinkMAX bot (if the feature is included in the product).</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Usage Rules and Prohibitions</h2>
          <p className="mb-2">5.1. The User agrees to use the Platform only legally and not to violate third-party rights.</p>
          <p className="mb-2">5.2. It is prohibited to post Content that: violates copyright/related rights; contains fraud; illegal advertising; extremism; pornography; calls to violence; third-party personal data without consent; and other legally prohibited materials.</p>
          <p className="mb-4">5.3. The User agrees not to take actions aimed at disrupting Platform operation, bypassing restrictions, or unauthorized access to data/accounts.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Services, Integrations, and API</h2>
          <p className="mb-2">6.1. The Platform may provide integrations and API access (if available), including for connecting with external platforms/services.</p>
          <p className="mb-4">6.2. When using API/integrations, the User must comply with the rules and terms of the respective platforms and not use integrations to violate the law or third-party rights.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Paid Features and Payment</h2>
          <p className="mb-2">7.1. The Platform may include paid plans/subscriptions (e.g., PRO/BUSINESS) and additional services.</p>
          <p className="mb-2">7.2. Payment terms, refunds, payment providers, subscription periods, commissions, and other financial terms are governed by Payment Terms, which are an integral part of the Agreement.</p>
          <p className="mb-4">7.3. Current prices and plan details are published at https://lnkmx.my/pricing; changes apply to new periods/purchases unless otherwise specified in Payment Terms.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. User Content and Intellectual Property</h2>
          <p className="mb-2">8.1. All exclusive rights to the Platform (code, design, brand, documentation) belong to the Administration or are used on legal grounds.</p>
          <p className="mb-4">8.2. The User retains rights to their Content but grants the Administration a non-exclusive license to store, reproduce, display, technically process, and create backups to the extent necessary for Platform operation.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Moderation, Restrictions, and Blocking</h2>
          <p className="mb-2">9.1. The Administration may moderate pages/profiles/Content to comply with the law and this Agreement.</p>
          <p className="mb-4">9.2. In case of violations, the Administration may restrict functionality, remove/hide materials, suspend or block the Account, including without prior notice (when necessary for security/legal compliance).</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
          <p className="mb-2">10.1. The Platform is provided "as is"; the Administration does not guarantee uninterrupted operation, absence of errors, and compliance with User expectations.</p>
          <p className="mb-4">10.2. The Administration is not liable for indirect damages, lost profits, or losses caused by User actions, third parties, or force majeure.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Term and Termination</h2>
          <p className="mb-2">11.1. The Agreement is effective from acceptance until termination of Platform use or termination according to Agreement/Payment Terms (for subscriptions).</p>
          <p className="mb-2">11.2. The User may terminate Platform use and delete the account (if available) or submit a support request.</p>
          <p className="mb-4">11.3. The Administration may terminate User access upon Agreement violation, legal requirements, or to protect Platform security.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Applicable Law and Dispute Resolution</h2>
          <p className="mb-2">12.1. The Agreement is governed by the laws of the Republic of Kazakhstan.</p>
          <p className="mb-4">12.2. Disputes are resolved through negotiations; if not resolved - in court at the Administration's place of registration.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contacts and Notifications</h2>
          <p className="mb-2">13.1. Inquiries/claims should be sent to {COMPANY_DETAILS.email}.</p>
          <p className="mb-4">13.2. The current version of the Agreement is available at: https://lnkmx.my/terms.</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">LinkMAX платформасының пайдаланушы келісімі</h1>
          <p className="mb-6 text-muted-foreground">Нұсқа: 1.0 | Күшіне енеді: 2026 жылғы 5 қаңтар</p>
          
          <p className="mb-6">
            LinkMAX платформасының пайдаланушы келісімі (бұдан әрі - «Келісім») LinkMAX веб-платформасына және байланысты қызметтерге (бұдан әрі - «Платформа»), соның ішінде веб-сайтқа, қосалқы домендерге, PWA және API-ға қол жеткізу мен пайдалану тәртібін реттейді. Платформаны пайдалана бастау және/немесе аккаунт жасау арқылы Пайдаланушы осы Келісімді, Құпиялылық саясатын және қолданылатын Төлем шарттарын оқығанын және қабылдағанын растайды.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Құқық иесінің деректемелері</h2>
          <p className="mb-2">Құқық иесі/Әкімшілік: {COMPANY_DETAILS.name}, БСН (ЖСН) {COMPANY_DETAILS.bin}.</p>
          <p className="mb-2">Мекенжай: {COMPANY_DETAILS.address}.</p>
          <p className="mb-2">Банк: {COMPANY_DETAILS.bank}, БСК {COMPANY_DETAILS.bik}, КБе {COMPANY_DETAILS.kbe}, Шот {COMPANY_DETAILS.account}.</p>
          <p className="mb-4">Email: {COMPANY_DETAILS.email}, Телефон: {COMPANY_DETAILS.phone}.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2-13. Толық мәтін</h2>
          <p className="mb-4">Толық ақпарат алу үшін орыс немесе ағылшын нұсқасын қараңыз.</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h1 className="text-3xl font-bold mb-6">Пользовательское соглашение платформы LinkMAX</h1>
        <p className="mb-6 text-muted-foreground">Версия: 1.0 | Дата вступления в силу: 05.01.2026</p>
        
        <p className="mb-6">
          Пользовательское соглашение платформы LinkMAX (далее - «Соглашение») регулирует порядок доступа и использования веб-платформы LinkMAX и связанных сервисов (далее - «Платформа»), включая сайт, поддомены, PWA и API. Начиная использование Платформы и/или создавая аккаунт, Пользователь подтверждает, что прочитал и принимает настоящее Соглашение, Политику конфиденциальности и применимые условия оплаты (Payment Terms).
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Реквизиты правообладателя</h2>
        <p className="mb-2">Правообладатель/Администрация: {COMPANY_DETAILS.name}, БИН (ИИН) {COMPANY_DETAILS.bin}.</p>
        <p className="mb-2">Адрес: {COMPANY_DETAILS.address}.</p>
        <p className="mb-2">Банк: {COMPANY_DETAILS.bank}, БИК {COMPANY_DETAILS.bik}, КБе {COMPANY_DETAILS.kbe}, счёт {COMPANY_DETAILS.account}.</p>
        <p className="mb-4">Email: {COMPANY_DETAILS.email}, телефон: {COMPANY_DETAILS.phone}.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Термины и определения</h2>
        <p className="mb-2">2.1. LinkMAX - онлайн-платформа для создания персональных мини-сайтов (link-in-bio страниц/микролендингов), аналитики и управления лидами, включая функции на базе ИИ.</p>
        <p className="mb-2">2.2. Платформа - сайт https://lnkmx.my, поддомены, API, PWA и иные интерфейсы доступа к сервисам LinkMAX.</p>
        <p className="mb-2">2.3. Пользователь - дееспособное физическое лицо и/или представитель юрлица/ИП, использующий Платформу.</p>
        <p className="mb-2">2.4. Аккаунт - учётная запись Пользователя (email/пароль, соц. логины, Telegram ID и пр.) для аутентификации.</p>
        <p className="mb-2">2.5. Контент Пользователя - любые материалы, размещаемые Пользователем (тексты, изображения, видео, ссылки, товары, формы, файлы и др.).</p>
        <p className="mb-2">2.6. Публичная страница (Page) - страница/мини-сайт Пользователя, доступный по уникальному адресу (slug).</p>
        <p className="mb-2">2.7. Политика конфиденциальности - документ по обработке персональных данных по адресу https://lnkmx.my/privacy.</p>
        <p className="mb-4">2.8. Payment Terms (Условия оплаты) - отдельный документ с условиями оплаты/возвратов/комиссий/провайдерами, размещаемый Администрацией на Платформе.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Предмет соглашения и акцепт</h2>
        <p className="mb-2">3.1. Администрация предоставляет Пользователю доступ к Платформе и Сервисам на условиях «как есть» и в пределах выбранного функционала (бесплатного и/или платного).</p>
        <p className="mb-2">3.2. Соглашение является публичной офертой; акцептом является регистрация, оплата подписки (если применимо) и/или фактическое использование Платформы.</p>
        <p className="mb-4">3.3. Администрация вправе изменять Соглашение; новая редакция вступает в силу с момента публикации на Платформе, если не указано иное.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Регистрация, доступ и безопасность аккаунта</h2>
        <p className="mb-2">4.1. Регистрация возможна через email/пароль и/или сторонние методы входа (например, Google/Apple) и/или Telegram верификацию (если доступна).</p>
        <p className="mb-2">4.2. Пользователь обязуется указывать достоверные данные и поддерживать их актуальность.</p>
        <p className="mb-2">4.3. Пользователь несёт ответственность за сохранность данных доступа и за все действия, совершенные в Аккаунте.</p>
        <p className="mb-4">4.4. Для отдельных функций (например, уведомления, mini CRM) может требоваться привязка Telegram аккаунта через официального бота LinkMAX (если функция включена в продукт).</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Правила использования и запреты</h2>
        <p className="mb-2">5.1. Пользователь обязуется использовать Платформу только законным способом и не нарушать права третьих лиц.</p>
        <p className="mb-2">5.2. Запрещается размещать Контент, который: нарушает авторские/смежные права; содержит мошенничество; незаконную рекламу; экстремизм; порнографию; призывы к насилию; персональные данные третьих лиц без согласия и иные запрещённые законом материалы.</p>
        <p className="mb-4">5.3. Пользователь обязуется не предпринимать действий, направленных на нарушение работы Платформы, обход ограничений, несанкционированный доступ к данным/аккаунтам.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Сервисы, интеграции и API</h2>
        <p className="mb-2">6.1. Платформа может предоставлять интеграции и API доступ (при наличии), в том числе для связи с внешними платформами/сервисами.</p>
        <p className="mb-4">6.2. При использовании API/интеграций Пользователь обязан соблюдать правила и условия соответствующих платформ и не использовать интеграции для нарушений закона или прав третьих лиц.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Платные функции и оплата</h2>
        <p className="mb-2">7.1. Платформа может включать платные тарифы/подписки (например, PRO/BUSINESS) и дополнительные услуги.</p>
        <p className="mb-2">7.2. Условия оплаты, возвратов, провайдеры платежей, период подписки, комиссии и иные финансовые условия регулируются Payment Terms, которые являются неотъемлемой частью Соглашения.</p>
        <p className="mb-4">7.3. Актуальные цены и состав тарифов публикуются на https://lnkmx.my/pricing; изменения применяются для новых периодов/покупок, если не указано иное в Payment Terms.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Контент пользователя и интеллектуальная собственность</h2>
        <p className="mb-2">8.1. Все исключительные права на Платформу (код, дизайн, бренд, документация) принадлежат Администрации или используются на законных основаниях.</p>
        <p className="mb-4">8.2. Пользователь сохраняет права на свой Контент, но предоставляет Администрации неисключительную лицензию на хранение, воспроизведение, отображение, техническую обработку и создание резервных копий в объёме, необходимом для работы Платформы.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Модерация, ограничения и блокировка</h2>
        <p className="mb-2">9.1. Администрация вправе модерировать страницы/профили/Контент для соблюдения закона и настоящего Соглашения.</p>
        <p className="mb-4">9.2. При нарушении условий Администрация может ограничить функционал, удалить/скрыть материалы, приостановить или заблокировать Аккаунт, в том числе без предварительного уведомления (когда это необходимо для безопасности/соблюдения закона).</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Ограничение ответственности</h2>
        <p className="mb-2">10.1. Платформа предоставляется «как есть»; Администрация не гарантирует бесперебойную работу, отсутствие ошибок и соответствие ожиданиям Пользователя.</p>
        <p className="mb-4">10.2. Администрация не отвечает за косвенный ущерб, упущенную выгоду, а также за потери, вызванные действиями Пользователя, третьих лиц или форс-мажором.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Срок действия и прекращение</h2>
        <p className="mb-2">11.1. Соглашение действует с момента акцепта и до прекращения использования Платформы либо расторжения согласно условиям Соглашения/Payment Terms (для подписок).</p>
        <p className="mb-2">11.2. Пользователь вправе прекратить использование Платформы и удалить аккаунт (если доступно) либо направить запрос в поддержку.</p>
        <p className="mb-4">11.3. Администрация вправе прекратить доступ Пользователя при нарушении Соглашения, требованиях закона или для защиты безопасности Платформы.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Применимое право и разрешение споров</h2>
        <p className="mb-2">12.1. К Соглашению применяется законодательство Республики Казахстан.</p>
        <p className="mb-4">12.2. Споры решаются путём переговоров; при недостижении соглашения - в суде по месту регистрации Администрации.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Контакты и уведомления</h2>
        <p className="mb-2">13.1. Обращения/претензии направляются на {COMPANY_DETAILS.email}.</p>
        <p className="mb-4">13.2. Актуальная версия Соглашения доступна по адресу: https://lnkmx.my/terms.</p>
      </>
    );
  };

  return (
    <>
      <SEOHead
        title={lang === 'ru' ? 'Пользовательское соглашение - LinkMAX' : lang === 'kk' ? 'Пайдаланушы келісімі - LinkMAX' : 'Terms of Service - LinkMAX'}
        description={lang === 'ru' ? 'Пользовательское соглашение платформы LinkMAX' : lang === 'kk' ? 'LinkMAX платформасының пайдаланушы келісімі' : 'LinkMAX Platform User Agreement'}
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
          
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {getTermsContent()}
          </article>
        </div>
      </div>
    </>
  );
};

export default Terms;
