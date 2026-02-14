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

interface PaymentTermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentTermsModal({ open, onOpenChange }: PaymentTermsModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const getPaymentTermsContent = () => {
    if (lang === 'en') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">Payment Terms for LinkMAX Users</h2>
          <p className="mb-4 text-sm text-muted-foreground">Version: 1.0 | Effective: January 5, 2026</p>
          
          <h3 className="font-semibold mt-6 mb-2">1. General Provisions</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. These Payment Terms (hereinafter - "Payment Terms") govern the payment procedure for LinkMAX platform services (hereinafter - "Platform", "LinkMAX") by individuals and representatives of legal entities.</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. Payment Terms are an integral part of the User Agreement and apply to all paid services and plans of LinkMAX.</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. By paying for LinkMAX services, the User confirms that they have read and agree to the User Agreement, Privacy Policy, and these Payment Terms.</p>

          <h3 className="font-semibold mt-6 mb-2">2. Plans and Pricing</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. LinkMAX services are provided on a subscription model for plans (e.g., PRO, BUSINESS).</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Base rates for PRO subscription at the time of publication:</p>
          <p className="text-sm text-muted-foreground mb-2">• 3 months - 4,350 ₸ per month (total 13,050 ₸ for the period);</p>
          <p className="text-sm text-muted-foreground mb-2">• 6 months - 3,698 ₸ per month (total 22,185 ₸ for the period) - 15% discount;</p>
          <p className="text-sm text-muted-foreground mb-2">• 12 months - 3,045 ₸ per month (total 36,540 ₸ for the period) - 30% discount.</p>
          <p className="text-sm text-muted-foreground mb-2">2.3. All prices are shown in the national currency of the Republic of Kazakhstan - tenge (KZT). Foreign currency equivalents are for informational purposes only.</p>
          <p className="text-sm text-muted-foreground mb-2">2.4. The current list of plans, pricing, and included features are published on the Platform's pricing page and may be updated by the Administration unilaterally for new payment periods.</p>

          <h3 className="font-semibold mt-6 mb-2">3. Payment Procedure</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Payment for services is made on a full prepayment basis for the selected subscription period (3, 6, or 12 months).</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. Payment is made through available payment services and bank cards, the list of which is indicated in the payment interface (e.g., RoboKassa and other partners).</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Upon successful payment, the User receives electronic confirmation (receipt/notification) and access to the selected plan functionality within 15 minutes of payment confirmation by the payment system.</p>
          <p className="text-sm text-muted-foreground mb-2">3.4. The moment of service delivery is considered to be the provision of access to the selected plan functionality on the Platform.</p>

          <h3 className="font-semibold mt-6 mb-2">4. Subscription Period and Renewal</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. The subscription period starts from the date of successful payment and continues for the selected term (3, 6, or 12 months).</p>
          <p className="text-sm text-muted-foreground mb-2">4.2. At the end of the paid period, access to paid functionality may be: automatically renewed for a similar period if the auto-renewal feature is enabled; or terminated if the User has not made a new payment in advance or has disabled auto-renewal (depending on the model implemented in the product).</p>
          <p className="text-sm text-muted-foreground mb-2">4.3. The User may disable subscription auto-renewal at any time (if used) through account settings or according to instructions on the payment page.</p>

          <h3 className="font-semibold mt-6 mb-2">5. Taxes and Additional Fees</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Plan prices include applicable taxes unless otherwise explicitly stated in the plan description or on the payment page.</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Banks and payment intermediaries may charge additional fees for transaction processing and currency conversion, which are not controlled by the Administration.</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. If payment is made in a currency other than tenge, conversion is performed at the rate of the User's bank or payment system.</p>

          <h3 className="font-semibold mt-6 mb-2">6. Refund and Cancellation Policy</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. Refunds for LinkMAX digital services are made in cases and in the manner established by the current legislation of the Republic of Kazakhstan and described in the User Agreement and/or a separate "Refund Policy" section.</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. General principles: refund may be possible if the service was not used or there was a technical impossibility of its provision due to Administration's fault; refund is generally not provided for active use of paid functionality and after the established period (e.g., 14 calendar days) from payment; for partial use of the service, a partial refund may be considered, calculated proportionally to the unused subscription period (if provided by the refund policy).</p>
          <p className="text-sm text-muted-foreground mb-2">6.3. To request a refund, the User sends an inquiry to the Administration's email address with their full name, account email, payment date and amount, and reason for refund request.</p>
          <p className="text-sm text-muted-foreground mb-2">6.4. The refund request is reviewed within established deadlines, and the User is notified of the result at their contact address.</p>

          <h3 className="font-semibold mt-6 mb-2">7. Subscription Cancellation</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. The User may discontinue using the paid plan at any time by disabling auto-renewal or not making a new payment at the end of the subscription period.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. Subscription cancellation does not mean automatic refund for the already paid period, except as expressly provided in the refund policy and/or law.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. After the paid period ends, access to paid features is terminated, and the User's account may be transferred to a free plan with limited functionality.</p>

          <h3 className="font-semibold mt-6 mb-2">8. Liability and Limitations</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. The User is responsible for the correctness of entered payment details and the security of payment data on their bank/payment provider's side.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. The Administration is not responsible for the bank's or payment system's refusal to process a transaction, as well as for delays related to their operation.</p>
          <p className="text-sm text-muted-foreground mb-2">8.3. In case of suspected fraud, violation of law, or Platform terms of use, the Administration may suspend service provision and contact the payment provider for transaction verification.</p>

          <h3 className="font-semibold mt-6 mb-2">9. Changes to Payment Terms</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. The Administration may change these Payment Terms, plans, and the list of paid services.</p>
          <p className="text-sm text-muted-foreground mb-2">9.2. The updated version of Payment Terms takes effect upon publication on the Platform unless otherwise specified in the new version.</p>
          <p className="text-sm text-muted-foreground mb-2">9.3. Continued use of paid services after changes take effect means the User's agreement to such changes.</p>
        </>
      );
    }

    if (lang === 'kk') {
      return (
        <>
          <h2 className="text-lg font-semibold mb-4">LinkMAX пайдаланушылары үшін төлем шарттары</h2>
          <p className="mb-4 text-sm text-muted-foreground">Нұсқа: 1.0 | Күшіне енеді: 2026 жылғы 5 қаңтар</p>
          
          <h3 className="font-semibold mt-6 mb-2">1. Жалпы ережелер</h3>
          <p className="text-sm text-muted-foreground mb-2">1.1. Осы Төлем шарттары (бұдан әрі - «Төлем шарттары») жеке тұлғалар мен заңды тұлғалар өкілдерінің LinkMAX платформасы (бұдан әрі - «Платформа», «LinkMAX») қызметтеріне төлем тәртібін реттейді.</p>
          <p className="text-sm text-muted-foreground mb-2">1.2. Төлем шарттары Пайдаланушы келісімінің ажырамас бөлігі болып табылады және LinkMAX-тің барлық ақылы қызметтері мен тарифтеріне қолданылады.</p>
          <p className="text-sm text-muted-foreground mb-2">1.3. LinkMAX қызметтеріне төлем жасай отырып, Пайдаланушы Пайдаланушы келісімін, Құпиялылық саясатын және осы Төлем шарттарын оқығанын және келіскенін растайды.</p>

          <h3 className="font-semibold mt-6 mb-2">2. Тарифтер мен бағалар</h3>
          <p className="text-sm text-muted-foreground mb-2">2.1. LinkMAX қызметтері тарифтік жоспарларға (мысалы, PRO, BUSINESS) жазылым моделі бойынша ұсынылады.</p>
          <p className="text-sm text-muted-foreground mb-2">2.2. Осы Төлем шарттарын жариялау сәтіндегі PRO жазылымының базалық тарифтері:</p>
          <p className="text-sm text-muted-foreground mb-2">• 3 ай - айына 4 350 ₸ (кезең үшін барлығы 13 050 ₸);</p>
          <p className="text-sm text-muted-foreground mb-2">• 6 ай - айына 3 500 ₸ (кезең үшін барлығы 21 000 ₸);</p>
          <p className="text-sm text-muted-foreground mb-2">• 12 ай - айына 3 045 ₸ (кезең үшін барлығы 36 540 ₸).</p>
          <p className="text-sm text-muted-foreground mb-2">2.3. Барлық бағалар Қазақстан Республикасының ұлттық валютасымен - теңгемен (KZT) көрсетілген. Шетел валютасындағы эквивалент ақпараттық сипатта.</p>
          <p className="text-sm text-muted-foreground mb-2">2.4. Тарифтердің, олардың құны мен қамтылған функциялардың ағымдағы тізімі Платформаның тарифтер бетінде жарияланады және жаңа төлем кезеңдері үшін Әкімшілікпен біржақты тәртіпте жаңартылуы мүмкін.</p>

          <h3 className="font-semibold mt-6 mb-2">3. Төлем тәртібі</h3>
          <p className="text-sm text-muted-foreground mb-2">3.1. Қызметтерге төлем таңдалған жазылым кезеңі (3, 6 немесе 12 ай) үшін толық алдын ала төлем шарттарында жүзеге асырылады.</p>
          <p className="text-sm text-muted-foreground mb-2">3.2. Төлем қол жетімді төлем қызметтері мен банк карталары арқылы жүргізіледі, олардың тізімі төлем интерфейсінде көрсетіледі (мысалы, RoboKassa және басқа серіктестер).</p>
          <p className="text-sm text-muted-foreground mb-2">3.3. Төлем сәтті болған жағдайда Пайдаланушы электрондық растау (түбіртек/хабарлама) және төлем жүйесі төлемді растаған сәттен бастап 15 минут ішінде таңдалған тариф функционалына қол жеткізуді алады.</p>
          <p className="text-sm text-muted-foreground mb-2">3.4. Қызмет көрсету сәті ретінде Платформада таңдалған тарифтік жоспар функционалына қол жеткізуді ұсыну саналады.</p>

          <h3 className="font-semibold mt-6 mb-2">4. Жазылым мерзімі және ұзарту</h3>
          <p className="text-sm text-muted-foreground mb-2">4.1. Жазылым мерзімі төлем сәтті өткен күннен басталады және таңдалған мерзім ішінде (3, 6 немесе 12 ай) жалғасады.</p>
          <p className="text-sm text-muted-foreground mb-2">4.2. Төленген кезең аяқталғаннан кейін ақылы функционалға қол жеткізу: авто-ұзарту функциясы қосылған болса, ұқсас мерзімге автоматты түрде ұзартылуы мүмкін; немесе Пайдаланушы жаңа төлемді алдын ала жасамаған немесе авто-ұзартуды өшірген болса, тоқтатылуы мүмкін (өнімде іске асырылған модельге байланысты).</p>
          <p className="text-sm text-muted-foreground mb-2">4.3. Пайдаланушы кез келген уақытта жазылымның авто-ұзартуын өшіруге құқылы (пайдаланылса) аккаунт параметрлері арқылы немесе төлем бетіндегі нұсқауларға сәйкес.</p>

          <h3 className="font-semibold mt-6 mb-2">5. Салықтар мен қосымша комиссиялар</h3>
          <p className="text-sm text-muted-foreground mb-2">5.1. Тарифтердің құны қолданылатын салықтарды ескере отырып көрсетілген, егер тариф сипаттамасында немесе төлем бетінде өзгеше айқын көрсетілмесе.</p>
          <p className="text-sm text-muted-foreground mb-2">5.2. Банктер мен төлем делдалдары транзакцияларды өңдеу және валютаны конвертациялау үшін қосымша комиссиялар алуы мүмкін, олар Әкімшілікпен бақыланбайды.</p>
          <p className="text-sm text-muted-foreground mb-2">5.3. Теңгеден басқа валютамен төлеген жағдайда, конвертация Пайдаланушының банкі немесе төлем жүйесі бағамы бойынша жүргізіледі.</p>

          <h3 className="font-semibold mt-6 mb-2">6. Қайтару және бас тарту саясаты</h3>
          <p className="text-sm text-muted-foreground mb-2">6.1. LinkMAX цифрлық қызметтері үшін ақшаны қайтару Қазақстан Республикасының қолданыстағы заңнамасында белгіленген жағдайларда және тәртіпте, сондай-ақ Пайдаланушы келісімінде және/немесе «Қайтару саясаты» бөлек бөлімінде сипатталған тәртіпте жүзеге асырылады.</p>
          <p className="text-sm text-muted-foreground mb-2">6.2. Жалпы принциптер: қызмет пайдаланылмаған немесе Әкімшіліктің кінәсінен оны ұсынудың техникалық мүмкіндігі болмаған жағдайда қайтару мүмкін болуы мүмкін; ақылы функционалды белсенді пайдалану кезінде және төлемнен кейін белгіленген мерзім өткеннен кейін (мысалы, 14 күнтізбелік күн) қайтару, әдетте, ұсынылмайды; қызметті ішінара пайдаланған кезде жазылымның пайдаланылмаған кезеңіне пропорционалды есептелген ішінара қайтару қарастырылуы мүмкін (қайтару саясатында көзделген болса).</p>
          <p className="text-sm text-muted-foreground mb-2">6.3. Қайтаруды сұрау үшін Пайдаланушы Әкімшіліктің электрондық мекенжайына Т.А.Ә., аккаунт email-ін, төлем күні мен сомасын, қайтаруды сұрау себебін көрсете отырып өтініш жібереді.</p>
          <p className="text-sm text-muted-foreground mb-2">6.4. Қайтару туралы өтініш белгіленген мерзімде қаралады, нәтижесі туралы Пайдаланушыға байланыс мекенжайы бойынша хабарланады.</p>

          <h3 className="font-semibold mt-6 mb-2">7. Жазылымнан бас тарту</h3>
          <p className="text-sm text-muted-foreground mb-2">7.1. Пайдаланушы авто-ұзартуды өшіру немесе жазылым кезеңі аяқталғаннан кейін жаңа төлемді ресімдемеу арқылы кез келген уақытта ақылы тарифті пайдалануды тоқтатуға құқылы.</p>
          <p className="text-sm text-muted-foreground mb-2">7.2. Жазылымнан бас тарту бұрыннан төленген кезең үшін ақшаны автоматты түрде қайтаруды білдірмейді, қайтару саясаты және/немесе заңмен тікелей көзделген жағдайларды қоспағанда.</p>
          <p className="text-sm text-muted-foreground mb-2">7.3. Төленген кезең аяқталғаннан кейін ақылы функцияларға қол жеткізу тоқтатылады, бұл ретте Пайдаланушының аккаунты шектеулі функционалы бар тегін тарифке ауыстырылуы мүмкін.</p>

          <h3 className="font-semibold mt-6 mb-2">8. Жауапкершілік пен шектеулер</h3>
          <p className="text-sm text-muted-foreground mb-2">8.1. Пайдаланушы енгізілген төлем деректемелерінің дұрыстығы және оның банкі/төлем провайдері жағындағы төлем деректерінің сақталуы үшін жауапты.</p>
          <p className="text-sm text-muted-foreground mb-2">8.2. Әкімшілік банктің немесе төлем жүйесінің операцияны өткізуден бас тартуы, сондай-ақ олардың жұмысына байланысты кешігулер үшін жауапты емес.</p>
          <p className="text-sm text-muted-foreground mb-2">8.3. Алаяқтыққа, заңды немесе Платформаны пайдалану шарттарын бұзуға күдік туындаған жағдайда Әкімшілік қызмет көрсетуді тоқтата тұруға және операцияларды тексеру үшін төлем провайдеріне жүгінуге құқылы.</p>

          <h3 className="font-semibold mt-6 mb-2">9. Төлем шарттарын өзгерту</h3>
          <p className="text-sm text-muted-foreground mb-2">9.1. Әкімшілік осы Төлем шарттарын, тарифтерді және ақылы қызметтер тізімін өзгертуге құқылы.</p>
          <p className="text-sm text-muted-foreground mb-2">9.2. Төлем шарттарының жаңартылған редакциясы Платформада жарияланған сәттен күшіне енеді, егер жаңа редакция мәтінінде өзгеше көрсетілмесе.</p>
          <p className="text-sm text-muted-foreground mb-2">9.3. Өзгерістер күшіне енгеннен кейін ақылы қызметтерді пайдалануды жалғастыру Пайдаланушының осындай өзгерістермен келіскенін білдіреді.</p>
        </>
      );
    }

    // Default: Russian
    return (
      <>
        <h2 className="text-lg font-semibold mb-4">Условия оплаты для пользователей LinkMAX</h2>
        <p className="mb-4 text-sm text-muted-foreground">Версия: 1.0 | Дата вступления в силу: 05.01.2026</p>
        
        <h3 className="font-semibold mt-6 mb-2">1. Общие положения</h3>
        <p className="text-sm text-muted-foreground mb-2">1.1. Настоящие Условия оплаты (далее - «Условия оплаты») регулируют порядок оплаты услуг платформы LinkMAX (далее - «Платформа», «LinkMAX») физическими лицами и представителями юридических лиц.</p>
        <p className="text-sm text-muted-foreground mb-2">1.2. Условия оплаты являются неотъемлемой частью Пользовательского соглашения и применяются ко всем платным сервисам и тарифам LinkMAX.</p>
        <p className="text-sm text-muted-foreground mb-2">1.3. Осуществляя оплату услуг LinkMAX, Пользователь подтверждает, что ознакомился и согласен с Пользовательским соглашением, Политикой конфиденциальности и настоящими Условиями оплаты.</p>

        <h3 className="font-semibold mt-6 mb-2">2. Тарифы и стоимость услуг</h3>
        <p className="text-sm text-muted-foreground mb-2">2.1. Услуги LinkMAX предоставляются по модели подписки на тарифные планы (например, PRO, BUSINESS).</p>
        <p className="text-sm text-muted-foreground mb-2">2.2. Базовые тарифы для PRO подписки на момент публикации настоящих Условий оплаты:</p>
        <p className="text-sm text-muted-foreground mb-2">• 3 месяца - 4 350 ₸ в месяц (итого 13 050 ₸ за период);</p>
        <p className="text-sm text-muted-foreground mb-2">• 6 месяцев - 3 500 ₸ в месяц (итого 21 000 ₸ за период);</p>
        <p className="text-sm text-muted-foreground mb-2">• 12 месяцев - 3 045 ₸ в месяц (итого 36 540 ₸ за период).</p>
        <p className="text-sm text-muted-foreground mb-2">2.3. Все цены указываются в национальной валюте Республики Казахстан - тенге (KZT). При отображении эквивалента в иностранной валюте такое значение носит информационный характер.</p>
        <p className="text-sm text-muted-foreground mb-2">2.4. Актуальный перечень тарифов, их стоимость и включённые функции публикуются на странице тарифов Платформы и могут обновляться Администрацией в одностороннем порядке для новых периодов оплаты.</p>

        <h3 className="font-semibold mt-6 mb-2">3. Порядок оплаты</h3>
        <p className="text-sm text-muted-foreground mb-2">3.1. Оплата услуг осуществляется на условиях полной предоплаты за выбранный период подписки (3, 6 или 12 месяцев).</p>
        <p className="text-sm text-muted-foreground mb-2">3.2. Оплата производится через доступные платёжные сервисы и банковские карты, перечень которых указывается в интерфейсе оплаты (например, RoboKassa и другие партнёры).</p>
        <p className="text-sm text-muted-foreground mb-2">3.3. В случае успешной оплаты Пользователь получает электронное подтверждение (квитанцию/уведомление) и доступ к функционалу выбранного тарифа в течение 15 минут с момента подтверждения платежа платёжной системой.</p>
        <p className="text-sm text-muted-foreground mb-2">3.4. Моментом оказания услуги считается предоставление доступа к функционалу выбранного тарифного плана на Платформе.</p>

        <h3 className="font-semibold mt-6 mb-2">4. Период действия подписки и продление</h3>
        <p className="text-sm text-muted-foreground mb-2">4.1. Период подписки начинается с даты успешной оплаты и продолжается в течение выбранного срока (3, 6 или 12 месяцев).</p>
        <p className="text-sm text-muted-foreground mb-2">4.2. По окончании оплаченного периода доступ к платному функционалу может быть: автоматически продлён на аналогичный срок при наличии включённой функции автопродления; или прекращён, если Пользователь заранее не оформил новую оплату или отключил автопродление (в зависимости от модели, реализованной в продукте).</p>
        <p className="text-sm text-muted-foreground mb-2">4.3. Пользователь вправе в любой момент отключить автопродление подписки (если оно используется) через настройки аккаунта либо согласно инструкциям на странице оплаты.</p>

        <h3 className="font-semibold mt-6 mb-2">5. Налоги и дополнительные комиссии</h3>
        <p className="text-sm text-muted-foreground mb-2">5.1. Стоимость тарифов указывается с учётом применимых налогов, если иное явно не указано в описании тарифа или на странице оплаты.</p>
        <p className="text-sm text-muted-foreground mb-2">5.2. Банки и платёжные посредники могут взимать дополнительные комиссии за проведение транзакций и конвертацию валют, которые не контролируются Администрацией.</p>
        <p className="text-sm text-muted-foreground mb-2">5.3. В случае оплаты в валюте, отличной от тенге, конвертация осуществляется по курсу банка или платёжной системы Пользователя.</p>

        <h3 className="font-semibold mt-6 mb-2">6. Политика возвратов и отмены</h3>
        <p className="text-sm text-muted-foreground mb-2">6.1. Возврат денежных средств за цифровые услуги LinkMAX осуществляется в случаях и порядке, установленных действующим законодательством Республики Казахстан и описанных в Пользовательском соглашении и/или отдельном разделе «Политика возвратов».</p>
        <p className="text-sm text-muted-foreground mb-2">6.2. Общие принципы: возврат может быть возможен, если услуга не была использована либо существовала техническая невозможность её предоставления по вине Администрации; возврат, как правило, не предоставляется при активном использовании платного функционала и по истечении установленного периода (например, 14 календарных дней) с момента оплаты; при частичном использовании услуги может рассматриваться частичный возврат, рассчитанный пропорционально неиспользованному периоду подписки (если это предусмотрено политикой возвратов).</p>
        <p className="text-sm text-muted-foreground mb-2">6.3. Для запроса возврата Пользователь направляет обращение на электронный адрес Администрации с указанием Ф.И.О., email аккаунта, даты и суммы платежа, причины запроса возврата.</p>
        <p className="text-sm text-muted-foreground mb-2">6.4. Заявка на возврат рассматривается в установленные сроки, о результате Пользователь уведомляется по контактному адресу.</p>

        <h3 className="font-semibold mt-6 mb-2">7. Отказ от подписки</h3>
        <p className="text-sm text-muted-foreground mb-2">7.1. Пользователь вправе прекратить использование платного тарифа в любой момент, отключив автопродление или не оформляя новую оплату по окончании периода подписки.</p>
        <p className="text-sm text-muted-foreground mb-2">7.2. Отказ от подписки не означает автоматический возврат денежных средств за уже оплаченный период, за исключением случаев, прямо предусмотренных политикой возвратов и/или законом.</p>
        <p className="text-sm text-muted-foreground mb-2">7.3. После окончания оплаченного периода доступ к платным функциям прекращается, при этом аккаунт Пользователя может быть переведён на бесплатный тариф с ограниченным функционалом.</p>

        <h3 className="font-semibold mt-6 mb-2">8. Ответственность и ограничения</h3>
        <p className="text-sm text-muted-foreground mb-2">8.1. Пользователь несёт ответственность за корректность вводимых платёжных реквизитов и сохранность платёжных данных на стороне его банка/платёжного провайдера.</p>
        <p className="text-sm text-muted-foreground mb-2">8.2. Администрация не несёт ответственности за отказ банка или платёжной системы провести операцию, а также за задержки, связанные с их работой.</p>
        <p className="text-sm text-muted-foreground mb-2">8.3. В случае подозрения на мошенничество, нарушение закона или условий использования Платформы Администрация вправе приостановить предоставление услуг и обратиться к платёжному провайдеру для проверки операций.</p>

        <h3 className="font-semibold mt-6 mb-2">9. Изменение Условий оплаты</h3>
        <p className="text-sm text-muted-foreground mb-2">9.1. Администрация вправе изменять настоящие Условия оплаты, тарифы и перечень платных услуг.</p>
        <p className="text-sm text-muted-foreground mb-2">9.2. Обновлённая редакция Условий оплаты вступает в силу с момента публикации на Платформе, если иное не указано в тексте новой редакции.</p>
        <p className="text-sm text-muted-foreground mb-2">9.3. Продолжение использования платных услуг после вступления изменений в силу означает согласие Пользователя с такими изменениями.</p>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('legal.paymentTerms')}</DialogTitle>
          <DialogDescription>
            {t('legal.paymentTermsDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {getPaymentTermsContent()}
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

interface PaymentTermsLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function PaymentTermsLink({ children, className }: PaymentTermsLinkProps) {
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
      <PaymentTermsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
