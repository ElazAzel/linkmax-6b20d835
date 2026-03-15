/**
 * Smart-Writing Algorithm - Deterministic text suggestions based on business niches.
 * This replaces generic AI prompts with high-converting, niche-specific patterns.
 */

import { getNichePack } from './niche-packs';

export interface SuggestionPack {
    headings: string[];
    descriptions: string[];
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
            specialization: "ваш эксперт"
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
        descriptions: pack.descriptions.map(d => personalize(d, context))
    };
}

/**
 * Get a random single suggestion for quick use (e.g. Magic Wand click).
 */
export function getRandomSuggestion(niche: string, type: 'heading' | 'description', context: SuggestionContext = {}): string {
    const pack = getWritingSuggestions(niche, context);
    const options = type === 'heading' ? pack.headings : pack.descriptions;
    return options[Math.floor(Math.random() * options.length)];
}
