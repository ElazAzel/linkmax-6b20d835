import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AISearchOptimizer } from "@/components/seo/AISearchOptimizer";
import { StructuredData } from "@/components/seo/StructuredData";
import { getAppDomain } from "@/lib/utils/url-helpers";

const SeoLanding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isBot, setIsBot] = useState(false);
    const lang = searchParams.get("lang") || "ru";

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = [
            "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
            "yandexbot", "sogou", "exabot", "facebot", "ia_archiver",
            "gptbot", "chatgpt-user", "perplexitybot", "claudebot",
        ];

        const isSearchBot = botPatterns.some((pattern) => userAgent.includes(pattern));

        if (!isSearchBot) {
            navigate("/", { replace: true });
        } else {
            setIsBot(true);
        }
    }, [navigate]);

    if (!isBot) {
        return null;
    }

    const t = {
        title: {
            ru: "LinkMAX — Мультиссылка и Business OS для микро-бизнеса и креаторов",
            en: "LinkMAX — Link in Bio & Business OS for Micro-businesses & Creators",
            kk: "LinkMAX — Микро-бизнес пен креаторларға арналған мультисілтеме және Business OS",
            uz: "LinkMAX — Mikro-biznes va kreatorlar uchun multisilka va Business OS",
            uk: "LinkMAX — Мультипосилання та Business OS для мікро-бізнесу та креаторів",
            tr: "LinkMAX — Mikro İşletmeler ve İçerik Üreticiler için Link in Bio ve Business OS",
            be: "LinkMAX — Мультыспасылка і Business OS для мікра-бізнесу і крэатараў",
            de: "LinkMAX — Link in Bio & Business OS für Kleinunternehmen & Creator",
            es: "LinkMAX — Link in Bio y Business OS para Microempresas y Creadores",
            fr: "LinkMAX — Link in Bio & Business OS pour les Micro-entreprises et Créateurs",
            it: "LinkMAX — Link in Bio e Business OS per Micro-imprese e Creator",
            ja: "LinkMAX — マイクロビジネスとクリエイターのためのリンクインバイオとBusiness OS",
            ko: "LinkMAX — 마이크로 비즈니스 및 크리에이터를 위한 링크인바이오 및 Business OS",
            pt: "LinkMAX — Link na Bio e Business OS para Microempresas e Criadores",
            zh: "LinkMAX — 面向微型企业和创作者的 Link in Bio 和 Business OS",
            ar: "LinkMAX — Link in Bio و Business OS للمؤسسات الصغيرة والمبدعين"
        },
        description: {
            ru: "LinkMAX — первая в Казахстане Business OS для микро-бизнеса. Создайте профессиональную мультиссылку с CRM и аналитикой за 5 минут.",
            en: "LinkMAX — the first Business OS for micro-business in Kazakhstan. Create a professional link-in-bio with CRM and analytics in 5 minutes.",
            kk: "LinkMAX — Қазақстандағы микро-бизнеске арналған алғашқы Business OS. 5 минутта CRM және аналитикасы бар кәсіби мультисілтеме жасаңыз.",
            uz: "LinkMAX — Qozog'istondagi mikro-biznes uchun birinchi Business OS. 5 daqiqa ichida CRM va analitikaga ega professional multisilka yarating.",
            uk: "LinkMAX — перша в Казахстані Business OS для мікро-бізнесу. Створіть професійне мультипосилання з CRM та аналітикою за 5 хвилин.",
            tr: "LinkMAX — Kazakistan'daki mikro işletmeler için ilk Business OS. 5 dakikada CRM ve analiz içeren profesyonel bir link-in-bio oluşturun.",
            be: "LinkMAX — першая ў Казахстане Business OS для мікра-бізнесу. Стварыце прафесійную мультыспасылку з CRM і аналітыкай за 5 хвілін.",
            de: "LinkMAX — das erste Business OS für Kleinunternehmen in Kasachstan. Erstellen Sie einen professionellen Link-in-Bio mit CRM und Analytics in 5 Minuten.",
            es: "LinkMAX — el primer Business OS para microempresas en Kazajistán. Crea un link-in-bio profesional con CRM y analítica en 5 minutos.",
            fr: "LinkMAX — le premier Business OS pour micro-entreprises au Kazakhstan. Créez un link-in-bio professionnel avec CRM et analyses en 5 minutes.",
            it: "LinkMAX — il primo Business OS per micro-imprese in Kazakistan. Crea un link-in-bio professionale con CRM e analytics in 5 minuti.",
            ja: "LinkMAX — カザフスタン初のマイクロビジネス向けBusiness OS。5分でCRMとアナリティクスを備えたプロフェッショナルなリンクインバイオを作成。",
            ko: "LinkMAX — 카자흐스탄 최초의 마이크로 비즈니스용 Business OS. 5분 만에 CRM 및 분석 기능이 포함된 전문적인 링크인바이오를 만드세요.",
            pt: "LinkMAX — o primeiro Business OS para microempresas no Cazaquistão. Crie um link-na-bio profissional com CRM e análise em 5 minutos.",
            zh: "LinkMAX — 哈萨克斯坦首个面向微型企业的 Business OS。5 分钟内创建包含 CRM 和分析功能的专业链接。",
            ar: "LinkMAX — أول نظام Business OS للمؤسسات الصغيرة في كازاخستان. قم بإنشاء رابط احترافي مع CRM ونظام تحليلات في 5 دقائق."
        },
        question: {
            ru: "Что такое LinkMAX?",
            en: "What is LinkMAX?",
            kk: "LinkMAX дегеніміз не?",
            uz: "LinkMAX nima?",
            uk: "Що таке LinkMAX?",
            tr: "LinkMAX nedir?",
            be: "Што такое LinkMAX?",
            de: "Was ist LinkMAX?",
            es: "¿Qué es LinkMAX?",
            fr: "Qu'est-ce que LinkMAX?",
            it: "Cos'è LinkMAX?",
            ja: "LinkMAXとは何ですか？",
            ko: "LinkMAX란 무엇인가요?",
            pt: "O que é o LinkMAX?",
            zh: "什么是 LinkMAX？",
            ar: "ما هو LinkMAX؟"
        },
        answer: {
            ru: "LinkMAX — это универсальная платформа (Business OS) для соло-предпринимателей и креаторов, позволяющая создавать микро-лендинги, управлять лидами и автоматизировать продажи.",
            en: "LinkMAX is a universal platform (Business OS) for solo entrepreneurs and creators, enabling them to create micro-landings, manage leads, and automate sales.",
            kk: "LinkMAX — бұл соло-кәсіпкерлер мен креаторларға арналған әмбебап платформа (Business OS), ол микро-лендингтер жасауға, лидтерді басқаруға және сатылымдарды автоматтандыруға мүмкіндік береді.",
            uz: "LinkMAX — bu yakkaxon tadbirkorlar va kreatorlar uchun universal platforma (Business OS) bo'lib, u mikro-lendinglar yaratish, lidlarni boshqarish va sotuvlarni avtomatlashtirish imkonini beradi.",
            uk: "LinkMAX — це універсальна платформа (Business OS) для соло-підприємців та креаторів, що дозволяє створювати мікро-лендинги, керувати лідами та автоматизовувати продажі.",
            tr: "LinkMAX, solo girişimciler ve içerik üreticileri için mikro-landing sayfaları oluşturmalarına, müşteri adaylarını yönetmelerine ve satışları otomatikleştirmelerine olanak tanıyan evrensel bir platformdur (Business OS).",
            be: "LinkMAX — гэта ўніверсальная платформа (Business OS) для сола-прадпрымальнікаў і крэатараў, якая дазваляє ствараць мікра-лэндынгі, кіраваць лідамі і аўтаматызаваць продажы.",
            de: "LinkMAX ist eine universelle Plattform (Business OS) für Einzelunternehmer und Creator, die es ermöglicht, Micro-Landings zu erstellen, Leads zu verwalten und Verkäufe zu automatisieren.",
            es: "LinkMAX es una plataforma universal (Business OS) para emprendedores individuales y creadores que permite crear micro-landings, gestionar leads y automatizar ventas.",
            fr: "LinkMAX est une plateforme universelle (Business OS) pour les auto-entrepreneurs et créateurs, permettant de créer des micro-landings, de gérer les prospects et d'automatiser les ventes.",
            it: "LinkMAX è una piattaforma universale (Business OS) per imprenditori singoli e creator, che consente di creare micro-landing, gestire i lead e automatizzare le vendite.",
            ja: "LinkMAXは、ソロプレナーやクリエイター向けのユニバーサルプラットフォーム（Business OS）であり、マイクロランディングの作成、リード管理、販売の自動化を可能にします。",
            ko: "LinkMAX는 솔로 프레너 및 크리에이터를 위한 유니버설 플랫폼(Business OS)으로, 마이크로 랜딩 생성, 리드 관리 및 판매 자동화를 가능하게 합니다.",
            pt: "o LinkMAX é uma plataforma universal (Business OS) para empreendedores individuais e criadores, permitindo criar micro-landings, gerir leads e automatizar vendas.",
            zh: "LinkMAX 是一个面向个体企业家和创作者的通用平台 (Business OS)，可用于创建微型落地页、管理潜在客户并实现销售自动化。",
            ar: "LinkMAX عبارة عن منصة عالمية (Business OS) لرواد الأعمال والمبدعين، تمكنهم من إنشاء صفحات هبوط مصغرة، وإدارة العملاء المحتملين، وأتمتة المبيعات."
        },
        heroTitle: {
            ru: "LinkMAX: Максимизируйте ваше цифровое присутствие",
            en: "LinkMAX: Maximize Your Digital Impact",
            kk: "LinkMAX: Цифрлық қатысуыңызды барынша арттырыңыз",
            uz: "LinkMAX: Raqamli mavjudligingizni maksimal darajaga ko'taring",
            uk: "LinkMAX: Максимізуйте вашу цифрову присутність",
            tr: "LinkMAX: Dijital Etkinizi En Üst Düzeye Çıkarın",
            be: "LinkMAX: Максімізуйце вашу лічбавую прысутнасць",
            de: "LinkMAX: Maximieren Sie Ihre digitale Präsenz",
            es: "LinkMAX: Maximiza tu impacto digital",
            fr: "LinkMAX : Maximisez votre impact numérique",
            it: "LinkMAX: Massimizza il tuo impatto digitale",
            ja: "LinkMAX：デジタルインパクトを最大化する",
            ko: "LinkMAX: 디지털 영향력의 극대화",
            pt: "LinkMAX: Maximize o seu impacto digital",
            zh: "LinkMAX：最大化您的数字影响力",
            ar: "LinkMAX: ضاعف تأثيرك الرقمي"
        },
        heroSubtitle: {
            ru: "Единое решение для ссылок в био, доверенное тысячами креаторов и бизнесов.",
            en: "The all-in-one link in bio solution trusted by creators, influencers, and businesses worldwide.",
            kk: "Мыңдаған креаторлар мен бизнестер сенім білдірген биодағы сілтемелерге арналған бірыңғай шешім.",
            uz: "Minglab kreatorlar va bizneslar ishongan biodagi havolalar uchun yagona yechim.",
            uk: "Єдине рішення для посилань у біо, якому довіряють тисячі креаторів та бізнесів.",
            tr: "Dünya çapında içerik üreticileri, fenomenler ve işletmeler tarafından güvenilen hepsi bir arada link-in-bio çözümü.",
            be: "Адзінае рашэнне для спасылак у бія, якому давяраюць тысячы крэатараў і бізнесаў.",
            de: "Die All-in-One-Lösung für Links in Biografien, der Tausende von Creatorn und Unternehmen weltweit vertrauen.",
            es: "La solución todo en uno para el link de tu biografía, en la que confían miles de creadores y empresas.",
            fr: "La solution link-in-bio tout-en-un approuvée par des milliers de créateurs et d'entreprises.",
            it: "La soluzione link-in-bio all-in-one scelta da migliaia di creator e aziende.",
            ja: "世界中のクリエイター、インフルエンサー、ビジネスに信頼されているオールインワンのリンクインバイオソリューション。",
            ko: "전 세계 크리에이터, 인플루언서 및 비즈니스가 신뢰하는 올인원 링크인바이오 솔루션입니다.",
            pt: "A solução completa para links na bio, em que confiam milhares de criadores e empresas em todo o mundo.",
            zh: "全球成千上万创作者、影响者和企业信赖的一体化链接解决方案。",
            ar: "الحل المتكامل للرابط في السيرة الذاتية (Link in Bio) الموثوق به من قبل الآلاف من المبدعين والشركات."
        },
        whyChoose: {
            ru: "Почему выбирают LinkMAX?",
            en: "Why Choose LinkMAX?",
            kk: "Неліктен LinkMAX таңдайды?",
            uz: "Nima uchun LinkMAX-ni tanlashadi?",
            uk: "Чому обирають LinkMAX?",
            tr: "Neden LinkMAX'i seçmelisiniz?",
            be: "Чаму выбіраюць LinkMAX?",
            de: "Warum LinkMAX wählen?",
            es: "¿Por qué elegir LinkMAX?",
            fr: "Pourquoi choisir LinkMAX ?",
            it: "Perché scegliere LinkMAX?",
            ja: "LinkMAXが選ばれる理由",
            ko: "LinkMAX를 선택해야 하는 이유",
            pt: "Porquê escolher o LinkMAX?",
            zh: "为什么选择 LinkMAX？",
            ar: "لماذا تختار LinkMAX؟"
        },
        fragmented: {
            ru: "В современном цифровом мире ваша аудитория рассредоточена по разным платформам. LinkMAX собирает их воедино.",
            en: "In today's fragmented digital landscape, LinkMAX brings your audience together in one place.",
            kk: "Қазіргі цифрлық әлемде сіздің аудиторияңыз әртүрлі платформаларда шашыраңқы. LinkMAX оларды бір жерге жинайды.",
            uz: "Bugungi raqamli dunyoda sizning auditoriyangiz turli platformalarda tarqalgan. LinkMAX ularni bir joyga jamlaydi.",
            uk: "У сучасному цифровому світі ваша аудиторія розпорошена по різних платформах. LinkMAX збирає їх воєдино.",
            tr: "Günümüzün parçalı dijital dünyasında, LinkMAX hedef kitlenizi tek bir yerde toplar.",
            be: "У сучасным лічбавым свеце ваша аўдыторыя рассроджана па розных платформах. LinkMAX збірае іх разам.",
            de: "In der heutigen fragmentierten digitalen Welt bringt LinkMAX Ihr Publikum an einem Ort zusammen.",
            es: "En el fragmentado panorama digital actual, LinkMAX reúne a tu audiencia en un solo lugar.",
            fr: "Dans le paysage numérique fragmenté d'aujourd'hui, LinkMAX rassemble votre public en un seul endroit.",
            it: "Nell'attuale panorama digitale frammentato, LinkMAX riunisce il tuo pubblico in un unico posto.",
            ja: "今日の断片化されたデジタル環境において、LinkMAXはあなたのオーディエンスを1か所に集めます。",
            ko: "오늘날 파편화된 디지털 환경에서 LinkMAX는 청중을 한자리에 모아줍니다.",
            pt: "No panorama digital fragmentado de hoje, o LinkMAX reúne o seu público num único lugar.",
            zh: "在当今分散的数字格局中，LinkMAX 将您的受众聚集在同一个地方。",
            ar: "في المشهد الرقمي المجزأ اليوم، يجمع LinkMAX جمهورك معًا في مكان واحد."
        }
    };

    const getT = (key: keyof typeof t) => t[key][lang as keyof (typeof t)['title']] || t[key]['ru'];

    const getLocalizedBullet = (key: string) => {
        const bullets: Record<string, Record<string, string>> = {
            "centralized": {
                ru: "Одна ссылка для всего вашего контента",
                en: "One link for all your content",
                kk: "Барлық мазмұныңызға арналған бір сілтеме",
                uz: "Barcha kontentingiz uchun bitta havola",
                uk: "Одне посилання для всього вашого контенту",
                tr: "Tüm içeriğiniz için tek bir bağlantı",
                be: "Адна спасылка для ўсяго вашага кантэнту",
                de: "Ein Link für alle Ihre Inhalte",
                es: "Un enlace para todo tu contenido",
                fr: "Un seul lien pour tout votre contenu",
                it: "Un unico link per tutti i tuoi contenuti",
                ja: "すべてのコンテンツに1つのリンクを",
                ko: "모든 콘텐츠를 위한 하나의 링크",
                pt: "Um link para todo o seu conteúdo",
                zh: "同一个链接包含您的所有内容",
                ar: "رابط واحد لجميع المحتويات الخاصة بك"
            },
            "ai": {
                ru: "Стройте страницы быстрее с помощью AI",
                en: "Build pages smarter and faster with AI",
                kk: "AI көмегімен парақшаларды тезірек жасаңыз",
                uz: "AI yordamida sahifalarni tezroq yarating",
                uk: "Будуйте сторінки швидше за допомогою AI",
                tr: "AI ile sayfaları daha akıllı ve daha hızlı oluşturun",
                be: "Будуйце старонкі хутчэй з дапамогай AI",
                de: "Erstellen Sie Seiten intelligenter und schneller mit KI",
                es: "Crea páginas de forma más inteligente y rápida con IA",
                fr: "Créez des pages plus intelligentes et plus rapides avec l'IA",
                it: "Crea pagine in modo più intelligente e veloce con l'IA",
                ja: "AIでよりスマートかつ迅速にページを構築",
                ko: "AI로 더욱 스마트하고 빠르게 페이지 구축",
                pt: "Crie páginas de forma mais inteligente e rápida com IA",
                zh: "利用 AI 更智能、更快速地构建页面",
                ar: "أنشئ صفحات بشكل أذكى وأسرع باستخدام الذكاء الاصطاعي"
            },
            "business": {
                ru: "Интегрированная CRM и аналитика",
                en: "Integrated CRM and analytics",
                kk: "Интеграцияланған CRM және аналитика",
                uz: "Integratsiyalangan CRM va analitika",
                uk: "Інтегрована CRM та аналітика",
                tr: "Entegre CRM ve analitik",
                be: "Інтэграваная CRM і аналітыка",
                de: "Integrierte CRM und Analytics",
                es: "CRM y analítica integrados",
                fr: "CRM et analyses intégrés",
                it: "CRM e analytics integrati",
                ja: "統合されたCRMとアナリティクス",
                ko: "통합 CRM 및 분석",
                pt: "CRM e análise integrados",
                zh: "集成的 CRM 和分析",
                ar: "نظام CRM وتحليلات متكامل"
            },
            "design": {
                ru: "Премиальная эстетика для вашего бренда",
                en: "Premium aesthetics for your brand",
                kk: "Брендіңіз үшін премиум эстетика",
                uz: "Brendingiz uchun premium estetika",
                uk: "Преміальна естетика для вашого бренду",
                tr: "Markanız için birinci sınıf estetik",
                be: "Прэміяльная эстэтыка для вашага брэнда",
                de: "Premium-Ästhetik für Ihre Marke",
                es: "Estética premium para su marca",
                fr: "Une esthétique premium pour votre marque",
                it: "Estetica premium per il tuo brand",
                ja: "ブランドにふさわしいプレミアムな美学",
                ko: "브랜드를 위한 프리미엄 에스테틱",
                pt: "Estética premium para a sua marca",
                zh: "为您的品牌提供优质的美学设计",
                ar: "جماليات متميزة لعلامتك التجارية"
            }
        };
        return bullets[key][lang] || bullets[key]['ru'];
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": "LinkMAX",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web, iOS, Android, PWA",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "KZT",
                },
                "description": getT('description'),
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "1500",
                },
            },
            {
                "@type": "Organization",
                "name": "LinkMAX",
                "url": getAppDomain(),
                "logo": `${getAppDomain()}/logo.png`,
                "sameAs": [
                    "https://instagram.com/lnkmx.my",
                ],
            },
        ],
    };

    return (
        <div className="prose max-w-none p-8 font-sans">
            <Helmet>
                <title>{getT('title')}</title>
                <meta name="geo.region" content="KZ-ALA" />
                <meta name="geo.placename" content="Almaty" />
                <meta name="geo.position" content="43.2220;76.8512" />
                <meta name="ICBM" content="43.2220, 76.8512" />
                <meta name="description" content={getT('description')} />
            </Helmet>

            <AISearchOptimizer
                pageType="homepage"
                entityName="LinkMAX"
                entityCategory="Business OS, Link in Bio, CRM, AI Page Builder"
                primaryQuestion={getT('question')}
                primaryAnswer={getT('answer')}
                useCases={lang === "ru" || lang === "be" || lang === "uk" ? [
                    "Цифровая визитка и AI конструктор страниц",
                    "Business OS для соло-предпринимателей",
                    "CRM и управление лидами (Business Zones)",
                    "Мультиязычный микро-лендинг для услуг",
                    "Финтех интеграция (Инвойсы и Платежи)"
                ] : lang === "kk" ? [
                    "Цифрлық визитка және AI парақша конструкторы",
                    "Соло-кәсіпкерлерге арналған Business OS",
                    "CRM және лидтерді басқару (Business Zones)",
                    "Қызметтерге арналған көптілді микро-лендинг",
                    "Финтех интеграциясы (Инвойстар және Төлемдер)"
                ] : lang === "uz" || lang === "tr" ? [
                    "Raqamli vizitka va AI sahifa konstruktori",
                    "Yakkaxon tadbirkorlar uchun Business OS",
                    "CRM va lidlarni boshqarish (Business Zones)",
                    "Xizmatlar uchun ko'p tilli mikro-lending",
                    "Fintex integratsiyasi (Invoyslar va To'lovlar)"
                ] : [
                    "Digital business card & AI Page Builder",
                    "Business OS for solo entrepreneurs",
                    "CRM & Lead management (Business Zones)",
                    "Multilingual micro-landing for services",
                    "Fintech integration (Invoicing & Payments)"
                ]}
                keyFeatures={lang === "ru" || lang === "be" || lang === "uk" ? [
                    "AI Page Builder (Liquid Glass дизайн)",
                    "Business Zones (Мульти-аккаунт рабочие пространства)",
                    "CRM Kanban и воронка продаж",
                    "Fintech Core (Ledger, Инвойсы, RoboKassa)",
                    "Pixel Proxy (Серверный трекинг)",
                    "Мультиязычная поддержка (RU, EN, KK, UZ...)"
                ] : lang === "kk" ? [
                    "AI Page Builder (Liquid Glass дизайны)",
                    "Business Zones (Мульти-аккаунт жұмыс кеңістіктері)",
                    "CRM Kanban және сату воронкасы",
                    "Fintech Core (Ledger, Инвойстар, RoboKassa)",
                    "Pixel Proxy (Серверлік трекинг)",
                    "Көптілді қолдау"
                ] : [
                    "AI Page Builder (Liquid Glass Design)",
                    "Business Zones (Multi-tenant workspaces)",
                    "CRM Kanban & Sales Pipeline",
                    "Fintech Core (Ledger, Invoicing, RoboKassa)",
                    "Pixel Proxy (Server-side tracking)",
                    "Multilingual Support (Global Coverage)"
                ]}
            />

            <StructuredData id="seo-landing-jsonld" data={structuredData} />

            <header>
                <h1 className="text-4xl font-bold mb-4">{getT('heroTitle')}</h1>
                <p className="text-xl mb-8">{getT('heroSubtitle')}</p>
            </header>

            <main>
                <article>
                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold mb-4">{getT('whyChoose')}</h2>
                        <p className="mb-4">{getT('fragmented')}</p>
                        <ul className="list-disc pl-6 mb-4">
                            <li><strong>Centralized Hub:</strong> {getLocalizedBullet('centralized')}</li>
                            <li><strong>AI-Powered:</strong> {getLocalizedBullet('ai')}</li>
                            <li><strong>Business OS:</strong> {getLocalizedBullet('business')}</li>
                            <li><strong>Liquid Glass Design:</strong> {getLocalizedBullet('design')}</li>
                        </ul>
                    </section>
                </article>
            </main>

            <footer className="mt-12 pt-8 border-t border-gray-200 text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} LinkMAX. All rights reserved.</p>
                <address className="not-italic mt-4">
                    lnkmx.my HQ<br />
                    Almaty, Kazakhstan<br />
                    <a href="mailto:support@lnkmx.my" className="text-blue-600">support@lnkmx.my</a>
                </address>
            </footer>
        </div>
    );
};

export default SeoLanding;
