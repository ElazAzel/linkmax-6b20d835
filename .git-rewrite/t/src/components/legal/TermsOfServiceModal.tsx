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

interface TermsOfServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Company details constant
const COMPANY_DETAILS = {
  name: 'ИП BEEGIN',
  address: 'г. Алматы, ул. Шолохова, д. 20/7',
  bin: '971207300019',
  bank: 'АО "Kaspi Bank"',
  kbe: '19',
  bik: 'CASPKZKA',
  account: 'KZ58722S000020135125',
  email: 'admin@lnkmx.my',
  phone: '+7 705 109 76 64',
};

export function TermsOfServiceModal({ open, onOpenChange }: TermsOfServiceModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const getCompanyDetailsSection = (lang: string) => {
    if (lang === 'en') {
      return (
        <>
          <h3 className="font-semibold mt-6 mb-2">Company Details</h3>
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <p><strong>Company:</strong> {COMPANY_DETAILS.name}</p>
            <p><strong>Address:</strong> Almaty, Sholokhov Street, building 20/7, apt/office 11</p>
            <p><strong>BIN (IIN):</strong> {COMPANY_DETAILS.bin}</p>
            <p><strong>Bank:</strong> {COMPANY_DETAILS.bank}</p>
            <p><strong>KBe:</strong> {COMPANY_DETAILS.kbe}</p>
            <p><strong>BIC:</strong> {COMPANY_DETAILS.bik}</p>
            <p><strong>Account Number:</strong> {COMPANY_DETAILS.account}</p>
            <p><strong>Email:</strong> {COMPANY_DETAILS.email}</p>
            <p><strong>Phone:</strong> {COMPANY_DETAILS.phone}</p>
          </div>
        </>
      );
    }
    if (lang === 'kk') {
      return (
        <>
          <h3 className="font-semibold mt-6 mb-2">Компания деректемелері</h3>
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <p><strong>Компания:</strong> {COMPANY_DETAILS.name}</p>
            <p><strong>Мекенжай:</strong> Алматы қ., Шолохов к-сі, 20/7 үй, 11 пәтер/кеңсе</p>
            <p><strong>БСН (ЖСН):</strong> {COMPANY_DETAILS.bin}</p>
            <p><strong>Банк:</strong> {COMPANY_DETAILS.bank}</p>
            <p><strong>КБе:</strong> {COMPANY_DETAILS.kbe}</p>
            <p><strong>БСК:</strong> {COMPANY_DETAILS.bik}</p>
            <p><strong>Шот нөмірі:</strong> {COMPANY_DETAILS.account}</p>
            <p><strong>Email:</strong> {COMPANY_DETAILS.email}</p>
            <p><strong>Телефон:</strong> {COMPANY_DETAILS.phone}</p>
          </div>
        </>
      );
    }
    // Russian default
    return (
      <>
        <h3 className="font-semibold mt-6 mb-2">Реквизиты организации</h3>
        <div className="text-sm text-muted-foreground mb-2 space-y-1">
          <p><strong>Компания:</strong> {COMPANY_DETAILS.name}</p>
          <p><strong>Адрес:</strong> {COMPANY_DETAILS.address}</p>
          <p><strong>БИН (ИИН):</strong> {COMPANY_DETAILS.bin}</p>
          <p><strong>Банк:</strong> {COMPANY_DETAILS.bank}</p>
          <p><strong>КБе:</strong> {COMPANY_DETAILS.kbe}</p>
          <p><strong>БИК:</strong> {COMPANY_DETAILS.bik}</p>
          <p><strong>Номер счёта:</strong> {COMPANY_DETAILS.account}</p>
          <p><strong>Email:</strong> {COMPANY_DETAILS.email}</p>
          <p><strong>Телефон:</strong> {COMPANY_DETAILS.phone}</p>
        </div>
      </>
    );
  };

  const getServiceDeliverySection = (lang: string) => {
    if (lang === 'en') {
      return (
        <>
          <h3 className="font-semibold mt-6 mb-2">11. Service Delivery Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">11.1. <strong>Service Description:</strong> LinkMAX provides digital services for creating and hosting personal mini-sites (link-in-bio pages), analytics, CRM functionality, and AI-powered content generation. All services are provided remotely via the Internet.</p>
          <p className="text-sm text-muted-foreground mb-2">11.2. <strong>Service Activation:</strong> Access to paid services is activated automatically within 15 minutes after successful payment confirmation. The User receives access to all features of the selected tariff plan immediately.</p>
          <p className="text-sm text-muted-foreground mb-2">11.3. <strong>Service Period:</strong> The subscription period starts from the moment of successful payment and continues for the selected duration (3, 6, or 12 months).</p>
          <p className="text-sm text-muted-foreground mb-2">11.4. <strong>No Physical Delivery:</strong> As LinkMAX provides exclusively digital services, no physical delivery of goods is performed.</p>
          
          <h3 className="font-semibold mt-6 mb-2">12. Refund and Cancellation Policy</h3>
          <p className="text-sm text-muted-foreground mb-2">12.1. <strong>Refund Eligibility:</strong> In accordance with Article 30 of the Law of the Republic of Kazakhstan "On Protection of Consumer Rights", refunds for digital services may be requested under the following conditions:</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Within 14 calendar days from the date of payment if the service has not been used (no pages created, no blocks added, no analytics accessed);</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• In case of technical impossibility to provide the service due to the fault of the Administration;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• If the service significantly differs from the description on the website.</p>
          <p className="text-sm text-muted-foreground mb-2">12.2. <strong>Non-Refundable Cases:</strong> Refunds are not provided if:</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• The User has actively used the paid features (created pages, used AI generation, accessed analytics);</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• More than 14 days have passed since the payment date;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• The account was blocked due to violation of the Terms of Service;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• The User has violated the rules of use specified in Section 4 of this Agreement.</p>
          <p className="text-sm text-muted-foreground mb-2">12.3. <strong>Refund Process:</strong> To request a refund, the User must send an application to {COMPANY_DETAILS.email} indicating: full name, email used for registration, payment date and amount, reason for refund.</p>
          <p className="text-sm text-muted-foreground mb-2">12.4. <strong>Refund Timeline:</strong> The refund request is reviewed within 10 business days. If approved, funds are returned within 14 business days to the original payment method.</p>
          <p className="text-sm text-muted-foreground mb-2">12.5. <strong>Partial Refunds:</strong> If the service has been partially used, a proportional refund may be calculated based on unused days of the subscription period.</p>
          <p className="text-sm text-muted-foreground mb-2">12.6. <strong>Subscription Cancellation:</strong> The User may cancel automatic subscription renewal at any time through account settings. Cancellation does not entitle to a refund for the current paid period.</p>
        </>
      );
    }
    if (lang === 'kk') {
      return (
        <>
          <h3 className="font-semibold mt-6 mb-2">11. Қызметтерді көрсету шарттары</h3>
          <p className="text-sm text-muted-foreground mb-2">11.1. <strong>Қызметтің сипаттамасы:</strong> LinkMAX жеке мини-сайттар (link-in-bio беттері), аналитика, CRM функционалы және AI мазмұнын генерациялау үшін цифрлық қызметтер көрсетеді. Барлық қызметтер интернет арқылы қашықтан көрсетіледі.</p>
          <p className="text-sm text-muted-foreground mb-2">11.2. <strong>Қызметті іске қосу:</strong> Ақылы қызметтерге қол жеткізу төлемді сәтті растағаннан кейін 15 минут ішінде автоматты түрде іске қосылады.</p>
          <p className="text-sm text-muted-foreground mb-2">11.3. <strong>Қызмет мерзімі:</strong> Жазылым мерзімі сәтті төлем сәтінен басталады және таңдалған ұзақтыққа (3, 6 немесе 12 ай) жалғасады.</p>
          <p className="text-sm text-muted-foreground mb-2">11.4. <strong>Физикалық жеткізу жоқ:</strong> LinkMAX тек цифрлық қызметтер көрсететіндіктен, тауарларды физикалық жеткізу жүзеге асырылмайды.</p>
          
          <h3 className="font-semibold mt-6 mb-2">12. Ақшаны қайтару және бас тарту саясаты</h3>
          <p className="text-sm text-muted-foreground mb-2">12.1. <strong>Қайтару құқығы:</strong> Қазақстан Республикасының «Тұтынушылардың құқықтарын қорғау туралы» Заңының 30-бабына сәйкес, цифрлық қызметтер үшін ақшаны қайтару мынадай жағдайларда сұралуы мүмкін:</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Төлем күнінен бастап 14 күнтізбелік күн ішінде, егер қызмет пайдаланылмаса;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Әкімшіліктің кінәсінен қызмет көрсетудің техникалық мүмкін еместігі жағдайында;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Егер қызмет веб-сайттағы сипаттамадан айтарлықтай ерекшеленсе.</p>
          <p className="text-sm text-muted-foreground mb-2">12.2. <strong>Қайтарылмайтын жағдайлар:</strong> Егер:</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Пайдаланушы ақылы мүмкіндіктерді белсенді пайдаланса;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Төлем күнінен бастап 14 күннен астам уақыт өтсе;</p>
          <p className="text-sm text-muted-foreground mb-2 ml-4">• Қызмет көрсету шарттарын бұзғаны үшін аккаунт бұғатталса.</p>
          <p className="text-sm text-muted-foreground mb-2">12.3. <strong>Қайтару процесі:</strong> Қайтаруды сұрау үшін Пайдаланушы {COMPANY_DETAILS.email} мекенжайына өтініш жіберуі керек.</p>
          <p className="text-sm text-muted-foreground mb-2">12.4. <strong>Қайтару мерзімі:</strong> Қайтару сұранысы 10 жұмыс күні ішінде қаралады. Мақұлданған жағдайда ақша 14 жұмыс күні ішінде бастапқы төлем әдісіне қайтарылады.</p>
        </>
      );
    }
    // Russian default
    return (
      <>
        <h3 className="font-semibold mt-6 mb-2">11. Условия предоставления услуг</h3>
        <p className="text-sm text-muted-foreground mb-2">11.1. <strong>Описание услуг:</strong> LinkMAX предоставляет цифровые услуги по созданию и размещению персональных мини-сайтов (link-in-bio страниц), аналитике, CRM-функционалу и генерации контента с использованием искусственного интеллекта. Все услуги оказываются дистанционно через сеть Интернет.</p>
        <p className="text-sm text-muted-foreground mb-2">11.2. <strong>Активация услуг:</strong> Доступ к платным услугам активируется автоматически в течение 15 минут после успешного подтверждения оплаты. Пользователь получает доступ ко всем функциям выбранного тарифного плана незамедлительно.</p>
        <p className="text-sm text-muted-foreground mb-2">11.3. <strong>Период действия услуги:</strong> Период подписки начинается с момента успешной оплаты и продолжается в течение выбранного срока (3, 6 или 12 месяцев).</p>
        <p className="text-sm text-muted-foreground mb-2">11.4. <strong>Отсутствие физической доставки:</strong> Поскольку LinkMAX предоставляет исключительно цифровые услуги, физическая доставка товаров не осуществляется.</p>
        
        <h3 className="font-semibold mt-6 mb-2">12. Политика возврата и отказа от услуг</h3>
        <p className="text-sm text-muted-foreground mb-2">12.1. <strong>Право на возврат:</strong> В соответствии со статьёй 30 Закона Республики Казахстан «О защите прав потребителей», возврат денежных средств за цифровые услуги может быть запрошен при следующих условиях:</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• В течение 14 календарных дней с даты оплаты, если услуга не использовалась (не создано страниц, не добавлено блоков, не использована аналитика);</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• В случае технической невозможности предоставления услуги по вине Администрации;</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• Если услуга существенно отличается от описания на сайте.</p>
        <p className="text-sm text-muted-foreground mb-2">12.2. <strong>Случаи отказа в возврате:</strong> Возврат не осуществляется, если:</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• Пользователь активно использовал платные функции (создавал страницы, использовал AI-генерацию, просматривал аналитику);</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• С даты оплаты прошло более 14 дней;</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• Аккаунт был заблокирован за нарушение Условий использования;</p>
        <p className="text-sm text-muted-foreground mb-2 ml-4">• Пользователь нарушил правила использования, указанные в разделе 4 настоящего Соглашения.</p>
        <p className="text-sm text-muted-foreground mb-2">12.3. <strong>Процедура возврата:</strong> Для запроса возврата Пользователь должен направить заявление на {COMPANY_DETAILS.email} с указанием: ФИО, email, использованный при регистрации, дата и сумма платежа, причина возврата.</p>
        <p className="text-sm text-muted-foreground mb-2">12.4. <strong>Сроки возврата:</strong> Заявка на возврат рассматривается в течение 10 рабочих дней. При положительном решении денежные средства возвращаются в течение 14 рабочих дней на первоначальный способ оплаты.</p>
        <p className="text-sm text-muted-foreground mb-2">12.5. <strong>Частичный возврат:</strong> Если услуга была частично использована, может быть рассчитан пропорциональный возврат на основе неиспользованных дней периода подписки.</p>
        <p className="text-sm text-muted-foreground mb-2">12.6. <strong>Отмена подписки:</strong> Пользователь может отменить автоматическое продление подписки в любое время через настройки аккаунта. Отмена не даёт права на возврат средств за текущий оплаченный период.</p>
      </>
    );
  };

  const getTermsContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX Platform User Agreement</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This User Agreement (hereinafter referred to as the "Agreement") defines the terms of access to and use of the LinkMAX web platform and related services (hereinafter referred to as the "Platform") for individuals and representatives of legal entities (hereinafter referred to as the "User").
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            By using the Platform, the User confirms that they have carefully read the terms of the Agreement and the Privacy Policy and fully accept them.
          </p>
          
          {getCompanyDetailsSection('en')}
          
          <h3 className="font-semibold mt-6 mb-2">1. Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. LinkMAX - an online platform and services for creating personal mini-sites (link-in-bio pages and micro-landings), analytics, and lead management using artificial intelligence.</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. Platform - the website at https://lnkmx.my, related subdomains, API, and the progressive web application (PWA) providing access to page creation and management, analytics, CRM, and other services.</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. Agreement - this document and all appendices to it governing the procedure for access to and use of the Platform.</p>
          <p className="text-sm text-muted-foreground mb-2">1.4. Privacy Policy - a document defining the procedure for processing and protecting Users' personal data, posted at https://lnkmx.my/privacy.</p>
          <p className="text-sm text-muted-foreground mb-2">1.5. User - a legally capable individual who has registered an account on the Platform, or a representative of a legal entity/individual entrepreneur using the Platform on behalf of the organization.</p>
          <p className="text-sm text-muted-foreground mb-2">1.6. Account - a set of User data (login, password, Telegram ID, etc.) required for authentication and access to Platform functionality.</p>
          <p className="text-sm text-muted-foreground mb-2">1.7. Personal Data - any information relating to a directly or indirectly identifiable User (name, contacts, payment data, page content, etc.).</p>
          
          <h3 className="font-semibold mt-6 mb-2">2. General Provisions</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. This Agreement applies to all current and future Platform features, including updates and new services.</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Use of the Platform is subject to: this Agreement; the Privacy Policy; the terms of tariffs and paid services published at https://lnkmx.my/pricing.</p>
          <p className="text-sm text-muted-foreground mb-2">2.3. The Administration has the right to make changes to the Agreement and Privacy Policy unilaterally. The new version takes effect from the moment of publication on the Platform, unless otherwise expressly stated.</p>
          
          <h3 className="font-semibold mt-6 mb-2">3. Registration and Account Access</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Registration is done through the web interface at https://lnkmx.my using: email and password and/or; login via third-party services (Google, Apple) and/or; verification via Telegram bot.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. The User is obliged to provide accurate information during registration and maintain its accuracy.</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Activation of notification and Mini-CRM features may require mandatory linking of a Telegram account via the official LinkMAX bot.</p>
          <p className="text-sm text-muted-foreground mb-2">3.4. The User is fully responsible for the safety of their login, password, and access to their Telegram account. All actions performed through their account are considered actions of the User.</p>
          
          <h3 className="font-semibold mt-6 mb-2">4. Platform Usage Terms and User Responsibility</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. The Platform is provided to the User "as is" for the purposes of: creating and hosting personal mini-sites/pages; promoting own services and products; collecting and processing leads (applications); analytics and communication with the audience.</p>
          <p className="text-sm text-muted-foreground mb-2">4.2. The User undertakes to: use the Platform only for lawful purposes; not post content that violates the rights of third parties, laws, or generally accepted ethics.</p>
          <p className="text-sm text-muted-foreground mb-2">4.3. Prohibited content includes: extremist, terrorist, or pornographic materials; propaganda of violence, racial, national, or religious hatred; violation of copyright; false advertising and any form of fraud; personal data of third parties without their consent.</p>
          
          <h3 className="font-semibold mt-6 mb-2">5. Paid Services, Tariffs, and Payments</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Access to additional Platform features (PRO tariff) is provided on a prepaid subscription basis with a minimum term of 3 months.</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Current pricing in Kazakhstani tenge (KZT): 3 months - 4,350₸/month (total 13,050₸); 6 months - 3,500₸/month (total 21,000₸); 12 months - 2,610₸/month (total 31,320₸). Approximate USD equivalent: $8.50, $6.80, $5.10 per month respectively.</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. Prices, tariff composition and payment terms are published on the tariffs page at https://lnkmx.my/pricing and may be changed by the Administration unilaterally for new periods.</p>
          <p className="text-sm text-muted-foreground mb-2">5.4. Payment is made through the RoboKassa payment system and other available payment methods.</p>
          
          <h3 className="font-semibold mt-6 mb-2">6. Content Rights and Intellectual Property</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. All exclusive rights to the Platform, its software code, design, corporate style, logos, and technical documentation belong to the Administration.</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. The User retains rights to their Content but grants the Administration a non-exclusive license to: store and display Content on the Platform; create backups; use it to the extent necessary for the functioning of services.</p>
          
          <h3 className="font-semibold mt-6 mb-2">7. Limitation of Liability</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. The Platform is provided "as is", without any guarantees of uninterrupted operation, meeting User expectations, or suitability for specific purposes.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. The Administration is not responsible for: temporary failures and interruptions in Platform operation; data loss due to actions of the User, third parties, or force majeure; any indirect damages.</p>
          
          <h3 className="font-semibold mt-6 mb-2">8. Moderation and Blocking</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. The Administration has the right to moderate public pages, profiles, and other Content for compliance with legislation, this Agreement, and internal policies.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. In case of violation of Agreement terms, the Administration may without prior notice: delete or hide individual materials; limit account functionality; temporarily or permanently block access to the Platform.</p>
          
          <h3 className="font-semibold mt-6 mb-2">9. B2B Offer for Agencies and Partners</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. B2B partner status applies to legal entities or individual entrepreneurs (agencies, studios, integrators, resellers) that have entered into a separate agreement with the Administration.</p>
          
          <h3 className="font-semibold mt-6 mb-2">10. Final Provisions</h3>
          <p className="text-sm text-muted-foreground mb-2">10.1. This Agreement and relations between the User and Administration are governed by the laws of the Republic of Kazakhstan.</p>
          <p className="text-sm text-muted-foreground mb-2">10.2. All disputes and disagreements under the Agreement shall, if possible, be resolved through negotiations.</p>
          <p className="text-sm text-muted-foreground mb-2">10.3. Account registration and use of the Platform signifies the User's agreement to all terms of the Agreement and Privacy Policy.</p>
          <p className="text-sm text-muted-foreground mb-2">10.4. The current version of the Agreement is always available at: https://lnkmx.my/terms.</p>
          
          {getServiceDeliverySection('en')}
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX платформасының пайдаланушы келісімі</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Осы Пайдаланушы келісімі (бұдан әрі - «Келісім») LinkMAX веб-платформасы мен онымен байланысты қызметтерге (бұдан әрі - «Платформа») жеке тұлғалар мен заңды тұлғалардың өкілдеріне (бұдан әрі - «Пайдаланушы») қол жеткізу және пайдалану шарттарын анықтайды.
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            Платформаны пайдалана отырып, Пайдаланушы Келісім мен Құпиялылық саясатының шарттарымен мұқият танысқанын және оларды толық қабылдайтынын растайды.
          </p>
          
          {getCompanyDetailsSection('kk')}
          
          <h3 className="font-semibold mt-6 mb-2">1. Терминдер</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. LinkMAX - жасанды интеллект көмегімен жеке мини-сайттар (link-in-bio беттері мен микролендингтер), аналитика және лидтерді басқару үшін онлайн-платформа және қызметтер.</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. Платформа - https://lnkmx.my мекенжайындағы веб-сайт, байланысты субдомендер, API, сондай-ақ беттерді жасау мен басқаруға, аналитикаға, CRM-ге және басқа қызметтерге қол жеткізуді қамтамасыз ететін прогрессивті веб-қосымша (PWA).</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. Келісім - осы құжат және оған қосымшалар, Платформаға қол жеткізу мен пайдалану тәртібін реттейді.</p>
          <p className="text-sm text-muted-foreground mb-2">1.4. Құпиялылық саясаты - Пайдаланушылардың жеке деректерін өңдеу мен қорғау тәртібін анықтайтын құжат.</p>
          <p className="text-sm text-muted-foreground mb-2">1.5. Пайдаланушы - Платформада тіркелгі тіркеген әрекетке қабілетті жеке тұлға немесе ұйым атынан Платформаны пайдаланатын заңды тұлғаның/ЖК өкілі.</p>
          
          <h3 className="font-semibold mt-6 mb-2">2. Жалпы ережелер</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. Осы Келісім Платформаның барлық ағымдағы және болашақ мүмкіндіктеріне, соның ішінде жаңартулар мен жаңа қызметтерге қолданылады.</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Платформаны пайдалану: осы Келісім; Құпиялылық саясаты; https://lnkmx.my/pricing сайтында жарияланған тарифтер мен ақылы қызметтер шарттары негізінде жүзеге асырылады.</p>
          
          <h3 className="font-semibold mt-6 mb-2">3. Тіркелу және тіркелгіге қол жеткізу</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Тіркелу https://lnkmx.my мекенжайындағы веб-интерфейс арқылы жүзеге асырылады: email және құпия сөз және/немесе; үшінші тарап қызметтері арқылы кіру (Google, Apple) және/немесе; Telegram боты арқылы растау.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. Пайдаланушы тіркелу кезінде дұрыс деректерді көрсетуге және олардың өзектілігін сақтауға міндетті.</p>
          
          <h3 className="font-semibold mt-6 mb-2">4. Платформаны пайдалану шарттары және Пайдаланушының жауапкершілігі</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. Платформа Пайдаланушыға «сол күйінде» ұсынылады: жеке мини-сайттар/беттер жасау және орналастыру; өз қызметтері мен өнімдерін жылжыту; лидтерді жинау және өңдеу; аналитика және аудиториямен байланыс мақсаттары үшін.</p>
          <p className="text-sm text-muted-foreground mb-2">4.2. Пайдаланушы міндеттенеді: Платформаны тек заңды мақсаттарда пайдалануға; үшінші тараптардың құқықтарын, заңдарды немесе жалпы қабылданған этиканы бұзатын мазмұнды жарияламауға.</p>
          
          <h3 className="font-semibold mt-6 mb-2">5. Ақылы қызметтер, тарифтер және төлемдер</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Платформаның қосымша мүмкіндіктеріне қол жеткізу (PRO тарифі) кемінде 3 айлық мерзімге алдын ала төлемді жазылым негізінде ұсынылады.</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Қазақстан теңгесіндегі (KZT) ағымдағы бағалар: 3 ай - 4 350₸/ай (барлығы 13 050₸); 6 ай - 3 500₸/ай (барлығы 21 000₸); 12 ай - 2 610₸/ай (барлығы 31 320₸). АҚШ долларындағы болжамды баламасы: тиісінше $8.50, $6.80, $5.10/ай.</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. Ағымдағы бағалар, тарифтік жоспарлар мен төлем шарттары https://lnkmx.my/pricing тарифтер бетінде жарияланған.</p>
          <p className="text-sm text-muted-foreground mb-2">5.4. Төлем RoboKassa төлем жүйесі және басқа қолжетімді төлем әдістері арқылы жүзеге асырылады.</p>
          
          <h3 className="font-semibold mt-6 mb-2">6. Мазмұн құқықтары және зияткерлік меншік</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. Платформаға, оның бағдарламалық кодына, дизайнына, корпоративтік стиліне, логотиптері мен техникалық құжаттамасына барлық ерекше құқықтар Әкімшілікке тиесілі.</p>
          
          <h3 className="font-semibold mt-6 mb-2">7. Жауапкершілікті шектеу</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. Платформа «сол күйінде» ұсынылады, үздіксіз жұмыс, Пайдаланушының күтулеріне сәйкестік немесе нақты мақсаттарға жарамдылық кепілдіктерінсіз.</p>
          
          <h3 className="font-semibold mt-6 mb-2">8. Модерация және бұғаттау</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. Әкімшілік жария беттерді, профильдерді және басқа Мазмұнды заңнамаға, осы Келісімге және ішкі саясаттарға сәйкестігі үшін модерациялау құқығына ие.</p>
          
          <h3 className="font-semibold mt-6 mb-2">10. Қорытынды ережелер</h3>
          <p className="text-sm text-muted-foreground mb-2">10.1. Осы Келісімге және Пайдаланушы мен Әкімшілік арасындағы қатынастарға Қазақстан Республикасының қолданыстағы заңнамасы қолданылады.</p>
          <p className="text-sm text-muted-foreground mb-2">10.2. Келісім бойынша барлық даулар мен келіспеушіліктер мүмкіндігінше келіссөздер жолымен шешіледі.</p>
          <p className="text-sm text-muted-foreground mb-2">10.3. Тіркелгіні тіркеу және Платформаны пайдалану Пайдаланушының Келісім мен Құпиялылық саясатының барлық шарттарымен келісуін білдіреді.</p>
          <p className="text-sm text-muted-foreground mb-2">10.4. Келісімнің ағымдағы нұсқасы әрқашан мына мекенжайда қол жетімді: https://lnkmx.my/terms.</p>
          
          {getServiceDeliverySection('kk')}
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h2 className="text-lg font-semibold mb-4">Пользовательское соглашение платформы LinkMAX</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Настоящее Пользовательское соглашение (далее - «Соглашение») определяет условия доступа и использования веб-платформы LinkMAX и связанных с ней сервисов (далее - «Платформа») для физических лиц и представителей юридических лиц (далее - «Пользователь»).
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Используя Платформу, Пользователь подтверждает, что внимательно ознакомился с условиями Соглашения и Политики конфиденциальности и полностью их принимает.
        </p>
        
        {getCompanyDetailsSection('ru')}
        
        <h3 className="font-semibold mt-6 mb-2">1. Термины</h3>
        <p className="text-sm text-muted-foreground mb-2">1.1. LinkMAX - онлайн-платформа и сервисы для создания персональных мини-сайтов (link-in-bio страниц и микролендингов), аналитики и управления лидами с использованием искусственного интеллекта.</p>
        <p className="text-sm text-muted-foreground mb-2">1.2. Платформа - веб-сайт по адресу https://lnkmx.my, связанные поддомены, API, а также прогрессивное веб-приложение (PWA), предоставляющие доступ к функционалу по созданию и управлению страницами, аналитике, CRM и другим сервисам.</p>
        <p className="text-sm text-muted-foreground mb-2">1.3. Соглашение - настоящий документ и все приложения к нему, регламентирующие порядок доступа и использования Платформы.</p>
        <p className="text-sm text-muted-foreground mb-2">1.4. Политика конфиденциальности - документ, определяющий порядок обработки и защиты персональных данных Пользователей, размещённый по адресу https://lnkmx.my/privacy.</p>
        <p className="text-sm text-muted-foreground mb-2">1.5. Пользователь - дееспособное физическое лицо, зарегистрировавшее аккаунт на Платформе, либо представитель юридического лица/ИП, использующий Платформу от имени организации.</p>
        <p className="text-sm text-muted-foreground mb-2">1.6. Аккаунт (Учётная запись) - совокупность данных Пользователя (логин, пароль, Telegram ID и др.), необходимых для аутентификации и доступа к функционалу Платформы.</p>
        <p className="text-sm text-muted-foreground mb-2">1.7. Персональные данные - любая информация, относящаяся к прямо или косвенно определяемому Пользователю (имя, контакты, платежные данные, содержимое страниц и др.).</p>
        <p className="text-sm text-muted-foreground mb-2">1.8. Публичная страница (Page) - сгенерированный или созданный вручную мини-сайт Пользователя, доступный по уникальному адресу (slug).</p>
        <p className="text-sm text-muted-foreground mb-2">1.9. Контент Пользователя - любые материалы, размещаемые Пользователем на Платформе: тексты, изображения, видео, ссылки, товары, формы, файлы и др.</p>
        <p className="text-sm text-muted-foreground mb-2">1.10. Сервисы - платные и бесплатные функции Платформы (создание страниц, аналитика, Mini-CRM, AI-генерация, интеграции и др.).</p>
        <p className="text-sm text-muted-foreground mb-2">1.11. Тарифы - комплексы функционала (BASIC, PRO, BUSINESS), предоставляемые Пользователю на условиях подписки.</p>
        <p className="text-sm text-muted-foreground mb-2">1.12. Администрация Платформы (Администрация) - правообладатель LinkMAX и уполномоченные им лица, управляющие работой Платформы.</p>
        
        <h3 className="font-semibold mt-6 mb-2">2. Общие положения</h3>
        <p className="text-sm text-muted-foreground mb-2">2.1. Настоящее Соглашение распространяется на все текущие и будущие функции Платформы, включая обновления и новые сервисы.</p>
        <p className="text-sm text-muted-foreground mb-2">2.2. Использование Платформы осуществляется на условиях: настоящего Соглашения; Политики конфиденциальности; условий тарифов и платных сервисов, опубликованных на https://lnkmx.my/pricing.</p>
        <p className="text-sm text-muted-foreground mb-2">2.3. Администрация вправе вносить изменения в Соглашение и Политику конфиденциальности в одностороннем порядке. Новая редакция вступает в силу с момента публикации на Платформе, если иное прямо не указано.</p>
        <p className="text-sm text-muted-foreground mb-2">2.4. Начало или продолжение использования Платформы после изменения документов означает согласие Пользователя с такими изменениями.</p>
        
        <h3 className="font-semibold mt-6 mb-2">3. Регистрация и доступ к аккаунту</h3>
        <p className="text-sm text-muted-foreground mb-2">3.1. Регистрация осуществляется через веб-интерфейс по адресу https://lnkmx.my с использованием: email и пароля и/или; входа через сторонние сервисы (Google, Apple) и/или; верификации через Telegram-бота.</p>
        <p className="text-sm text-muted-foreground mb-2">3.2. Пользователь обязан указывать достоверные данные при регистрации и поддерживать их актуальность.</p>
        <p className="text-sm text-muted-foreground mb-2">3.3. Для активации функций уведомлений и Mini-CRM может требоваться обязательная привязка Telegram-аккаунта через официального бота LinkMAX.</p>
        <p className="text-sm text-muted-foreground mb-2">3.4. Пользователь несёт полную ответственность за сохранность логина, пароля и доступа к Telegram-аккаунту. Все действия, совершенные через его аккаунт, считаются действиями Пользователя.</p>
        
        <h3 className="font-semibold mt-6 mb-2">4. Условия использования Платформы и ответственность Пользователя</h3>
        <p className="text-sm text-muted-foreground mb-2">4.1. Платформа предоставляется Пользователю «как есть» (as is) для целей: создания и размещения персональных мини-сайтов/страниц; продвижения собственных услуг и продуктов; сбора и обработки лидов (заявок); аналитики и коммуникации с аудиторией.</p>
        <p className="text-sm text-muted-foreground mb-2">4.2. Пользователь обязуется: использовать Платформу только в законных целях; не размещать контент, нарушающий права третьих лиц, нормы законодательства и общепринятую этику.</p>
        <p className="text-sm text-muted-foreground mb-2">4.3. Запрещённый контент включает, но не ограничивается: материалы экстремистского, террористического, порнографического характера; пропаганду насилия, расовой, национальной, религиозной ненависти; нарушение авторских, смежных и иных прав; недостоверную рекламу и любые формы мошенничества; персональные данные третьих лиц без их согласия.</p>
        
        <h3 className="font-semibold mt-6 mb-2">5. Платные сервисы, тарифы и платежи</h3>
        <p className="text-sm text-muted-foreground mb-2">5.1. Доступ к дополнительным возможностям Платформы (тариф PRO) предоставляется на условиях предоплатной подписки с минимальным периодом 3 месяца.</p>
        <p className="text-sm text-muted-foreground mb-2">5.2. Актуальные цены в казахстанских тенге (KZT): 3 месяца - 4 350₸/мес (итого 13 050₸); 6 месяцев - 3 500₸/мес (итого 21 000₸); 12 месяцев - 2 610₸/мес (итого 31 320₸). Эквивалент в долларах США: $8.50, $6.80, $5.10/мес соответственно.</p>
        <p className="text-sm text-muted-foreground mb-2">5.3. Цены, состав тарифов и условия оплаты публикуются на странице тарифов https://lnkmx.my/pricing и могут изменяться Администрацией в одностороннем порядке для новых периодов.</p>
        <p className="text-sm text-muted-foreground mb-2">5.4. Оплата производится через платёжную систему RoboKassa и другие доступные способы оплаты.</p>
        <p className="text-sm text-muted-foreground mb-2">5.5. Факт успешной оплаты подтверждается электронной квитанцией/уведомлением. С этого момента услуги считаются оказанными в объёме, соответствующем выбранному тарифу и периоду.</p>
        
        <h3 className="font-semibold mt-6 mb-2">6. Права на контент и интеллектуальная собственность</h3>
        <p className="text-sm text-muted-foreground mb-2">6.1. Все исключительные права на Платформу, её программный код, дизайн, фирменный стиль, логотипы и техническую документацию принадлежат Администрации.</p>
        <p className="text-sm text-muted-foreground mb-2">6.2. Пользователь сохраняет права на свой Контент, но предоставляет Администрации неисключительную лицензию на: хранение и отображение Контента на Платформе; создание резервных копий; использование в пределах, необходимых для функционирования сервисов.</p>
        
        <h3 className="font-semibold mt-6 mb-2">7. Ограничение ответственности</h3>
        <p className="text-sm text-muted-foreground mb-2">7.1. Платформа предоставляется «как есть», без каких-либо гарантий бесперебойной работы, соответствия ожиданиям Пользователя или пригодности для конкретных целей.</p>
        <p className="text-sm text-muted-foreground mb-2">7.2. Администрация не несёт ответственности за: временные сбои и перерывы в работе Платформы; потерю данных в результате действий Пользователя, третьих лиц или форс-мажорных обстоятельств; любой косвенный ущерб.</p>
        
        <h3 className="font-semibold mt-6 mb-2">8. Модерация и блокировка</h3>
        <p className="text-sm text-muted-foreground mb-2">8.1. Администрация вправе проводить модерацию публичных страниц, профилей и иного Контента на предмет соответствия законодательству, настоящему Соглашению и внутренним политикам.</p>
        <p className="text-sm text-muted-foreground mb-2">8.2. В случае нарушения условий Соглашения Администрация вправе без предварительного уведомления: удалить или скрыть отдельные материалы; ограничить функционал аккаунта; временно или постоянно заблокировать доступ к Платформе.</p>
        
        <h3 className="font-semibold mt-6 mb-2">9. B2B-оферта для агентств и партнёров</h3>
        <p className="text-sm text-muted-foreground mb-2">9.1. B2B-партнёром считается юридическое лицо или индивидуальный предприниматель (агентство, студия, интегратор, реселлер), заключивший с Администрацией отдельный договор и/или принявший условия B2B-оферты LinkMAX.</p>
        
        <h3 className="font-semibold mt-6 mb-2">10. Заключительные положения</h3>
        <p className="text-sm text-muted-foreground mb-2">10.1. К настоящему Соглашению и отношениям между Пользователем и Администрацией применяется действующее законодательство Республики Казахстан.</p>
        <p className="text-sm text-muted-foreground mb-2">10.2. Все споры и разногласия по Соглашению по возможности решаются путём переговоров. При недостижении соглашения споры подлежат рассмотрению в суде по месту регистрации Администрации.</p>
        <p className="text-sm text-muted-foreground mb-2">10.3. Регистрация аккаунта и использование Платформы означает согласие Пользователя со всеми условиями Соглашения и Политики конфиденциальности.</p>
        <p className="text-sm text-muted-foreground mb-2">10.4. Актуальная версия Соглашения всегда доступна по адресу: https://lnkmx.my/terms.</p>
        
        {getServiceDeliverySection('ru')}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t('legal.termsOfService', 'Пользовательское соглашение')}</DialogTitle>
          <DialogDescription>
            {t('legal.termsDescription', 'Ознакомьтесь с условиями использования платформы LinkMAX')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="pr-4">
            {getTermsContent()}
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
interface TermsLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function TermsLink({ children, className }: TermsLinkProps) {
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
      <TermsOfServiceModal open={open} onOpenChange={setOpen} />
    </>
  );
}
