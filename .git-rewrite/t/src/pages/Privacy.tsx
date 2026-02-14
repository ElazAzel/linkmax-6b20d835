import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_DETAILS } from '@/components/legal/TermsOfServiceModal';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const canonical = 'https://lnkmx.my/privacy';
  const seoTitle =
    lang === 'ru'
      ? 'Политика конфиденциальности — lnkmx'
      : lang === 'kk'
        ? 'Құпиялылық саясаты — lnkmx'
        : 'Privacy Policy — lnkmx';
  const seoDescription =
    lang === 'ru'
      ? 'Политика конфиденциальности lnkmx: какие данные обрабатываются и как они защищаются.'
      : lang === 'kk'
        ? 'lnkmx құпиялылық саясаты: қандай деректер өңделеді және қалай қорғалады.'
        : 'Privacy policy for lnkmx: what data is processed and how it is protected.';

  const getPrivacyContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">LinkMAX Platform Privacy Policy</h1>
          <p className="mb-6 text-muted-foreground">Version: 1.0</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. General Provisions</h2>
          <p className="mb-2">1.1. This Privacy Policy (hereinafter - "Policy") defines the procedure for processing and protecting personal data when using the LinkMAX platform (hereinafter - "Platform", "LinkMAX").</p>
          <p className="mb-2">1.2. The Policy applies to data of Platform Users, as well as data of third parties (leads/clients) that the User collects through pages, forms, and mini CRM (hereinafter - "Client Data/Leads").</p>
          <p className="mb-4">1.3. By using the Platform, the User confirms familiarity and agreement with the Policy (to the extent required by law and product settings).</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Operator and Contacts</h2>
          <p className="mb-2">2.1. Personal data operator (Administration): {COMPANY_DETAILS.name}, BIN (IIN) {COMPANY_DETAILS.bin}, address: {COMPANY_DETAILS.address}.</p>
          <p className="mb-2">2.2. Contact for personal data inquiries: {COMPANY_DETAILS.email}.</p>
          <p className="mb-4">2.3. The current version of the Policy is available at: https://lnkmx.my/privacy.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Terms</h2>
          <p className="mb-2">3.1. User - a legally capable individual who has registered an account on the Platform.</p>
          <p className="mb-2">3.2. Account (Profile) - User's account on the Platform.</p>
          <p className="mb-2">3.3. Personal data - any information relating to a directly or indirectly identifiable individual.</p>
          <p className="mb-4">3.4. Client Data/Leads - data of visitors to User's pages submitted through forms/mini CRM and other collection mechanisms.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Regulatory Framework</h2>
          <p className="mb-4">4.1. Processing and protection of personal data is carried out in accordance with the legislation of the Republic of Kazakhstan on personal data, including Law No. 94-V dated May 21, 2013 "On Personal Data and Their Protection".</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. What Data is Processed</h2>
          <p className="mb-2">5.1. User Data may include: name/username, email, phone (if provided), Telegram ID (if connected), country/region, interface language, account information (plan, subscription period, payment history), page settings, and technical data (IP address, browser/device data, cookies).</p>
          <p className="mb-2">5.2. Client Data/Leads may include: name, contact details, application content, lead status, interaction history (within mini CRM).</p>
          <p className="mb-4">5.3. The Platform does not aim to collect excessive data and strives for minimization.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Purposes and Grounds for Processing</h2>
          <p className="mb-2">6.1. Purposes of personal data processing include: Registration, authentication, and account support; Providing access to Platform functionality (page editor, publishing, analytics, mini CRM); Sending technical notifications and service messages; Improving service quality, error diagnostics, and security; Fulfilling contractual obligations (including subscriptions and B2B interactions if applicable).</p>
          <p className="mb-4">6.2. Processing grounds: contract/user agreement execution, data subject consent (if required), and legal requirements.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies and Analytics</h2>
          <p className="mb-2">7.1. The Platform may use cookies and similar technologies for proper operation, authentication, protection, and analytics.</p>
          <p className="mb-2">7.2. Cookie types may include: strictly necessary, functional, and analytical.</p>
          <p className="mb-4">7.3. The User may restrict cookies in browser settings; however, some Platform functions may not work correctly.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Services and Data Transfers</h2>
          <p className="mb-2">8.1. For Platform operation, third-party infrastructure and analytics providers may be used (e.g., analytics/attribution services and cloud services), to which a limited set of technical data (IP, cookies, device identifiers) may be transferred to the extent necessary for providing functions.</p>
          <p className="mb-2">8.2. When the User connects integrations (e.g., YouTube/Google API and other platform APIs), data processing may also be governed by the respective platform policies, and permission management may be done in the provider's account settings.</p>
          <p className="mb-4">8.3. The Administration does not sell Users' personal data to third parties.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Storage Terms and Deletion</h2>
          <p className="mb-2">9.1. Data is stored for the duration of the account and/or the period necessary to achieve processing purposes, as well as periods established by law.</p>
          <p className="mb-2">9.2. Upon achieving processing purposes or withdrawal of consent (when applicable), data is deleted or anonymized unless otherwise required by law.</p>
          <p className="mb-4">9.3. The User may delete their account and content from the Platform interface (if available) or submit a support request.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Data Security</h2>
          <p className="mb-2">10.1. The Administration takes organizational and technical measures to protect data from unauthorized access, modification, disclosure, and destruction.</p>
          <p className="mb-4">10.2. Measures may include: HTTPS, role-based access control, password encryption/hashing, software updates, backup.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Personal Data Subject Rights</h2>
          <p className="mb-2">11.1. The User has the right to request information about data processing, require clarification/update, blocking or deletion of data, and withdraw consent to processing (in cases provided by law).</p>
          <p className="mb-4">11.2. To exercise rights, the User may send a request to {COMPANY_DETAILS.email}.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Policy Changes</h2>
          <p className="mb-4">12.1. The Administration may update the Policy; the new version takes effect upon publication at https://lnkmx.my/privacy unless otherwise specified.</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">LinkMAX платформасының құпиялылық саясаты</h1>
          <p className="mb-6 text-muted-foreground">Нұсқа: 1.0</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Жалпы ережелер</h2>
          <p className="mb-2">1.1. Осы Құпиялылық саясаты (бұдан әрі - «Саясат») LinkMAX платформасын (бұдан әрі - «Платформа», «LinkMAX») пайдалану кезінде дербес деректерді өңдеу және қорғау тәртібін анықтайды.</p>
          <p className="mb-2">1.2. Саясат Платформа Пайдаланушыларының деректеріне, сондай-ақ Пайдаланушы беттер, нысандар және mini CRM арқылы жинайтын үшінші тараптардың (лидтердің/клиенттердің) деректеріне (бұдан әрі - «Клиенттік деректер/Лидтер») қолданылады.</p>
          <p className="mb-4">1.3. Платформаны пайдалана отырып, Пайдаланушы Саясатпен танысқанын және келіскенін растайды.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Оператор және байланыстар</h2>
          <p className="mb-2">2.1. Дербес деректер операторы (Әкімшілік): {COMPANY_DETAILS.name}, БСН (ЖСН) {COMPANY_DETAILS.bin}, мекенжай: {COMPANY_DETAILS.address}.</p>
          <p className="mb-2">2.2. Дербес деректер бойынша сұрауларға байланыс: {COMPANY_DETAILS.email}.</p>
          <p className="mb-4">2.3. Саясаттың ағымдағы нұсқасы мына мекенжайда қол жетімді: https://lnkmx.my/privacy.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3-12. Толық мәтін</h2>
          <p className="mb-4">Толық ақпарат алу үшін орыс немесе ағылшын нұсқасын қараңыз.</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности платформы LinkMAX</h1>
        <p className="mb-6 text-muted-foreground">Версия: 1.0</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Общие положения</h2>
        <p className="mb-2">1.1. Настоящая Политика конфиденциальности (далее - «Политика») определяет порядок обработки и защиты персональных данных при использовании платформы LinkMAX (далее - «Платформа», «LinkMAX»).</p>
        <p className="mb-2">1.2. Политика действует в отношении данных Пользователей Платформы, а также данных третьих лиц (лидов/клиентов), которые Пользователь собирает через страницы, формы и mini CRM (далее - «Клиентские данные/Лиды»).</p>
        <p className="mb-4">1.3. Используя Платформу, Пользователь подтверждает ознакомление и согласие с Политикой (в части, требуемой законом и настройками продукта).</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Оператор и контакты</h2>
        <p className="mb-2">2.1. Оператор персональных данных (Администрация): {COMPANY_DETAILS.name}, БИН (ИИН) {COMPANY_DETAILS.bin}, адрес: {COMPANY_DETAILS.address}.</p>
        <p className="mb-2">2.2. Контакты для обращений по персональным данным: {COMPANY_DETAILS.email}.</p>
        <p className="mb-4">2.3. Актуальная версия Политики размещается по адресу: https://lnkmx.my/privacy.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Термины</h2>
        <p className="mb-2">3.1. Пользователь - дееспособное физическое лицо, зарегистрировавшее аккаунт на Платформе.</p>
        <p className="mb-2">3.2. Аккаунт (Профиль) - учётная запись Пользователя на Платформе.</p>
        <p className="mb-2">3.3. Персональные данные - любая информация, относящаяся к прямо или косвенно определяемому физическому лицу.</p>
        <p className="mb-4">3.4. Клиентские данные/Лиды - данные посетителей страниц Пользователя, оставленные через формы/mini CRM и иные механизмы сбора.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Нормативная база</h2>
        <p className="mb-4">4.1. Обработка и защита персональных данных осуществляются в соответствии с законодательством Республики Казахстан о персональных данных, включая Закон РК от 21 мая 2013 года № 94-V «О персональных данных и их защите».</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Какие данные обрабатываются</h2>
        <p className="mb-2">5.1. Данные Пользователей могут включать: имя/username, email, телефон (если предоставлен), Telegram ID (если подключён), страна/регион, язык интерфейса, сведения об аккаунте (тариф, срок подписки, история платежей), настройки страниц, а также технические данные (IP-адрес, данные браузера/устройства, cookies).</p>
        <p className="mb-2">5.2. Клиентские данные/Лиды могут включать: имя, контактные данные, содержание заявки/сообщения, статус лида, историю взаимодействий (в рамках mini CRM).</p>
        <p className="mb-4">5.3. Платформа не преследует цель сбора избыточных данных и стремится к минимизации.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Цели и основания обработки</h2>
        <p className="mb-2">6.1. Цели обработки персональных данных включают: Регистрация, аутентификация и поддержка работы аккаунта; Предоставление доступа к функционалу Платформы (редактор страниц, публикация, аналитика, mini CRM); Отправка технических уведомлений и сервисных сообщений; Улучшение качества сервиса, диагностика ошибок и безопасность; Исполнение договорных обязательств (в т.ч. подписки и B2B-взаимодействие при наличии).</p>
        <p className="mb-4">6.2. Основания обработки: исполнение договора/пользовательского соглашения, согласие субъекта данных (если требуется), а также требования закона.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies и аналитика</h2>
        <p className="mb-2">7.1. Платформа может использовать cookies и аналогичные технологии для корректной работы, аутентификации, защиты и аналитики.</p>
        <p className="mb-2">7.2. Типы cookies могут включать: строго необходимые, функциональные и аналитические.</p>
        <p className="mb-4">7.3. Пользователь может ограничить cookies в настройках браузера; при этом часть функций Платформы может работать некорректно.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Сторонние сервисы и передачи данных</h2>
        <p className="mb-2">8.1. Для работы Платформы могут использоваться сторонние поставщики инфраструктуры и аналитики (например, сервисы аналитики/атрибуции и облачные сервисы), которым может передаваться ограниченный набор технических данных (IP, cookies, идентификаторы устройства) в объёме, необходимом для предоставления функций.</p>
        <p className="mb-2">8.2. При подключении Пользователем интеграций (например, YouTube/Google API и другие платформенные API) обработка данных может также регулироваться политиками соответствующих платформ, а управление разрешениями может осуществляться в настройках аккаунта провайдера.</p>
        <p className="mb-4">8.3. Администрация не продаёт персональные данные Пользователей третьим лицам.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Сроки хранения и удаление</h2>
        <p className="mb-2">9.1. Данные хранятся в течение срока действия аккаунта и/или периода, необходимого для достижения целей обработки, а также сроков, установленных законом.</p>
        <p className="mb-2">9.2. По достижении целей обработки или при отзыве согласия (когда применимо) данные удаляются или обезличиваются, если иное не требуется законом.</p>
        <p className="mb-4">9.3. Пользователь может удалить аккаунт и контент из интерфейса Платформы (если функция доступна) либо направить запрос в поддержку.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Безопасность данных</h2>
        <p className="mb-2">10.1. Администрация принимает организационные и технические меры для защиты данных от неправомерного доступа, изменения, раскрытия и уничтожения.</p>
        <p className="mb-4">10.2. Меры могут включать: HTTPS, контроль доступа по ролям, шифрование/хэширование паролей, обновления ПО, резервное копирование.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Права субъекта персональных данных</h2>
        <p className="mb-2">11.1. Пользователь вправе запросить информацию об обработке данных, требовать уточнения/обновления, блокирования или удаления данных, а также отозвать согласие на обработку (в случаях, предусмотренных законом).</p>
        <p className="mb-4">11.2. Для реализации прав Пользователь может направить запрос на {COMPANY_DETAILS.email}.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Изменение Политики</h2>
        <p className="mb-4">12.1. Администрация вправе обновлять Политику; новая редакция вступает в силу с момента публикации на https://lnkmx.my/privacy, если не указано иное.</p>
      </>
    );
  };

  return (
    <>
      <StaticSEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        currentLanguage={lang}
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
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
            {getPrivacyContent()}
          </article>
        </div>
      </div>
    </>
  );
};

export default Privacy;
