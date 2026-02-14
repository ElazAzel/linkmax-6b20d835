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
          
          <h3 className="font-semibold mt-6 mb-2">1. Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">LinkMAX Platform (hereinafter referred to as the "Platform", "LinkMAX") — an online information system for creating personal mini-sites (link-in-bio pages and micro-landings), content management, analytics, and lead management using artificial intelligence technologies. The Platform is hosted on cloud infrastructure and operates in accordance with the personal data legislation of the Republic of Kazakhstan.</p>
          <p className="text-sm text-muted-foreground mb-2">Administration — a person (sole proprietor/LLP) owning the rights to the LinkMAX Platform, providing organizational and technical support, administration, and processing of personal data within the Platform's operation.</p>
          <p className="text-sm text-muted-foreground mb-2">User — a legally capable individual who has registered a Profile on the Platform, passed authentication, and agreed to the User Agreement and this Policy.</p>
          <p className="text-sm text-muted-foreground mb-2">Profile (Account) — the User's individual account created during registration, containing information about the User and providing authorized access to Platform functionality.</p>
          
          <h3 className="font-semibold mt-6 mb-2">2. Introduction</h3>
          <p className="text-sm text-muted-foreground mb-2">Ensuring the necessary level of protection for personal data of LinkMAX Platform Users and their clients (leads) is one of the key tasks of the Administration.</p>
          <p className="text-sm text-muted-foreground mb-2">Processing and protection of personal data is carried out in accordance with the requirements of the Republic of Kazakhstan legislation on personal data.</p>
          
          <h3 className="font-semibold mt-6 mb-2">3. Definition and Composition of Personal Data</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Personal data — any information about a personal data subject that allows identification of their identity directly or indirectly.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. The LinkMAX Platform Administration processes personal data exclusively for the purposes of: providing access to Platform functionality; ensuring the operation of services (page editor, analytics, Mini-CRM, AI functions); fulfilling contracts (subscriptions, B2B agreements); complying with legal requirements.</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Depending on the User category and functionality used, the following data may be processed:</p>
          <p className="text-sm text-muted-foreground mb-2">• User Data: name, username, email, phone number, Telegram ID, country/region, preferred interface language, account data (tariff, subscription period, payment history), page settings, technical data (IP address, browser and device information, cookies, interface activity data).</p>
          <p className="text-sm text-muted-foreground mb-2">• Lead/Client Data (through forms and Mini-CRM): name, contact details, application content, lead status, interaction history.</p>
          
          <h3 className="font-semibold mt-6 mb-2">4. Purposes of Data Collection and Processing</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. The Administration collects, stores, and processes personal data for the following purposes:</p>
          <p className="text-sm text-muted-foreground mb-2">• Registration, authentication, and Account support;</p>
          <p className="text-sm text-muted-foreground mb-2">• Providing access to Platform functionality;</p>
          <p className="text-sm text-muted-foreground mb-2">• Using AI functions (text generation, translation, recommendations);</p>
          <p className="text-sm text-muted-foreground mb-2">• Sending technical notifications;</p>
          <p className="text-sm text-muted-foreground mb-2">• Ensuring Mini-CRM operation and lead notifications;</p>
          <p className="text-sm text-muted-foreground mb-2">• Providing analytics;</p>
          <p className="text-sm text-muted-foreground mb-2">• Improving service quality.</p>
          
          <h3 className="font-semibold mt-6 mb-2">5. Personal Data Processing Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Personal data is processed and stored for the duration of: User Account validity; necessity for achieving processing purposes; periods established by law.</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Upon achieving processing purposes or withdrawal of consent (where applicable), data is subject to deletion or anonymization.</p>
          
          <h3 className="font-semibold mt-6 mb-2">6. Rights and Obligations of the Parties</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. The Administration has the right to: process personal data of Users and leads within stated purposes; anonymize data for statistics and analytics; transfer data to third parties in cases provided by law.</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. The User has the right to: receive information about the fact of processing their personal data; request clarification, updating, blocking, or destruction of their data; withdraw consent to processing; appeal the Administration's actions.</p>
          
          <h3 className="font-semibold mt-6 mb-2">7. Principles and Conditions for Personal Data Processing</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. Data processing on the LinkMAX Platform is carried out based on: the User Agreement and this Policy; voluntary provision of data by the User; legal requirements.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. When processing personal data, the Administration is guided by the principles of: legality and good faith; purpose limitation; data minimization; storage limitation; confidentiality and security.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. The Administration does not sell Users' personal data to third parties.</p>
          
          <h3 className="font-semibold mt-6 mb-2">8. Ensuring Personal Data Security</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. The Administration takes necessary organizational, legal, and technical measures to protect personal data from unauthorized access, destruction, alteration, blocking, copying, and unlawful distribution.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. Protection measures include: password and sensitive data encryption; role-based access restrictions; HTTPS protocol and traffic encryption; regular software updates; backup systems.</p>
          
          <h3 className="font-semibold mt-6 mb-2">9. Cookies and Analytics</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. The Platform uses cookies (small text files stored in the User's browser) to ensure proper operation, authentication, and analytics.</p>
          <p className="text-sm text-muted-foreground mb-2">9.2. Cookie types used: strictly necessary (for operation and authorization); analytical (for usage statistics collection); functional (for remembering preferences).</p>
          
          <h3 className="font-semibold mt-6 mb-2">10. Contact Information</h3>
          <p className="text-sm text-muted-foreground mb-2">For questions, requests, or complaints regarding personal data processing, please contact: support@linkmax.app</p>
          <p className="text-sm text-muted-foreground mb-2">The current version of this Policy is always available at: https://lnkmx.my/privacy</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX платформасының құпиялылық саясаты</h2>
          <p className="mb-4 text-sm text-muted-foreground">Нұсқа: 1.0</p>
          
          <h3 className="font-semibold mt-6 mb-2">1. Терминдер</h3>
          <p className="text-sm text-muted-foreground mb-2">LinkMAX платформасы (бұдан әрі — «Платформа», «LinkMAX») — жасанды интеллект технологияларын қолдана отырып, жеке мини-сайттар (link-in-bio беттері мен микролендингтер) жасау, мазмұнды басқару, аналитика және лидтермен жұмыс істеу үшін ақпараттық онлайн-жүйе.</p>
          <p className="text-sm text-muted-foreground mb-2">Әкімшілік — LinkMAX Платформасына құқықтарға ие тұлға (ЖК/ЖШС), Платформаның жұмысы шеңберінде ұйымдастырушылық-техникалық қолдау, әкімшілік және дербес деректерді өңдеуді жүзеге асырады.</p>
          <p className="text-sm text-muted-foreground mb-2">Пайдаланушы — Платформада Профильді тіркеген, аутентификациядан өткен және Пайдаланушы келісімі мен осы Саясатпен келіскен әрекетке қабілетті жеке тұлға.</p>
          <p className="text-sm text-muted-foreground mb-2">Профиль (Аккаунт) — тіркелу кезінде жасалған Пайдаланушының жеке тіркелгісі.</p>
          
          <h3 className="font-semibold mt-6 mb-2">2. Кіріспе</h3>
          <p className="text-sm text-muted-foreground mb-2">LinkMAX Платформасы Пайдаланушылары мен олардың клиенттерінің (лидтердің) дербес деректерін қорғаудың қажетті деңгейін қамтамасыз ету Әкімшіліктің негізгі міндеттерінің бірі болып табылады.</p>
          <p className="text-sm text-muted-foreground mb-2">Дербес деректерді өңдеу және қорғау Қазақстан Республикасының дербес деректер туралы заңнамасының талаптарына сәйкес жүзеге асырылады.</p>
          
          <h3 className="font-semibold mt-6 mb-2">3. Дербес деректердің анықтамасы және құрамы</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Дербес деректер — дербес деректер субъектісі туралы тікелей немесе жанама түрде оның жеке басын анықтауға мүмкіндік беретін кез келген ақпарат.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. LinkMAX Платформасының Әкімшілігі дербес деректерді тек мына мақсаттарда өңдейді: Платформа функционалына қол жеткізуді қамтамасыз ету; қызметтердің жұмысын қамтамасыз ету; шарттарды орындау; заңнама талаптарын сақтау.</p>
          
          <h3 className="font-semibold mt-6 mb-2">4. Деректерді жинау және өңдеу мақсаттары</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. Әкімшілік дербес деректерді мына мақсаттарда жинайды, сақтайды және өңдейді:</p>
          <p className="text-sm text-muted-foreground mb-2">• Тіркелу, аутентификация және Аккаунтты қолдау;</p>
          <p className="text-sm text-muted-foreground mb-2">• Платформа функционалына қол жеткізуді қамтамасыз ету;</p>
          <p className="text-sm text-muted-foreground mb-2">• AI функцияларын пайдалану;</p>
          <p className="text-sm text-muted-foreground mb-2">• Техникалық хабарламалар жіберу;</p>
          <p className="text-sm text-muted-foreground mb-2">• Mini-CRM жұмысын қамтамасыз ету;</p>
          <p className="text-sm text-muted-foreground mb-2">• Аналитиканы қамтамасыз ету.</p>
          
          <h3 className="font-semibold mt-6 mb-2">5. Дербес деректерді өңдеу мерзімдері</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Дербес деректер мына мерзімде өңделеді және сақталады: Пайдаланушы Аккаунтының қолданылу мерзімі; өңдеу мақсаттарына жету үшін қажетті мерзім; заңнамамен белгіленген мерзімдер.</p>
          
          <h3 className="font-semibold mt-6 mb-2">6. Тараптардың құқықтары мен міндеттері</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. Әкімшілік құқылы: көрсетілген мақсаттар шеңберінде Пайдаланушылар мен лидтердің дербес деректерін өңдеуге; статистика және аналитика үшін деректерді иесіздендіруге.</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. Пайдаланушы құқылы: өзінің дербес деректерін өңдеу фактісі туралы ақпарат алуға; деректерін нақтылауды, жаңартуды, бұғаттауды немесе жоюды талап етуге.</p>
          
          <h3 className="font-semibold mt-6 mb-2">7. Дербес деректерді өңдеу принциптері мен шарттары</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. LinkMAX Платформасында деректерді өңдеу мына негізде жүзеге асырылады: Пайдаланушы келісімі және осы Саясат; Пайдаланушының деректерді ерікті түрде беруі; заңнама талаптары.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. Әкімшілік Пайдаланушылардың дербес деректерін үшінші тұлғаларға сатпайды.</p>
          
          <h3 className="font-semibold mt-6 mb-2">8. Дербес деректер қауіпсіздігін қамтамасыз ету</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. Әкімшілік дербес деректерді рұқсатсыз қол жеткізуден, жоюдан, өзгертуден, бұғаттаудан, көшіруден және заңсыз таратудан қорғау үшін қажетті ұйымдастырушылық, құқықтық және техникалық шараларды қабылдайды.</p>
          
          <h3 className="font-semibold mt-6 mb-2">9. Cookie файлдары және аналитика</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. Платформа дұрыс жұмыс істеуді, аутентификацияны және аналитиканы қамтамасыз ету үшін cookie файлдарын пайдаланады.</p>
          
          <h3 className="font-semibold mt-6 mb-2">10. Байланыс ақпараты</h3>
          <p className="text-sm text-muted-foreground mb-2">Дербес деректерді өңдеуге қатысты сұрақтар, сұраныстар немесе шағымдар бойынша хабарласыңыз: support@linkmax.app</p>
          <p className="text-sm text-muted-foreground mb-2">Осы Саясаттың ағымдағы нұсқасы әрқашан мына мекенжайда қол жетімді: https://lnkmx.my/privacy</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h2 className="text-lg font-semibold mb-4">Политика конфиденциальности платформы LinkMAX</h2>
        <p className="mb-4 text-sm text-muted-foreground">Версия: 1.0</p>
        
        <h3 className="font-semibold mt-6 mb-2">1. Термины</h3>
        <p className="text-sm text-muted-foreground mb-2">Платформа LinkMAX (далее — «Платформа», «LinkMAX») — информационная онлайн‑система для создания персональных мини‑сайтов (link‑in‑bio страниц и микролендингов), управления контентом, аналитики и работы с лидами, с использованием технологий искусственного интеллекта. Платформа размещена на облачной инфраструктуре и работает в соответствии с требованиями законодательства Республики Казахстан о персональных данных.</p>
        <p className="text-sm text-muted-foreground mb-2">Администрация — лицо (ИП/ТОО), владеющее правами на Платформу LinkMAX, осуществляющее организационно‑техническое сопровождение, администрирование и обработку персональных данных в рамках работы Платформы.</p>
        <p className="text-sm text-muted-foreground mb-2">Пользователь — дееспособное физическое лицо, зарегистрировавшее Профиль на Платформе, прошедшее аутентификацию и согласившееся с Пользовательским соглашением и настоящей Политикой.</p>
        <p className="text-sm text-muted-foreground mb-2">Профиль (Аккаунт) — индивидуальная учётная запись Пользователя, создаваемая при регистрации, содержащая сведения о Пользователе и обеспечивающая авторизованный доступ к функционалу Платформы.</p>
        <p className="text-sm text-muted-foreground mb-2">Персональные данные — любая информация, относящаяся к прямо или косвенно определённому физическому лицу (субъекту персональных данных), позволяющая идентифицировать его личность.</p>
        <p className="text-sm text-muted-foreground mb-2">Клиентские данные / Лиды — данные третьих лиц (посетителей страниц Пользователя), собираемые через формы, Mini‑CRM и иные механизмы.</p>
        
        <h3 className="font-semibold mt-6 mb-2">2. Введение</h3>
        <p className="text-sm text-muted-foreground mb-2">Обеспечение необходимого уровня защиты персональных данных Пользователей Платформы LinkMAX и их клиентов (лидов) является одной из ключевых задач Администрации.</p>
        <p className="text-sm text-muted-foreground mb-2">Обработка и защита персональных данных осуществляются в соответствии с требованиями законодательства Республики Казахстан о персональных данных (включая Закон Республики Казахстан от 21 мая 2013 года № 94‑V «О персональных данных и их защите»).</p>
        
        <h3 className="font-semibold mt-6 mb-2">3. Понятие и состав персональных данных</h3>
        <p className="text-sm text-muted-foreground mb-2">3.1. Персональные данные — любая информация о субъекте персональных данных, позволяющая идентифицировать его личность прямо или косвенно.</p>
        <p className="text-sm text-muted-foreground mb-2">3.2. Администрация Платформы LinkMAX обрабатывает персональные данные исключительно в целях: предоставления доступа к функционалу Платформы; обеспечения работы сервисов (редактор страниц, аналитика, Mini‑CRM, AI‑функции); исполнения договоров (подписок, B2B‑соглашений); соблюдения требований законодательства.</p>
        <p className="text-sm text-muted-foreground mb-2">3.3. В зависимости от категории Пользователя могут обрабатываться следующие данные:</p>
        <p className="text-sm text-muted-foreground mb-2">• Данные Пользователей: имя, username, email, номер телефона, Telegram ID, страна/регион, предпочитаемый язык интерфейса, данные об аккаунте (тариф, срок действия подписки, история платежей), настройки страниц, технические данные (IP‑адрес, информация о браузере и устройстве, cookie).</p>
        <p className="text-sm text-muted-foreground mb-2">• Данные лидов/клиентов Пользователя: имя, контактные данные, содержание заявок, статус лида, история взаимодействий.</p>
        
        <h3 className="font-semibold mt-6 mb-2">4. Цели сбора и обработки данных</h3>
        <p className="text-sm text-muted-foreground mb-2">4.1. Администрация осуществляет сбор, хранение и обработку персональных данных в следующих целях:</p>
        <p className="text-sm text-muted-foreground mb-2">• регистрация, аутентификация и поддержка работы Аккаунта;</p>
        <p className="text-sm text-muted-foreground mb-2">• предоставление доступа к функционалу Платформы;</p>
        <p className="text-sm text-muted-foreground mb-2">• использование AI‑функций (генерация текста, перевод, рекомендации);</p>
        <p className="text-sm text-muted-foreground mb-2">• отправка технических уведомлений;</p>
        <p className="text-sm text-muted-foreground mb-2">• обеспечение работы Mini‑CRM и уведомлений о лидах;</p>
        <p className="text-sm text-muted-foreground mb-2">• предоставление аналитики;</p>
        <p className="text-sm text-muted-foreground mb-2">• улучшение качества сервиса.</p>
        
        <h3 className="font-semibold mt-6 mb-2">5. Сроки обработки персональных данных</h3>
        <p className="text-sm text-muted-foreground mb-2">5.1. Персональные данные обрабатываются и хранятся в течение срока: действия Аккаунта Пользователя; необходимого для достижения целей обработки; установленного законодательством.</p>
        <p className="text-sm text-muted-foreground mb-2">5.2. По достижении целей обработки либо при отзыве согласия данные подлежат удалению или обезличиванию.</p>
        <p className="text-sm text-muted-foreground mb-2">5.3. Пользователь вправе удалить свой Аккаунт и Контент из интерфейса Платформы.</p>
        
        <h3 className="font-semibold mt-6 mb-2">6. Права и обязанности сторон</h3>
        <p className="text-sm text-muted-foreground mb-2">6.1. Администрация имеет право: обрабатывать персональные данные Пользователей и лидов в пределах заявленных целей; обезличивать данные для статистики и аналитики; передавать данные третьим лицам в случаях, предусмотренных законодательством.</p>
        <p className="text-sm text-muted-foreground mb-2">6.2. Пользователь имеет право: получать информацию о факте обработки своих персональных данных; требовать уточнения, обновления, блокирования или уничтожения своих данных; отзывать согласие на обработку; обжаловать действия Администрации.</p>
        
        <h3 className="font-semibold mt-6 mb-2">7. Принципы и условия обработки персональных данных</h3>
        <p className="text-sm text-muted-foreground mb-2">7.1. Обработка данных на Платформе LinkMAX осуществляется на основании: Пользовательского соглашения и настоящей Политики; добровольного предоставления данных Пользователем; требований закона.</p>
        <p className="text-sm text-muted-foreground mb-2">7.2. При обработке персональных данных Администрация руководствуется следующими принципами: законность и добросовестность; целевое ограничение; минимизация данных; ограничение по срокам хранения; конфиденциальность и безопасность.</p>
        <p className="text-sm text-muted-foreground mb-2">7.3. Администрация не осуществляет продажу персональных данных Пользователей третьим лицам.</p>
        
        <h3 className="font-semibold mt-6 mb-2">8. Обеспечение безопасности персональных данных</h3>
        <p className="text-sm text-muted-foreground mb-2">8.1. Администрация принимает необходимые организационные, правовые и технические меры для защиты персональных данных от несанкционированного доступа, уничтожения, изменения, блокирования, копирования, неправомерного распространения.</p>
        <p className="text-sm text-muted-foreground mb-2">8.2. Для защиты используются: шифрование паролей и чувствительных данных; ограничение доступа по ролям; протокол HTTPS и шифрование трафика; регулярные обновления ПО; резервное копирование.</p>
        
        <h3 className="font-semibold mt-6 mb-2">9. Cookies и аналитика</h3>
        <p className="text-sm text-muted-foreground mb-2">9.1. Платформа использует cookies (небольшие текстовые файлы, сохраняемые в браузере Пользователя) для обеспечения корректной работы, аутентификации и аналитики.</p>
        <p className="text-sm text-muted-foreground mb-2">9.2. Типы используемых cookies: строго необходимые (для работы и авторизации); аналитические (для сбора статистики использования); функциональные (для запоминания предпочтений).</p>
        
        <h3 className="font-semibold mt-6 mb-2">10. Контактные данные</h3>
        <p className="text-sm text-muted-foreground mb-2">По вопросам, запросам или жалобам относительно обработки персональных данных обращайтесь: support@linkmax.app</p>
        <p className="text-sm text-muted-foreground mb-2">Актуальная версия настоящей Политики всегда доступна по адресу: https://lnkmx.my/privacy</p>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t('legal.privacyPolicy', 'Политика конфиденциальности')}</DialogTitle>
          <DialogDescription>
            {t('legal.privacyDescription', 'Ознакомьтесь с политикой обработки персональных данных')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="pr-4">
            {getPrivacyContent()}
          </div>
        </ScrollArea>
        <div className="p-6 pt-0">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple link component that opens the modal
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
        className={className || "text-primary hover:underline cursor-pointer"}
      >
        {children}
      </button>
      <PrivacyPolicyModal open={open} onOpenChange={setOpen} />
    </>
  );
}
