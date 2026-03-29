import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const freemiumBlock = {
  ar: {
    "blockLimitReached": "تكفي 5 مكعبات للبدء 🚀",
    "blockLimitDesc": "قم بالترقية إلى PRO لإضافة نماذج الطلبات والمنتجات وإنشاء صفحة هبوط كاملة بدون حدود.",
    "blocksRemaining": "المكعبات المتبقية: {{count}} من {{max}}",
    "aiLimitReached": "استنفدت المحاولة الأولية المجانية",
    "aiLimitDesc": "مع PRO، يقوم الذكاء الاصطناعي بكتابة عناوين وأوصاف مذهلة لزيادة نقراتك.",
    "aiGenerationsRemaining": "التوليدات المتبقية بالذكاء الاصطناعي: {{count}}",
    "moreAIGenerations": "10 توليدات شهرياً مع PRO",
    "watermarkEnabled": "إزالة شعار LinkMAX",
    "watermarkDesc": "اجعل الصفحة تظهر بعلامتك التجارية الكاملة، وارفع مكانتك وثقة عملائك عبر PRO.",
    "removeWatermark": "إزالة الشعار",
    "upgradePro": "تفعيل PRO",
    "gate": {
      "forms": "النماذج = طلبات أكثر. سيرسلها PRO إلى CRM + Telegram.",
      "crm": "حالات الرد السريع، حتى لا تفقد العملاء أبداً.",
      "analytics": "اعرف ما يجلب العملاء وليس المشاهدات فقط.",
      "booking": "الحجز المباشر بدل المحادثات. العميل يختار الموعد.",
      "design": "اجعل صفحتك مميزة. يعطي PRO ثيمات وخلفيات متميزة.",
      "ai": "المزيد من الذكاء الاصطناعي = نصوص تسويقية رائعة.",
      "export": "نزّل قائمة عملائك وأدر عملك.",
      "domain": "نطاقك الخاص = ثقة أكبر. اظهر كعلامة تجارية.",
      "generic": "هذه الميزة تجلب نقرات وطلبات أكثر مع PRO."
    }
  },
  ru: {
    "blockLimitReached": "Базовых 5 блоков достаточно для старта 🚀",
    "blockLimitDesc": "Включи PRO, чтобы добавить форму заявок, товары и собрать полноценный лендинг без ограничений.",
    "blocksRemaining": "Осталось блоков: {{count}} из {{max}}",
    "aiLimitReached": "Стартовая генерация исчерпана",
    "aiLimitDesc": "С PRO-тарифом наш AI генерирует десятки продающих заголовков и описаний, чтобы увеличить клики.",
    "aiGenerationsRemaining": "Осталось AI генераций: {{count}}",
    "moreAIGenerations": "10 генераций в месяц с PRO",
    "watermarkEnabled": "Убери логотип LinkMAX",
    "watermarkDesc": "Сделай страницу 100% своей — выгляди статуснее и повышай доверие клиентов с PRO.",
    "removeWatermark": "Убрать логотип",
    "upgradePro": "Включить PRO",
    "gate": {
      "forms": "Форма = заявки. Pro отправит их в CRM + Telegram.",
      "crm": "Статусы и быстрые ответы, чтобы не терять клиентов.",
      "analytics": "Узнай, что приносит клиентов, а не просто просмотры.",
      "booking": "Запись вместо переписок. Клиент сам выбирает слот.",
      "design": "Сделай страницу 'своей'. Pro даёт премиум темы и фоны.",
      "ai": "Больше AI = больше классных креативов для старта.",
      "export": "Скачивай список клиентов и управляй бизнесом.",
      "domain": "Свой домен = доверие. Выгляди как бренд.",
      "generic": "Эта функция приносит больше кликов и заявок в PRO."
    }
  },
  en: {
    "blockLimitReached": "5 blocks is enough to start 🚀",
    "blockLimitDesc": "Go PRO to add lead forms, products, and build a full landing page with no limits.",
    "blocksRemaining": "Blocks remaining: {{count}} out of {{max}}",
    "aiLimitReached": "Free AI generation used up",
    "aiLimitDesc": "With PRO, our AI generates dozens of converting headlines and descriptions to boost your clicks.",
    "aiGenerationsRemaining": "AI generations remaining: {{count}}",
    "moreAIGenerations": "10 generations/mo with PRO",
    "watermarkEnabled": "Remove LinkMAX logo",
    "watermarkDesc": "Make the page 100% yours. Build trust and look premium with PRO.",
    "removeWatermark": "Remove Logo",
    "upgradePro": "Go PRO",
    "gate": {
      "forms": "Forms = leads. PRO sends them to CRM + Telegram.",
      "crm": "Statuses & quick replies to never lose a client.",
      "analytics": "Know what brings clients, not just views.",
      "booking": "Bookings over DMs. Clients pick their own slot.",
      "design": "Make it yours. PRO unlocks premium themes & backgrounds.",
      "ai": "More AI = more great copy to start selling.",
      "export": "Download your client list and manage your business.",
      "domain": "Custom domain = trust. Look like a true brand.",
      "generic": "This feature brings more clicks and leads with PRO."
    }
  },
  kk: {
    "blockLimitReached": "Бастау үшін 5 блок жеткілікті 🚀",
    "blockLimitDesc": "Өтінім формасын, тауарларды қосу және шектеусіз толық лендинг жасау үшін PRO қосыңыз.",
    "blocksRemaining": "Қалған блоктар: {{max}} ішінен {{count}}",
    "aiLimitReached": "Алғашқы AI генерациясы таусылды",
    "aiLimitDesc": "PRO тарифімен AI кликтерді көбейту үшін ондаған сататын тақырыптар жазады.",
    "aiGenerationsRemaining": "Қалған AI генерациялары: {{count}}",
    "moreAIGenerations": "PRO-мен айына 10 генерация",
    "watermarkEnabled": "LinkMAX логотипін алып тастау",
    "watermarkDesc": "Бетті 100% өзіңіздікі етіңіз — PRO көмегімен клиенттер сенімін арттырыңыз.",
    "removeWatermark": "Логотипті өшіру",
    "upgradePro": "PRO қосу",
    "gate": {
      "forms": "Форма = өтінімдер. PRO оларды CRM + Telegram-ға жібереді.",
      "crm": "Клиенттерді жоғалтпау үшін статустар мен жылдам жауаптар.",
      "analytics": "Жай қаралым емес, клиент кім әкелетінін біліңіз.",
      "booking": "Жазысқанша тікелей жазылу. Клиент өз уақытын таңдайды.",
      "design": "Бетті \"өзіңдікі\" қыл. PRO премиум тақырыптарды ашады.",
      "ai": "Көбірек AI = бастау үшін көбірек креатив.",
      "export": "Клиенттер тізімін жүктеп алып, бизнесті басқарыңыз.",
      "domain": "Өз доменіңіз = сенім. Бренд ретінде көрініңіз.",
      "generic": "Бұл функция PRO тарифінде көбірек клик пен өтінім әкеледі."
    }
  }
};

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const lang = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // inject freemium namespace if we have exact translations, else fallback to EN
    const tr = freemiumBlock[lang] || freemiumBlock['en'];
    json.freemium = tr;

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Injected freemium into ${file} using fallback: ${freemiumBlock[lang] ? 'native' : 'EN'}`);
  }
  console.log('Done! All locales have the freemium translation namespace.');
}

main().catch(console.error);
