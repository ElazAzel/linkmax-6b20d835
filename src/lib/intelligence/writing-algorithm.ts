/**
 * Smart-Writing Algorithm - Deterministic text suggestions based on business niches.
 * This replaces generic AI prompts with high-converting, niche-specific patterns.
 */

import { getNichePack } from './niche-packs';

export interface SuggestionPack {
    headings: string[];
    descriptions: string[];
    links: string[];
    buttons: string[];
}

const PATTERNS: Record<string, SuggestionPack> = {
    freelancer: {
        headings: [
            "Профессиональные услуги: {profession}",
            "Решаю задачи бизнеса качественно и в срок",
            "{profession} с фокусом на результат",
            "Помогаю вашему бизнесу расти через {profession}"
        ],
        descriptions: [
            "Специализируюсь на создании эффективных решений для малого и среднего бизнеса. Опыт более 5 лет.",
            "Превращаю ваши идеи в работающие продукты. Работаю удаленно по всему миру, нахожусь в г. {city}.",
            "Моя цель — ваш успех. Гарантирую индивидуальный подход и соблюдение дедлайнов в каждом проекте."
        ],
        links: ["Мое портфолио", "Отзывы клиентов", "Прайс-лист услуг", "Связаться в Telegram"],
        buttons: ["Заказать проект", "Обсудить задачу", "Узнать стоимость", "Смотреть работы"]
    },
    business: {
        headings: [
            "Ваш надежный партнер: {company_name}",
            "Премиальный сервис и качество в г. {city}",
            "Решения для тех, кто ценит время и результат",
            "{business_type}: Лидеры рынка в своей нише"
        ],
        descriptions: [
            "Мы создаем ценность для наших клиентов с 2018 года. Более 1000 успешных кейсов.",
            "Профессиональная команда, современное оборудование и высокие стандарты качества в {city}.",
            "Помогаем нашим клиентам достигать новых высот. Узнайте больше о наших услугах ниже."
        ],
        links: ["Наш сайт", "Каталог товаров", "О компании", "Наш офис в г. {city}"],
        buttons: ["Получить консультацию", "Оставить заявку", "Стать партнером", "Связаться с нами"]
    },
    beauty: {
        headings: [
            "Студия красоты: {beauty_name}",
            "Ваш идеальный образ в г. {city}",
            "Преображение, которое вы заслуживаете",
            "{beauty_type}: Профессиональный уход"
        ],
        descriptions: [
            "Подчеркиваем вашу естественную красоту. Используем только премиальную косметику.",
            "Мастера высшей категории и уютная атмосфера в самом центре {city}.",
            "Мы заботимся о каждой детали вашего образа. Записывайтесь онлайн прямо сейчас."
        ],
        links: ["Запись онлайн", "Наши работы", "Услуги и цены", "Мы в Instagram"],
        buttons: ["Записаться", "Выбрать время", "Узнать подробнее", "Хочу к мастеру"]
    },
    ecommerce: {
        headings: [
            "Магазин {store_name}",
            "Лучшие товары с доставкой из г. {city}",
            "Качество и стиль в каждой детали",
            "{product_category}: Новое поступление уже в продаже"
        ],
        descriptions: [
            "Быстрая доставка по всему Казахстану и гарантия качества на каждый товар.",
            "Находимся в г. {city}. У нас вы найдете все необходимое по лучшим ценам.",
            "Порадуйте себя и своих близких. Переходите в каталог и делайте заказ."
        ],
        links: ["Каталог товаров", "Условия доставки", "Акции и скидки", "Отследить заказ"],
        buttons: ["В корзину", "Купить сейчас", "Смотреть каталог", "Заказать доставку"]
    },
    realestate: {
        headings: [
            "Недвижимость в г. {city}",
            "Ваш дом мечты от {company_name}",
            "Аренда и продажа проверенных объектов",
            "Помогаем найти идеальное жилье в {city}"
        ],
        descriptions: [
            "Полное юридическое сопровождение сделок. Большая база объектов во всех районах.",
            "Экспертная оценка и подбор вариантов под ваш бюджет. Мы знаем все о рынке недвижимости.",
            "Мечтаете о новой квартире? Мы поможем сделать этот путь легким и безопасным."
        ],
        links: ["База квартир", "Ипотечный калькулятор", "Заявка на подбор", "Наши контакты"],
        buttons: ["Записаться на просмотр", "Получить подборку", "Оценить квартиру", "Связаться с агентом"]
    },
    creator: {
        headings: [
            "Создаю контент, который вдохновляет",
            "Добро пожаловать в мой творческий мир",
            "Делюсь опытом и знаниями каждый день",
            "Мой путь в {creation_type}: проекты и мысли"
        ],
        descriptions: [
            "Блогер и криэйтор из г. {city}. Здесь вы найдете эксклюзивный контент и анонсы новых проектов.",
            "Показываю жизнь без фильтров. Подписывайтесь на мои соцсети, чтобы быть в курсе событий.",
            "Сотрудничество и реклама: пишите в мессенджеры ниже. Открыт к новым интересным предложениям."
        ],
        links: ["Мой YouTube канал", "Telegram канал", "Поддержать проекты", "Сотрудничество"],
        buttons: ["Подписаться", "Смотреть видео", "Написать мне", "Поддержать"]
    },
    education: {
        headings: [
            "Обучение {subject} с нуля до профи",
            "Инвестируйте в свое будущее сегодня",
            "Авторский курс: {course_name}",
            "Помогаю освоить {subject} легко и быстро"
        ],
        descriptions: [
            "Пошаговая методика обучения, проверенная на сотнях студентов. Доступно и понятно каждому.",
            "Научу вас всему, что знаю сам. Забирайте бесплатный гайд или записывайтесь на консультацию.",
            "Образовательная платформа №1 в г. {city} по направлению {subject}. Начните учиться сейчас!"
        ],
        links: ["Программа обучения", "Бесплатный вебинар", "Отзывы учеников", "Личный кабинет"],
        buttons: ["Начать обучение", "Записаться на курс", "Забрать бонус", "Узнать программу"]
    },
    health: {
        headings: [
            "Ваше здоровье — мой главный приоритет",
            "Запишитесь на прием в г. {city}",
            "Профессиональный уход и забота о себе",
            "{specialization}: Красота и здоровье в гармонии"
        ],
        descriptions: [
            "Дипломированный специалист с многолетней практикой. Использую только проверенные методики.",
            "Помогу вам чувствовать себя лучше и увереннее. Запись на консультацию открыта через WhatsApp.",
            "Современная медицина и бережный подход. Ждем вас в нашей клинике в г. {city}."
        ],
        links: ["Запись на прием", "Стоимость услуг", "Наши врачи", "Советы по здоровью"],
        buttons: ["Записаться", "Получить консультацию", "Выбрать услугу", "Связаться с врачом"]
    },
    general: {
        headings: [
            "Добро пожаловать на мою страницу",
            "Узнайте больше о моих услугах",
            "Свяжитесь со мной удобным способом",
            "Профессионализм и открытость к общению"
        ],
        descriptions: [
            "Рад видеть вас здесь! Я занимаюсь любимым делом и делюсь результатами своей работы.",
            "На этой странице собраны все мои важные ссылки и контакты. Буду рад сотрудничеству.",
            "Нахожусь в г. {city}. Пишите по любым вопросам — отвечу максимально быстро."
        ],
        links: ["Мои контакты", "О себе", "Что я могу предложить", "Свежие новости"],
        buttons: ["Написать мне", "Узнать больше", "Перейти по ссылке", "Связаться"]
    }
};

export interface SuggestionContext {
    city?: string;
    profession?: string;
    company_name?: string;
    business_type?: string;
    creation_type?: string;
    subject?: string;
    course_name?: string;
    specialization?: string;
    // New niche contexts
    beauty_name?: string;
    beauty_type?: string;
    store_name?: string;
    product_category?: string;
}

/**
 * Personalize a template string by replacing placeholders with context values.
 */
function personalize(template: string, context: SuggestionContext): string {
    let result = template;
    const entries = Object.entries(context);
    
    entries.forEach(([key, value]) => {
        if (value) {
            const regex = new RegExp(`{${key}}`, 'g');
            result = result.replace(regex, value);
        }
    });

    // Clean up any remaining tags with defaults to avoid broken UI
    return result.replace(/{[a-z_]+}/g, (match) => {
        const key = match.slice(1, -1);
        const defaults: Record<string, string> = {
            city: "вашем городе",
            profession: "специалист",
            company_name: "наша компания",
            business_type: "наш бизнес",
            creation_type: "творческой сфере",
            subject: "новым навыкам",
            course_name: "обучающий курс",
            specialization: "ваш эксперт",
            beauty_name: "наша студия",
            beauty_type: "салон красоты",
            store_name: "наш магазин",
            product_category: "товаров"
        };
        return defaults[key] || "";
    });
}

/**
 * Main entry point for Smart-Writing suggestions.
 */
export function getWritingSuggestions(niche: string, context: SuggestionContext = {}): SuggestionPack {
    const pack = PATTERNS[niche] || PATTERNS.general;
    
    return {
        headings: pack.headings.map(h => personalize(h, context)),
        descriptions: pack.descriptions.map(d => personalize(d, context)),
        links: pack.links.map(l => personalize(l, context)),
        buttons: pack.buttons.map(b => personalize(b, context))
    };
}

/**
 * Get a random single suggestion for quick use (e.g. Magic Wand click).
 */
export function getRandomSuggestion(niche: string, type: 'heading' | 'description' | 'link' | 'button', context: SuggestionContext = {}): string {
    const pack = getWritingSuggestions(niche, context);
    let options: string[] = [];
    
    if (type === 'heading') options = pack.headings;
    else if (type === 'description') options = pack.descriptions;
    else if (type === 'link') options = pack.links;
    else if (type === 'button') options = pack.buttons;
    
    return options[Math.floor(Math.random() * options.length)];
}
