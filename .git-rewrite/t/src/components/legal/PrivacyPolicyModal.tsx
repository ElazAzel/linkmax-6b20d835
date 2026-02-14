import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { COMPANY_DETAILS } from './TermsOfServiceModal';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const getPrivacyContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX Platform Privacy Policy</h2>
          <p className="mb-4 text-sm text-muted-foreground">Version: 1.0</p>
          
          <h3 className="font-semibold mt-6 mb-2">1. General Provisions</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. This Privacy Policy (hereinafter - "Policy") defines the procedure for processing and protecting personal data when using the LinkMAX platform (hereinafter - "Platform", "LinkMAX").</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. The Policy applies to data of Platform Users, as well as data of third parties (leads/clients) that the User collects through pages, forms, and mini CRM (hereinafter - "Client Data/Leads").</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. By using the Platform, the User confirms familiarity and agreement with the Policy (to the extent required by law and product settings).</p>

          <h3 className="font-semibold mt-6 mb-2">2. Operator and Contacts</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. Personal data operator (Administration): {COMPANY_DETAILS.name}, BIN (IIN) {COMPANY_DETAILS.bin}, address: {COMPANY_DETAILS.address}.</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Contact for personal data inquiries: {COMPANY_DETAILS.email}.</p>
          <p className="text-sm text-muted-foreground mb-2">2.3. The current version of the Policy is available at: https://lnkmx.my/privacy.</p>

          <h3 className="font-semibold mt-6 mb-2">3. Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. User - a legally capable individual who has registered an account on the Platform.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. Account (Profile) - User's account on the Platform.</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Personal data - any information relating to a directly or indirectly identifiable individual.</p>
          <p className="text-sm text-muted-foreground mb-2">3.4. Client Data/Leads - data of visitors to User's pages submitted through forms/mini CRM and other collection mechanisms.</p>

          <h3 className="font-semibold mt-6 mb-2">4. Regulatory Framework</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. Processing and protection of personal data is carried out in accordance with the legislation of the Republic of Kazakhstan on personal data, including Law No. 94-V dated May 21, 2013 "On Personal Data and Their Protection".</p>

          <h3 className="font-semibold mt-6 mb-2">5. What Data is Processed</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. User Data may include: name/username, email, phone (if provided), Telegram ID (if connected), country/region, interface language, account information (plan, subscription period, payment history), page settings, and technical data (IP address, browser/device data, cookies).</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Client Data/Leads may include: name, contact details, application content, lead status, interaction history (within mini CRM).</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. The Platform does not aim to collect excessive data and strives for minimization.</p>

          <h3 className="font-semibold mt-6 mb-2">6. Purposes and Grounds for Processing</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. Purposes of personal data processing include: Registration, authentication, and account support; Providing access to Platform functionality (page editor, publishing, analytics, mini CRM); Sending technical notifications and service messages; Improving service quality, error diagnostics, and security; Fulfilling contractual obligations (including subscriptions and B2B interactions if applicable).</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. Processing grounds: contract/user agreement execution, data subject consent (if required), and legal requirements.</p>

          <h3 className="font-semibold mt-6 mb-2">7. Cookies and Analytics</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. The Platform may use cookies and similar technologies for proper operation, authentication, protection, and analytics.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. Cookie types may include: strictly necessary, functional, and analytical.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. The User may restrict cookies in browser settings; however, some Platform functions may not work correctly.</p>

          <h3 className="font-semibold mt-6 mb-2">8. Third-Party Services and Data Transfers</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. For Platform operation, third-party infrastructure and analytics providers may be used (e.g., analytics/attribution services and cloud services), to which a limited set of technical data (IP, cookies, device identifiers) may be transferred to the extent necessary for providing functions.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. When the User connects integrations (e.g., YouTube/Google API and other platform APIs), data processing may also be governed by the respective platform policies, and permission management may be done in the provider's account settings.</p>
          <p className="text-sm text-muted-foreground mb-2">8.3. The Administration does not sell Users' personal data to third parties.</p>

          <h3 className="font-semibold mt-6 mb-2">9. Storage Terms and Deletion</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. Data is stored for the duration of the account and/or the period necessary to achieve processing purposes, as well as periods established by law.</p>
          <p className="text-sm text-muted-foreground mb-2">9.2. Upon achieving processing purposes or withdrawal of consent (when applicable), data is deleted or anonymized unless otherwise required by law.</p>
          <p className="text-sm text-muted-foreground mb-2">9.3. The User may delete their account and content from the Platform interface (if available) or submit a support request.</p>

          <h3 className="font-semibold mt-6 mb-2">10. Data Security</h3>
          <p className="text-sm text-muted-foreground mb-2">10.1. The Administration takes organizational and technical measures to protect data from unauthorized access, modification, disclosure, and destruction.</p>
          <p className="text-sm text-muted-foreground mb-2">10.2. Measures may include: HTTPS, role-based access control, password encryption/hashing, software updates, backup.</p>

          <h3 className="font-semibold mt-6 mb-2">11. Personal Data Subject Rights</h3>
          <p className="text-sm text-muted-foreground mb-2">11.1. The User has the right to request information about data processing, require clarification/update, blocking or deletion of data, and withdraw consent to processing (in cases provided by law).</p>
          <p className="text-sm text-muted-foreground mb-2">11.2. To exercise rights, the User may send a request to {COMPANY_DETAILS.email}.</p>

          <h3 className="font-semibold mt-6 mb-2">12. Policy Changes</h3>
          <p className="text-sm text-muted-foreground mb-2">12.1. The Administration may update the Policy; the new version takes effect upon publication at https://lnkmx.my/privacy unless otherwise specified.</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX платформасының құпиялылық саясаты</h2>
          <p className="mb-4 text-sm text-muted-foreground">Нұсқа: 1.0</p>
          
          <h3 className="font-semibold mt-6 mb-2">1. Жалпы ережелер</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. Осы Құпиялылық саясаты (бұдан әрі - «Саясат») LinkMAX платформасын (бұдан әрі - «Платформа», «LinkMAX») пайдалану кезінде дербес деректерді өңдеу және қорғау тәртібін анықтайды.</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. Саясат Платформа Пайдаланушыларының деректеріне, сондай-ақ Пайдаланушы беттер, нысандар және mini CRM арқылы жинайтын үшінші тараптардың (лидтердің/клиенттердің) деректеріне (бұдан әрі - «Клиенттік деректер/Лидтер») қолданылады.</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. Платформаны пайдалана отырып, Пайдаланушы Саясатпен танысқанын және келіскенін растайды (заң талап ететін және өнім параметрлері көлемінде).</p>

          <h3 className="font-semibold mt-6 mb-2">2. Оператор және байланыстар</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. Дербес деректер операторы (Әкімшілік): {COMPANY_DETAILS.name}, БСН (ЖСН) {COMPANY_DETAILS.bin}, мекенжай: {COMPANY_DETAILS.address}.</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Дербес деректер бойынша сұрауларға байланыс: {COMPANY_DETAILS.email}.</p>
          <p className="text-sm text-muted-foreground mb-2">2.3. Саясаттың ағымдағы нұсқасы мына мекенжайда қол жетімді: https://lnkmx.my/privacy.</p>

          <h3 className="font-semibold mt-6 mb-2">3. Терминдер</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Пайдаланушы - Платформада аккаунт тіркеген әрекетке қабілетті жеке тұлға.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. Аккаунт (Профиль) - Платформадағы Пайдаланушының тіркелгісі.</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Дербес деректер - тікелей немесе жанама түрде анықталатын жеке тұлғаға қатысты кез келген ақпарат.</p>
          <p className="text-sm text-muted-foreground mb-2">3.4. Клиенттік деректер/Лидтер - нысандар/mini CRM және басқа жинау механизмдері арқылы жіберілген Пайдаланушы беттерінің келушілерінің деректері.</p>

          <h3 className="font-semibold mt-6 mb-2">4. Нормативтік база</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. Дербес деректерді өңдеу және қорғау Қазақстан Республикасының дербес деректер туралы заңнамасына сәйкес жүзеге асырылады, соның ішінде 2013 жылғы 21 мамырдағы № 94-V «Дербес деректер және оларды қорғау туралы» Заңы.</p>

          <h3 className="font-semibold mt-6 mb-2">5. Қандай деректер өңделеді</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Пайдаланушы деректері мыналарды қамтуы мүмкін: аты/пайдаланушы аты, email, телефон (берілген болса), Telegram ID (қосылған болса), ел/аймақ, интерфейс тілі, аккаунт туралы ақпарат (тариф, жазылым мерзімі, төлем тарихы), бет параметрлері және техникалық деректер (IP мекенжайы, браузер/құрылғы деректері, cookies).</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Клиенттік деректер/Лидтер мыналарды қамтуы мүмкін: аты, байланыс деректері, өтініш мазмұны, лид мәртебесі, өзара әрекеттесу тарихы (mini CRM шеңберінде).</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. Платформа артық деректерді жинауды мақсат етпейді және минимизациялауға ұмтылады.</p>

          <h3 className="font-semibold mt-6 mb-2">6. Өңдеу мақсаттары мен негіздері</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. Дербес деректерді өңдеу мақсаттары мыналарды қамтиды: Тіркелу, аутентификация және аккаунтты қолдау; Платформа функционалына қол жеткізуді қамтамасыз ету (бет редакторы, жариялау, аналитика, mini CRM); Техникалық хабарландырулар мен сервистік хабарламалар жіберу; Қызмет сапасын жақсарту, қателерді диагностикалау және қауіпсіздік; Шарттық міндеттемелерді орындау (жазылымдар мен B2B өзара әрекеттесулерді қоса алғанда, қолданылса).</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. Өңдеу негіздері: шартты/пайдаланушы келісімін орындау, деректер субъектісінің келісімі (қажет болса) және заң талаптары.</p>

          <h3 className="font-semibold mt-6 mb-2">7. Cookies және аналитика</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. Платформа дұрыс жұмыс істеу, аутентификация, қорғау және аналитика үшін cookies және ұқсас технологияларды пайдалануы мүмкін.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. Cookie түрлері мыналарды қамтуы мүмкін: қатаң қажетті, функционалдық және аналитикалық.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. Пайдаланушы браузер параметрлерінде cookies-ті шектей алады; дегенмен, кейбір Платформа функциялары дұрыс жұмыс істемеуі мүмкін.</p>

          <h3 className="font-semibold mt-6 mb-2">8. Үшінші тарап қызметтері және деректерді беру</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. Платформа жұмысы үшін үшінші тарап инфрақұрылымы мен аналитика провайдерлері пайдаланылуы мүмкін (мысалы, аналитика/атрибуция қызметтері және бұлттық қызметтер), оларға функцияларды ұсыну үшін қажетті көлемде техникалық деректердің шектеулі жиынтығы (IP, cookies, құрылғы идентификаторлары) берілуі мүмкін.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. Пайдаланушы интеграцияларды қосқан кезде (мысалы, YouTube/Google API және басқа платформа API), деректерді өңдеу тиісті платформа саясаттарымен де реттелуі мүмкін, ал рұқсаттарды басқару провайдердің аккаунт параметрлерінде жүзеге асырылуы мүмкін.</p>
          <p className="text-sm text-muted-foreground mb-2">8.3. Әкімшілік Пайдаланушылардың дербес деректерін үшінші тараптарға сатпайды.</p>

          <h3 className="font-semibold mt-6 mb-2">9. Сақтау мерзімдері және жою</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. Деректер аккаунт мерзімі ішінде және/немесе өңдеу мақсаттарына жету үшін қажетті мерзім ішінде, сондай-ақ заңмен белгіленген мерзімдер ішінде сақталады.</p>
          <p className="text-sm text-muted-foreground mb-2">9.2. Өңдеу мақсаттарына жеткенде немесе келісімді қайтарып алған кезде (қолданылатын болса), деректер жойылады немесе иесіздендіріледі, егер заңмен өзгеше талап етілмесе.</p>
          <p className="text-sm text-muted-foreground mb-2">9.3. Пайдаланушы өз аккаунтын және контентін Платформа интерфейсінен жоя алады (қол жетімді болса) немесе қолдау қызметіне сұрау жібере алады.</p>

          <h3 className="font-semibold mt-6 mb-2">10. Деректер қауіпсіздігі</h3>
          <p className="text-sm text-muted-foreground mb-2">10.1. Әкімшілік деректерді рұқсатсыз қол жеткізуден, өзгертуден, ашудан және жоюдан қорғау үшін ұйымдастырушылық және техникалық шараларды қабылдайды.</p>
          <p className="text-sm text-muted-foreground mb-2">10.2. Шаралар мыналарды қамтуы мүмкін: HTTPS, рөлдерге негізделген қол жеткізуді басқару, құпия сөздерді шифрлау/хэштеу, бағдарламалық жасақтаманы жаңарту, сақтық көшірме жасау.</p>

          <h3 className="font-semibold mt-6 mb-2">11. Дербес деректер субъектісінің құқықтары</h3>
          <p className="text-sm text-muted-foreground mb-2">11.1. Пайдаланушы деректерді өңдеу туралы ақпаратты сұрауға, нақтылауды/жаңартуды, бұғаттауды немесе жоюды талап етуге және өңдеуге келісімді қайтарып алуға құқылы (заңмен көзделген жағдайларда).</p>
          <p className="text-sm text-muted-foreground mb-2">11.2. Құқықтарды іске асыру үшін Пайдаланушы {COMPANY_DETAILS.email} мекенжайына сұрау жібере алады.</p>

          <h3 className="font-semibold mt-6 mb-2">12. Саясатты өзгерту</h3>
          <p className="text-sm text-muted-foreground mb-2">12.1. Әкімшілік Саясатты жаңарта алады; жаңа нұсқа https://lnkmx.my/privacy мекенжайында жарияланған сәттен күшіне енеді, егер өзгеше көрсетілмесе.</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h2 className="text-lg font-semibold mb-4">Политика конфиденциальности платформы LinkMAX</h2>
        <p className="mb-4 text-sm text-muted-foreground">Версия: 1.0</p>
        
        <h3 className="font-semibold mt-6 mb-2">1. Общие положения</h3>
        <p className="text-sm text-muted-foreground mb-2">1.1. Настоящая Политика конфиденциальности (далее - «Политика») определяет порядок обработки и защиты персональных данных при использовании платформы LinkMAX (далее - «Платформа», «LinkMAX»).</p>
        <p className="text-sm text-muted-foreground mb-2">1.2. Политика действует в отношении данных Пользователей Платформы, а также данных третьих лиц (лидов/клиентов), которые Пользователь собирает через страницы, формы и mini CRM (далее - «Клиентские данные/Лиды»).</p>
        <p className="text-sm text-muted-foreground mb-2">1.3. Используя Платформу, Пользователь подтверждает ознакомление и согласие с Политикой (в части, требуемой законом и настройками продукта).</p>

        <h3 className="font-semibold mt-6 mb-2">2. Оператор и контакты</h3>
        <p className="text-sm text-muted-foreground mb-2">2.1. Оператор персональных данных (Администрация): {COMPANY_DETAILS.name}, БИН (ИИН) {COMPANY_DETAILS.bin}, адрес: {COMPANY_DETAILS.address}.</p>
        <p className="text-sm text-muted-foreground mb-2">2.2. Контакты для обращений по персональным данным: {COMPANY_DETAILS.email}.</p>
        <p className="text-sm text-muted-foreground mb-2">2.3. Актуальная версия Политики размещается по адресу: https://lnkmx.my/privacy.</p>

        <h3 className="font-semibold mt-6 mb-2">3. Термины</h3>
        <p className="text-sm text-muted-foreground mb-2">3.1. Пользователь - дееспособное физическое лицо, зарегистрировавшее аккаунт на Платформе.</p>
        <p className="text-sm text-muted-foreground mb-2">3.2. Аккаунт (Профиль) - учётная запись Пользователя на Платформе.</p>
        <p className="text-sm text-muted-foreground mb-2">3.3. Персональные данные - любая информация, относящаяся к прямо или косвенно определяемому физическому лицу.</p>
        <p className="text-sm text-muted-foreground mb-2">3.4. Клиентские данные/Лиды - данные посетителей страниц Пользователя, оставленные через формы/mini CRM и иные механизмы сбора.</p>

        <h3 className="font-semibold mt-6 mb-2">4. Нормативная база</h3>
        <p className="text-sm text-muted-foreground mb-2">4.1. Обработка и защита персональных данных осуществляются в соответствии с законодательством Республики Казахстан о персональных данных, включая Закон РК от 21 мая 2013 года № 94-V «О персональных данных и их защите».</p>

        <h3 className="font-semibold mt-6 mb-2">5. Какие данные обрабатываются</h3>
        <p className="text-sm text-muted-foreground mb-2">5.1. Данные Пользователей могут включать: имя/username, email, телефон (если предоставлен), Telegram ID (если подключён), страна/регион, язык интерфейса, сведения об аккаунте (тариф, срок подписки, история платежей), настройки страниц, а также технические данные (IP-адрес, данные браузера/устройства, cookies).</p>
        <p className="text-sm text-muted-foreground mb-2">5.2. Клиентские данные/Лиды могут включать: имя, контактные данные, содержание заявки/сообщения, статус лида, историю взаимодействий (в рамках mini CRM).</p>
        <p className="text-sm text-muted-foreground mb-2">5.3. Платформа не преследует цель сбора избыточных данных и стремится к минимизации.</p>

        <h3 className="font-semibold mt-6 mb-2">6. Цели и основания обработки</h3>
        <p className="text-sm text-muted-foreground mb-2">6.1. Цели обработки персональных данных включают: Регистрация, аутентификация и поддержка работы аккаунта; Предоставление доступа к функционалу Платформы (редактор страниц, публикация, аналитика, mini CRM); Отправка технических уведомлений и сервисных сообщений; Улучшение качества сервиса, диагностика ошибок и безопасность; Исполнение договорных обязательств (в т.ч. подписки и B2B-взаимодействие при наличии).</p>
        <p className="text-sm text-muted-foreground mb-2">6.2. Основания обработки: исполнение договора/пользовательского соглашения, согласие субъекта данных (если требуется), а также требования закона.</p>

        <h3 className="font-semibold mt-6 mb-2">7. Cookies и аналитика</h3>
        <p className="text-sm text-muted-foreground mb-2">7.1. Платформа может использовать cookies и аналогичные технологии для корректной работы, аутентификации, защиты и аналитики.</p>
        <p className="text-sm text-muted-foreground mb-2">7.2. Типы cookies могут включать: строго необходимые, функциональные и аналитические.</p>
        <p className="text-sm text-muted-foreground mb-2">7.3. Пользователь может ограничить cookies в настройках браузера; при этом часть функций Платформы может работать некорректно.</p>

        <h3 className="font-semibold mt-6 mb-2">8. Сторонние сервисы и передачи данных</h3>
        <p className="text-sm text-muted-foreground mb-2">8.1. Для работы Платформы могут использоваться сторонние поставщики инфраструктуры и аналитики (например, сервисы аналитики/атрибуции и облачные сервисы), которым может передаваться ограниченный набор технических данных (IP, cookies, идентификаторы устройства) в объёме, необходимом для предоставления функций.</p>
        <p className="text-sm text-muted-foreground mb-2">8.2. При подключении Пользователем интеграций (например, YouTube/Google API и другие платформенные API) обработка данных может также регулироваться политиками соответствующих платформ, а управление разрешениями может осуществляться в настройках аккаунта провайдера.</p>
        <p className="text-sm text-muted-foreground mb-2">8.3. Администрация не продаёт персональные данные Пользователей третьим лицам.</p>

        <h3 className="font-semibold mt-6 mb-2">9. Сроки хранения и удаление</h3>
        <p className="text-sm text-muted-foreground mb-2">9.1. Данные хранятся в течение срока действия аккаунта и/или периода, необходимого для достижения целей обработки, а также сроков, установленных законом.</p>
        <p className="text-sm text-muted-foreground mb-2">9.2. По достижении целей обработки или при отзыве согласия (когда применимо) данные удаляются или обезличиваются, если иное не требуется законом.</p>
        <p className="text-sm text-muted-foreground mb-2">9.3. Пользователь может удалить аккаунт и контент из интерфейса Платформы (если функция доступна) либо направить запрос в поддержку.</p>

        <h3 className="font-semibold mt-6 mb-2">10. Безопасность данных</h3>
        <p className="text-sm text-muted-foreground mb-2">10.1. Администрация принимает организационные и технические меры для защиты данных от неправомерного доступа, изменения, раскрытия и уничтожения.</p>
        <p className="text-sm text-muted-foreground mb-2">10.2. Меры могут включать: HTTPS, контроль доступа по ролям, шифрование/хэширование паролей, обновления ПО, резервное копирование.</p>

        <h3 className="font-semibold mt-6 mb-2">11. Права субъекта персональных данных</h3>
        <p className="text-sm text-muted-foreground mb-2">11.1. Пользователь вправе запросить информацию об обработке данных, требовать уточнения/обновления, блокирования или удаления данных, а также отозвать согласие на обработку (в случаях, предусмотренных законом).</p>
        <p className="text-sm text-muted-foreground mb-2">11.2. Для реализации прав Пользователь может направить запрос на {COMPANY_DETAILS.email}.</p>

        <h3 className="font-semibold mt-6 mb-2">12. Изменение Политики</h3>
        <p className="text-sm text-muted-foreground mb-2">12.1. Администрация вправе обновлять Политику; новая редакция вступает в силу с момента публикации на https://lnkmx.my/privacy, если не указано иное.</p>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('legal.privacyPolicy')}</DialogTitle>
          <DialogDescription>
            {t('legal.privacyDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {getPrivacyContent()}
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PrivacyLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function PrivacyLink({ children, className }: PrivacyLinkProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <PrivacyPolicyModal open={open} onOpenChange={setOpen} />
    </>
  );
}
