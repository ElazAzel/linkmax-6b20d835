import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

const PaymentTerms = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const canonical = 'https://lnkmx.my/payment-terms';
  const seoTitle =
    lang === 'ru'
      ? 'Условия оплаты — lnkmx'
      : lang === 'kk'
        ? 'Төлем шарттары — lnkmx'
        : 'Payment Terms — lnkmx';
  const seoDescription =
    lang === 'ru'
      ? 'Условия оплаты и возвратов для тарифов lnkmx.'
      : lang === 'kk'
        ? 'lnkmx тарифтері үшін төлем және қайтару шарттары.'
        : 'Payment and refund terms for lnkmx plans.';

  const getPaymentTermsContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Payment Terms for LinkMAX Users</h1>
          <p className="mb-6 text-muted-foreground">Version: 1.0 | Effective: January 5, 2026</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. General Provisions</h2>
          <p className="mb-2">1.1. These Payment Terms (hereinafter - "Payment Terms") govern the payment procedure for LinkMAX platform services (hereinafter - "Platform", "LinkMAX") by individuals and representatives of legal entities.</p>
          <p className="mb-2">1.2. Payment Terms are an integral part of the User Agreement and apply to all paid services and plans of LinkMAX.</p>
          <p className="mb-4">1.3. By paying for LinkMAX services, the User confirms that they have read and agree to the User Agreement, Privacy Policy, and these Payment Terms.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Plans and Pricing</h2>
          <p className="mb-2">2.1. LinkMAX services are provided on a subscription model for plans (e.g., PRO, BUSINESS).</p>
          <p className="mb-2">2.2. Base rates for PRO subscription at the time of publication:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>3 months - 4,350 ₸ per month (total 13,050 ₸ for the period);</li>
            <li>6 months - 3,698 ₸ per month (total 22,185 ₸ for the period) - 15% discount;</li>
            <li>12 months - 3,045 ₸ per month (total 36,540 ₸ for the period) - 30% discount.</li>
          </ul>
          <p className="mb-2">2.3. All prices are shown in the national currency of the Republic of Kazakhstan - tenge (KZT). Foreign currency equivalents are for informational purposes only.</p>
          <p className="mb-4">2.4. The current list of plans, pricing, and included features are published on the Platform's pricing page and may be updated by the Administration unilaterally for new payment periods.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Payment Procedure</h2>
          <p className="mb-2">3.1. Payment for services is made on a full prepayment basis for the selected subscription period (3, 6, or 12 months).</p>
          <p className="mb-2">3.2. Payment is made through available payment services and bank cards, the list of which is indicated in the payment interface (e.g., RoboKassa and other partners).</p>
          <p className="mb-2">3.3. Upon successful payment, the User receives electronic confirmation (receipt/notification) and access to the selected plan functionality within 15 minutes of payment confirmation by the payment system.</p>
          <p className="mb-4">3.4. The moment of service delivery is considered to be the provision of access to the selected plan functionality on the Platform.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription Period and Renewal</h2>
          <p className="mb-2">4.1. The subscription period starts from the date of successful payment and continues for the selected term (3, 6, or 12 months).</p>
          <p className="mb-2">4.2. At the end of the paid period, access to paid functionality may be: automatically renewed for a similar period if the auto-renewal feature is enabled; or terminated if the User has not made a new payment in advance or has disabled auto-renewal.</p>
          <p className="mb-4">4.3. The User may disable subscription auto-renewal at any time (if used) through account settings or according to instructions on the payment page.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Taxes and Additional Fees</h2>
          <p className="mb-2">5.1. Plan prices include applicable taxes unless otherwise explicitly stated in the plan description or on the payment page.</p>
          <p className="mb-2">5.2. Banks and payment intermediaries may charge additional fees for transaction processing and currency conversion, which are not controlled by the Administration.</p>
          <p className="mb-4">5.3. If payment is made in a currency other than tenge, conversion is performed at the rate of the User's bank or payment system.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Refund and Cancellation Policy</h2>
          <p className="mb-2">6.1. Refunds for LinkMAX digital services are made in cases and in the manner established by the current legislation of the Republic of Kazakhstan and described in the User Agreement.</p>
          <p className="mb-2">6.2. General principles:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Refund may be possible if the service was not used or there was a technical impossibility of its provision due to Administration's fault;</li>
            <li>Refund is generally not provided for active use of paid functionality and after the established period (e.g., 14 calendar days) from payment;</li>
            <li>For partial use of the service, a partial refund may be considered, calculated proportionally to the unused subscription period.</li>
          </ul>
          <p className="mb-2">6.3. To request a refund, the User sends an inquiry to the Administration's email address with their full name, account email, payment date and amount, and reason for refund request.</p>
          <p className="mb-4">6.4. The refund request is reviewed within established deadlines, and the User is notified of the result at their contact address.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Subscription Cancellation</h2>
          <p className="mb-2">7.1. The User may discontinue using the paid plan at any time by disabling auto-renewal or not making a new payment at the end of the subscription period.</p>
          <p className="mb-2">7.2. Subscription cancellation does not mean automatic refund for the already paid period, except as expressly provided in the refund policy and/or law.</p>
          <p className="mb-4">7.3. After the paid period ends, access to paid features is terminated, and the User's account may be transferred to a free plan with limited functionality.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Liability and Limitations</h2>
          <p className="mb-2">8.1. The User is responsible for the correctness of entered payment details and the security of payment data on their bank/payment provider's side.</p>
          <p className="mb-2">8.2. The Administration is not responsible for the bank's or payment system's refusal to process a transaction, as well as for delays related to their operation.</p>
          <p className="mb-4">8.3. In case of suspected fraud, violation of law, or Platform terms of use, the Administration may suspend service provision and contact the payment provider for transaction verification.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Payment Terms</h2>
          <p className="mb-2">9.1. The Administration may change these Payment Terms, plans, and the list of paid services.</p>
          <p className="mb-2">9.2. The updated version of Payment Terms takes effect upon publication on the Platform unless otherwise specified in the new version.</p>
          <p className="mb-4">9.3. Continued use of paid services after changes take effect means the User's agreement to such changes.</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">LinkMAX пайдаланушылары үшін төлем шарттары</h1>
          <p className="mb-6 text-muted-foreground">Нұсқа: 1.0 | Күшіне енеді: 2026 жылғы 5 қаңтар</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Жалпы ережелер</h2>
          <p className="mb-4">Осы Төлем шарттары LinkMAX платформасы қызметтеріне төлем тәртібін реттейді.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Тарифтер</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>3 ай - айына 4 350 ₸ (кезең үшін барлығы 13 050 ₸);</li>
            <li>6 ай - айына 3 500 ₸ (кезең үшін барлығы 21 000 ₸);</li>
            <li>12 ай - айына 3 045 ₸ (кезең үшін барлығы 36 540 ₸).</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3-9. Толық мәтін</h2>
          <p className="mb-4">Толық ақпарат алу үшін орыс немесе ағылшын нұсқасын қараңыз.</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h1 className="text-3xl font-bold mb-6">Условия оплаты для пользователей LinkMAX</h1>
        <p className="mb-6 text-muted-foreground">Версия: 1.0 | Дата вступления в силу: 05.01.2026</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Общие положения</h2>
        <p className="mb-2">1.1. Настоящие Условия оплаты (далее - «Условия оплаты») регулируют порядок оплаты услуг платформы LinkMAX (далее - «Платформа», «LinkMAX») физическими лицами и представителями юридических лиц.</p>
        <p className="mb-2">1.2. Условия оплаты являются неотъемлемой частью Пользовательского соглашения и применяются ко всем платным сервисам и тарифам LinkMAX.</p>
        <p className="mb-4">1.3. Осуществляя оплату услуг LinkMAX, Пользователь подтверждает, что ознакомился и согласен с Пользовательским соглашением, Политикой конфиденциальности и настоящими Условиями оплаты.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Тарифы и стоимость услуг</h2>
        <p className="mb-2">2.1. Услуги LinkMAX предоставляются по модели подписки на тарифные планы (например, PRO, BUSINESS).</p>
        <p className="mb-2">2.2. Базовые тарифы для PRO подписки на момент публикации настоящих Условий оплаты:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>3 месяца - 4 350 ₸ в месяц (итого 13 050 ₸ за период);</li>
          <li>6 месяцев - 3 500 ₸ в месяц (итого 21 000 ₸ за период);</li>
          <li>12 месяцев - 3 045 ₸ в месяц (итого 36 540 ₸ за период).</li>
        </ul>
        <p className="mb-2">2.3. Все цены указываются в национальной валюте Республики Казахстан - тенге (KZT). При отображении эквивалента в иностранной валюте такое значение носит информационный характер.</p>
        <p className="mb-4">2.4. Актуальный перечень тарифов, их стоимость и включённые функции публикуются на странице тарифов Платформы и могут обновляться Администрацией в одностороннем порядке для новых периодов оплаты.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Порядок оплаты</h2>
        <p className="mb-2">3.1. Оплата услуг осуществляется на условиях полной предоплаты за выбранный период подписки (3, 6 или 12 месяцев).</p>
        <p className="mb-2">3.2. Оплата производится через доступные платёжные сервисы и банковские карты, перечень которых указывается в интерфейсе оплаты (например, RoboKassa и другие партнёры).</p>
        <p className="mb-2">3.3. В случае успешной оплаты Пользователь получает электронное подтверждение (квитанцию/уведомление) и доступ к функционалу выбранного тарифа в течение 15 минут с момента подтверждения платежа платёжной системой.</p>
        <p className="mb-4">3.4. Моментом оказания услуги считается предоставление доступа к функционалу выбранного тарифного плана на Платформе.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Период действия подписки и продление</h2>
        <p className="mb-2">4.1. Период подписки начинается с даты успешной оплаты и продолжается в течение выбранного срока (3, 6 или 12 месяцев).</p>
        <p className="mb-2">4.2. По окончании оплаченного периода доступ к платному функционалу может быть: автоматически продлён на аналогичный срок при наличии включённой функции автопродления; или прекращён, если Пользователь заранее не оформил новую оплату или отключил автопродление.</p>
        <p className="mb-4">4.3. Пользователь вправе в любой момент отключить автопродление подписки (если оно используется) через настройки аккаунта либо согласно инструкциям на странице оплаты.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Налоги и дополнительные комиссии</h2>
        <p className="mb-2">5.1. Стоимость тарифов указывается с учётом применимых налогов, если иное явно не указано в описании тарифа или на странице оплаты.</p>
        <p className="mb-2">5.2. Банки и платёжные посредники могут взимать дополнительные комиссии за проведение транзакций и конвертацию валют, которые не контролируются Администрацией.</p>
        <p className="mb-4">5.3. В случае оплаты в валюте, отличной от тенге, конвертация осуществляется по курсу банка или платёжной системы Пользователя.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Политика возвратов и отмены</h2>
        <p className="mb-2">6.1. Возврат денежных средств за цифровые услуги LinkMAX осуществляется в случаях и порядке, установленных действующим законодательством Республики Казахстан и описанных в Пользовательском соглашении.</p>
        <p className="mb-2">6.2. Общие принципы:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>возврат может быть возможен, если услуга не была использована либо существовала техническая невозможность её предоставления по вине Администрации;</li>
          <li>возврат, как правило, не предоставляется при активном использовании платного функционала и по истечении установленного периода (например, 14 календарных дней) с момента оплаты;</li>
          <li>при частичном использовании услуги может рассматриваться частичный возврат, рассчитанный пропорционально неиспользованному периоду подписки.</li>
        </ul>
        <p className="mb-2">6.3. Для запроса возврата Пользователь направляет обращение на электронный адрес Администрации с указанием Ф.И.О., email аккаунта, даты и суммы платежа, причины запроса возврата.</p>
        <p className="mb-4">6.4. Заявка на возврат рассматривается в установленные сроки, о результате Пользователь уведомляется по контактному адресу.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Отказ от подписки</h2>
        <p className="mb-2">7.1. Пользователь вправе прекратить использование платного тарифа в любой момент, отключив автопродление или не оформляя новую оплату по окончании периода подписки.</p>
        <p className="mb-2">7.2. Отказ от подписки не означает автоматический возврат денежных средств за уже оплаченный период, за исключением случаев, прямо предусмотренных политикой возвратов и/или законом.</p>
        <p className="mb-4">7.3. После окончания оплаченного периода доступ к платным функциям прекращается, при этом аккаунт Пользователя может быть переведён на бесплатный тариф с ограниченным функционалом.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Ответственность и ограничения</h2>
        <p className="mb-2">8.1. Пользователь несёт ответственность за корректность вводимых платёжных реквизитов и сохранность платёжных данных на стороне его банка/платёжного провайдера.</p>
        <p className="mb-2">8.2. Администрация не несёт ответственности за отказ банка или платёжной системы провести операцию, а также за задержки, связанные с их работой.</p>
        <p className="mb-4">8.3. В случае подозрения на мошенничество, нарушение закона или условий использования Платформы Администрация вправе приостановить предоставление услуг и обратиться к платёжному провайдеру для проверки операций.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Изменение Условий оплаты</h2>
        <p className="mb-2">9.1. Администрация вправе изменять настоящие Условия оплаты, тарифы и перечень платных услуг.</p>
        <p className="mb-2">9.2. Обновлённая редакция Условий оплаты вступает в силу с момента публикации на Платформе, если иное не указано в тексте новой редакции.</p>
        <p className="mb-4">9.3. Продолжение использования платных услуг после вступления изменений в силу означает согласие Пользователя с такими изменениями.</p>
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
            {getPaymentTermsContent()}
          </article>
        </div>
      </div>
    </>
  );
};

export default PaymentTerms;
