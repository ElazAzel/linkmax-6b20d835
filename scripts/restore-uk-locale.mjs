#!/usr/bin/env node
/**
 * restore-uk-locale.mjs
 * 
 * Restores uk.json by:
 * 1. Ensuring structural parity with en.json (same keys)
 * 2. Detecting Russian strings (Cyrillic chars specific to Russian: ы, э, ъ, ё)
 * 3. Detecting untranslated English strings
 * 4. Applying a comprehensive translation dictionary
 * 5. Generating a report of changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const enPath = path.join(LOCALES_DIR, 'en.json');
const ukPath = path.join(LOCALES_DIR, 'uk.json');
const ruPath = path.join(LOCALES_DIR, 'ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const uk = JSON.parse(fs.readFileSync(ukPath, 'utf-8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));

// Stats
let fixedRussian = 0;
let fixedEnglish = 0;
let fixedSurzhik = 0;
let addedMissing = 0;
let totalKeys = 0;

// ======= Detection Helpers =======

// Russian-only letters not present in Ukrainian
const RUSSIAN_ONLY_CHARS = /[ыэъёЫЭЪЁ]/;
// Contains Cyrillic
const HAS_CYRILLIC = /[а-яА-ЯіїєґІЇЄҐёЁыэъЫЭЪ]/;
// Mostly ASCII (English text)
const IS_MOSTLY_ENGLISH = /^[a-zA-Z0-9\s.,!?;:'"()\-—–→@#$%&*\/\\{}[\]<>+=|~`…•°±²³µ¶¹º¼½¾×÷€£¥©®™¡¿]+$/;

function hasRussianChars(str) {
  return RUSSIAN_ONLY_CHARS.test(str);
}

function isEnglish(str) {
  // Skip interpolation patterns and short strings
  if (str.length < 3) return false;
  if (/^\{\{.*\}\}$/.test(str)) return false;
  if (/^[A-Z]{2,5}$/.test(str)) return false; // abbreviations like "CTR", "FAQ"
  if (/^https?:\/\//.test(str)) return false; // URLs
  return IS_MOSTLY_ENGLISH.test(str.replace(/\{\{[^}]+\}\}/g, ''));
}

// Common Russian → Ukrainian word replacements for surzhik fix
const SURZHIK_FIXES = [
  // Nouns / Common words
  [/\bНі\b/g, 'Немає'],
  [/\bпока\b/g, 'поки'],
  [/\bкатегории\b/g, 'категорії'],
  [/\bдостижений\b/g, 'досягнень'],
  [/\bдостижение\b/g, 'досягнення'],
  [/\bНовое\b/g, 'Нове'],
  [/\bЭпическое\b/g, 'Епічне'],
  [/\bЛегендарное\b/g, 'Легендарне'],
  [/\bРедкое\b/g, 'Рідкісне'],
  [/\bНаграда\b/g, 'Нагорода'],
  [/\bза достижение\b/g, 'за досягнення'],
  [/\bИспользуйте\b/g, 'Використовуйте'],
  [/\bНастройте\b/g, 'Налаштуйте'],
  [/\bСоздайте\b/g, 'Створіть'],
  [/\bПолучите\b/g, 'Отримайте'],
  [/\bОпубликуйте\b/g, 'Опублікуйте'],
  [/\bОпубликовано\b/g, 'Опубліковано'],
  [/\bСоциальная\b/g, 'Соціальна'],
  [/\bсоциальная\b/g, 'соціальна'],
  [/\bбабочка\b/g, 'метелик'],
  [/\bпервую\b/g, 'першу'],
  [/\bпервого\b/g, 'першого'],
  [/\bпервую\b/g, 'першу'],
  [/\bпосилання\b/g, 'посилання'],  // correct already  
  [/\bПервая\b/g, 'Перше'],
  [/\bперший\b/g, 'перший'], // correct
  [/\bКоллекционер\b/g, 'Колекціонер'],
  [/\bКоммуникатор\b/g, 'Комунікатор'],
  [/\bЛидер\b/g, 'Лідер'],
  [/\bлидер\b/g, 'лідер'],
  [/\bПерфекционист\b/g, 'Перфекціоніст'],
  [/\bСоздатель\b/g, 'Творець'],
  [/\bРазработчик\b/g, 'Розробник'],
  [/\bМайстер-строитель\b/g, 'Майстер-будівельник'],
  [/\bТорговец\b/g, 'Торговець'],
  [/\bИнфлюенсер\b/g, 'Інфлюенсер'],
  [/\bИздатель\b/g, 'Видавець'],
  [/\bГуру поиска\b/g, 'Гуру пошуку'],
  [/\bобратной связи\b/g, "зворотного зв'язку"],
  [/\bизображений\b/g, 'зображень'],
  [/\bпереглядів\b/g, 'переглядів'], // correct
  [/\bАI-помощник\b/g, 'AI-помічник'],
  [/\bЭксперт чат-ботов\b/g, 'Експерт чат-ботів'],
  [/\bвидео блок\b/g, 'відеоблок'],
  [/\bкарусель\b/g, 'карусель'], // same
  [/\bтовар\b/g, 'товар'], // same
  [/\bсоціальних мереж\b/g, 'соціальних мереж'], // correct
  [/\bВсего\b/g, 'Усього'],
  [/\bвсего\b/g, 'усього'],
  [/\bРаспределение\b/g, 'Розподіл'],
  [/\bраспределение\b/g, 'розподіл'],
  [/\bРост\b/g, 'Зростання'],
  [/\bрост\b/g, 'зростання'],
  [/\bСоздание\b/g, 'Створення'],
  [/\bсоздание\b/g, 'створення'],
  [/\bКоличество\b/g, 'Кількість'],
  [/\bколичество\b/g, 'кількість'],
  [/\bТипи подій\b/g, 'Типи подій'], // correct
  [/\bПопулярні\b/g, 'Популярні'], // correct
  [/\bсоциальн\b/g, 'соціальн'],
  [/\bактивность\b/g, 'активність'],
  [/\bДетальная\b/g, 'Детальна'],
  [/\bодобрить\b/g, 'схвалити'],
  [/\bОдобрить\b/g, 'Схвалити'],
  [/\bотклонить\b/g, 'відхилити'],
  [/\bОтклонить\b/g, 'Відхилити'],
  [/\bкомиссия\b/g, 'комісія'],
  [/\bКомиссия\b/g, 'Комісія'],
  [/\bОжидает\b/g, 'Очікує'],
  [/\bожидает\b/g, 'очікує'],
  [/\bДействия\b/g, 'Дії'],
  [/\bдействия\b/g, 'дії'],
  [/\bКомментарий\b/g, 'Коментар'],
  [/\bкомментарий\b/g, 'коментар'],
  [/\bадминистратора\b/g, 'адміністратора'],
  [/\bобязателен\b/g, "обов'язковий"],
  [/\bотклонении\b/g, 'відхиленні'],
  [/\bодобрении\b/g, 'схваленні'],
  [/\bЮридическое лицо\b/g, 'Юридична особа'],
  [/\bЮр\. лицо\b/g, 'Юр. особа'],
  [/\bФизическое лицо\b/g, 'Фізична особа'],
  [/\bФиз\. лицо\b/g, 'Фіз. особа'],
  [/\bУдостоверение\b/g, 'Посвідчення'],
  [/\bБез имени\b/g, 'Без імені'],
  [/\bзаявок\b/g, 'заявок'], // same
  [/\bверификацію\b/g, 'верифікацію'],
  [/\bПримечание\b/g, 'Примітка'],
  [/\bпользователя\b/g, 'користувача'],
  [/\bИстекает\b/g, 'Закінчується'],
  [/\bПожизненно\b/g, 'Довічно'],
  [/\bобновления\b/g, 'оновлення'],
  [/\bтарифа\b/g, 'тарифу'],
  [/\bсброшен\b/g, 'скинуто'],
  [/\bКэш\b/g, 'Кеш'],
  [/\bзагрузки\b/g, 'завантаження'],
  [/\bПоделились\b/g, 'Поділилися'],
  [/\bпродолжить\b/g, 'продовжити'],
  [/\bЭкономика\b/g, 'Економіка'],
  [/\bРаспределение по типам транзакций\b/g, 'Розподіл за типами транзакцій'],
  [/\bИсторія\b/g, 'Історія'],
  [/\bВ обращении\b/g, 'В обігу'],
  [/\bУкажите причину\b/g, 'Вкажіть причину'],
  [/\bрешению\b/g, 'рішення'],
  [/\bпокупки\b/g, 'покупки'], // same in uk
  [/\bтоваров\b/g, 'товарів'],
  [/\bшаблонов\b/g, 'шаблонів'],
  [/\bЗаработано\b/g, 'Зароблено'],
  [/\bПотрачено\b/g, 'Витрачено'],
  [/\bзаявки\b/g, 'заявки'], // same
  [/\bвисновок\b/g, 'виведення'],
  [/\bсредств\b/g, 'коштів'],
  [/\bВнутреннее\b/g, 'Внутрішнє'],
  [/\bвнутреннее\b/g, 'внутрішнє'],
  [/\bкерування\b/g, 'керування'], // correct
  [/\bпереводами\b/g, 'перекладами'],
  [/\bСправка про реєстрації\b/g, 'Довідка про реєстрацію'],
  [/\bсторінку\b/g, 'сторінку'], // correct
  [/\bбесплатно\b/g, 'безкоштовно'],
  [/\bЗависит\b/g, 'Залежить'],
  [/\bзависит\b/g, 'залежить'],
  [/\bСоциальное\b/g, 'Соціальне'],
  [/\bСерией\b/g, 'Серією'],
  [/\bобновлено\b/g, 'оновлено'],
  [/\bпроктов\b/g, 'проєктів'],
  [/\bперегляд$/g, 'перегляд'], // correct
  [/\bожидает\b/g, 'очікує'],
  [/\bпринято\b/g, 'прийнято'],
  // Verbs
  [/\bможет не подойти\b/g, 'може не підійти'],
  [/\bрешаете\b/g, 'вирішуєте'],
  [/\bфиксировать\b/g, 'фіксувати'],
  [/\bпринимать\b/g, 'приймати'],
  [/\bвидеть\b/g, 'бачити'],
  [/\bнужна\b/g, 'потрібна'],
  [/\bнужен\b/g, 'потрібен'],
  [/\bРаботаете\b/g, 'Працюєте'],
  [/\bработаете\b/g, 'працюєте'],
  [/\bхочете\b/g, 'хочете'], // same in uk
  [/\bбольше\b/g, 'більше'],
  [/\bполучают\b/g, 'отримують'],
  [/\bувеличивают\b/g, 'збільшують'],
  [/\bПродублируйте\b/g, 'Продублюйте'],
  [/\bполучает\b/g, 'отримує'],
  // Adjectives / misc
  [/\bпопулярную\b/g, 'популярне'],
  [/\bВажно\b/g, 'Важливо'],
  [/\bважно\b/g, 'важливо'],
  [/\bи ещё\b/g, 'та ще'],
  [/\bстран\b/g, 'країн'],
  [/\bблоков\b/g, 'блоків'],
  [/\bценами\b/g, 'цінами'],
  [/\bценами\b/g, 'цінами'],
];

// ======= Translation Dictionary (English → Ukrainian) =======
// These are common UI strings that appear untranslated
const EN_TO_UK = {
  "Add Image": "Додати зображення",
  "Add Platform": "Додати платформу",
  "Buy": "Купити",
  "Buy for": "Купити за",
  "Buy tokens": "Купити токени",
  "Cancel": "Скасувати",
  "Download": "Завантажити",
  "Remove custom icon": "Видалити власну іконку",
  "Save": "Зберегти",
  "Send": "Надіслати",
  "Read more →": "Читати далі →",
  "Upgrade": "Покращити",
  "Your page is live and delivering results": "Ваша сторінка працює та приносить результати",
  "🎉 Congratulations!": "🎉 Вітаємо!",
  "Create your page": "Створіть свою сторінку",
  "Get your first booking": "Отримайте перше бронювання",
  "Get your first response": "Отримайте першу відповідь",
  "Get your first visitor": "Отримайте першого відвідувача",
  "Publish": "Опублікувати",
  "Add your first block — a link, product, or video": "Додайте перший блок — посилання, товар або відео",
  "Add a contact form — every 5th page with a form gets leads": "Додайте контактну форму — кожна 5-та сторінка з формою отримує ліди",
  "Share your link on social media to attract more visitors": "Поділіться посиланням у соціальних мережах, щоб залучити більше відвідувачів",
  "Publish your page to make it available via link": "Опублікуйте сторінку, щоб вона стала доступною за посиланням",
  "Share your link — 5 out of 10 users get their first visitor within an hour": "Поділіться посиланням — 5 із 10 користувачів отримують першого відвідувача протягом години",
  "Launch your page": "Запустіть свою сторінку",
  "Actions": "Дії",
  "Activity distribution": "Розподіл активності",
  "Activity during the day": "Активність протягом дня",
  "Activity overview": "Огляд активності",
  "Admin Role": "Роль адміністратора",
  "Gives full access to the control panel": "Надає повний доступ до панелі керування",
  "Review of activity and key metrics": "Огляд активності та ключових метрик",
  "Platform Analytics": "Аналітика платформи",
  "Reset cache": "Скинути кеш",
  "By clicks": "За кліками",
  "By day of the week": "За днями тижня",
  "By the hour": "За годинами",
  "By views": "За переглядами",
  "Failed to reset cache": "Не вдалося скинути кеш",
  "Category": "Категорія",
  "Reset cache for all users": "Скинути кеш для всіх користувачів",
  "The next time the app is loaded, each user's cache will be cleared": "При наступному завантаженні додатку кеш кожного користувача буде очищено",
  "Are you sure you want to delete template ": "Ви впевнені, що хочете видалити шаблон ",
  "Conversion": "Конверсія",
  "Create Template": "Створити шаблон",
  "Created": "Створено",
  "Description": "Опис",
  "Devices": "Пристрої",
  "Draft": "Чернетка",
  "Edit": "Редагувати",
  "Edit template": "Редагувати шаблон",
  "Change user tariff": "Змінити тариф користувача",
  "Change user access level": "Змінити рівень доступу користувача",
  "Error deleting template": "Помилка видалення шаблону",
  "Error loading template": "Помилка завантаження шаблону",
  "Error saving template": "Помилка збереження шаблону",
  "Error updating status": "Помилка оновлення статусу",
  "Events": "Події",
  "Expiration": "Термін дії",
  "End date": "Дата закінчення",
  "Finance": "Фінанси",
  "Gamification": "Гейміфікація",
  "Hidden": "Приховано",
  "Leads": "Ліди",
  "Leave blank for lifetime access": "Залиште порожнім для довічного доступу",
  "Participants": "Учасники",
  "Month": "Місяць",
  "Name required": "Ім'я обов'язкове",
  "New template": "Новий шаблон",
  "Niches": "Ніші",
  "No pages found": "Сторінки не знайдено",
  "No templates found": "Шаблони не знайдено",
  "No users found": "Користувачів не знайдено",
  "Open": "Відкрити",
  "Owner": "Власник",
  "Page": "Сторінка",
  "Public": "Публічна",
  "Recent Events": "Останні події",
  "Referrals": "Реферали",
  "Refresh": "Оновити",
  "Registration": "Реєстрація",
  "Admin": "Адміністратор",
  "Searching for pages...": "Пошук сторінок...",
  "Search templates...": "Пошук шаблонів...",
  "Select period": "Обрати період",
  "Select tariff": "Обрати тариф",
  "sessions": "сесії",
  "Recommendations": "Рекомендації",
  "Sources": "Джерела",
  "Status": "Статус",
  "Series": "Серія",
  "Systemic actions": "Системні дії",
  "Engagement": "Залученість",
  "Review": "Огляд",
  "Top content": "Топ контент",
  "Teams": "Команди",
  "Template created": "Шаблон створено",
  "Template deleted": "Шаблон видалено",
  "Name": "Назва",
  "Template updated": "Шаблон оновлено",
  "Templates": "Шаблони",
  "Rate": "Тариф",
  "Business": "Бізнес",
  "Free": "Безкоштовно",
  "Pro": "Pro",
  "Popular blocks": "Популярні блоки",
  "Popular pages": "Популярні сторінки",
  "Total clicks": "Усього кліків",
  "Total views": "Усього переглядів",
  "Trial before": "Тріал до",
  "Unique visitors": "Унікальні відвідувачі",
  "User": "Користувач",
  "against the past period": "порівняно з минулим періодом",
  "Week": "Тиждень",
  "Year": "Рік",
  // Analytics
  "Activity": "Активність",
  "Entire period": "Весь період",
  "Average per day": "В середньому за день",
  "Computers": "Комп'ютери",
  "Track page performance": "Відстежуйте ефективність сторінки",
  "No click data": "Немає даних про кліки",
  "Block efficiency": "Ефективність блоків",
  "Dynamics for the period": "Динаміка за період",
  "Clicks on blocks": "Кліки по блоках",
  "clicks": "кліки",
  "Average time": "Середній час",
  "No interaction": "Без взаємодії",
  "Failures": "Відмови",
  "Clicks per view": "Кліків на перегляд",
  "Returns": "Повернення",
  "Repeat visits": "Повторні візити",
  "On the page": "На сторінці",
  "Views per visitor": "Переглядів на відвідувача",
  "Export": "Експорт",
  "Data export error": "Помилка експорту даних",
  "Export Excel": "Експорт Excel",
  "Data exported successfully": "Дані успішно експортовано",
  "Conversions": "Конверсії",
  "Clicks": "Кліки",
  "Views": "Перегляди",
  "Involvement": "Залученість",
  "Conversion Analysis": "Аналіз конверсій",
  "Total Conversion": "Загальна конверсія",
  "Overall conversion": "Загальна конверсія",
  "Visitor journey to purchase": "Шлях відвідувача до покупки",
  "Conversion funnel": "Воронка конверсій",
  "No geographical data": "Немає географічних даних",
  "Geography": "Географія",
  "Mobile": "Мобільні",
  // AI
  "Bio": "Біо",
  "Page description...": "Опис сторінки...",
  "Currency": "Валюта",
  "Describe Your Page": "Опишіть свою сторінку",
  "Generate with AI": "Згенерувати за допомогою AI",
  "Enter text to translate": "Введіть текст для перекладу",
  "Page Name": "Назва сторінки",
  "My Page": "Моя сторінка",
  "Price": "Ціна",
  "Product Name": "Назва товару",
  "My Amazing Product": "Мій чудовий товар",
  "AI Page Builder": "AI-конструктор сторінок",
  "Translate": "Перекласти",
  "Translate now": "Перекласти зараз",
  "Translate into other languages": "Перекласти іншими мовами",
  "Translation...": "Переклад...",
  "Translation error": "Помилка перекладу",
  "Translation completed": "Переклад завершено",
  // Common
  "About me / Description": "Про мене / Опис",
  "Brief description of your activity": "Короткий опис вашої діяльності",
  "blocks": "блоки",
  "Official Certificate": "Офіційний сертифікат",
  "Page Created Successfully!": "Сторінку успішно створено!",
  "Choose another niche": "Обрати іншу нішу",
  "Edit first": "Спочатку редагувати",
  "Publish now": "Опублікувати зараз",
  "✨ Page is ready!": "✨ Сторінка готова!",
  "Blocks added to your page": "Блоки додано на вашу сторінку",
  "Ready!": "Готово!",
  "Contacts": "Контакти",
  "Phone, email or address...": "Телефон, email або адреса...",
  "Create a page using AI": "Створити сторінку за допомогою AI",
  "Generation error. Try again.": "Помилка генерації. Спробуйте ще раз.",
  "Setting up blocks...": "Налаштування блоків...",
  "Footer assembly...": "Збирання футера...",
  "Profile hydration...": "Наповнення профілю...",
  "Connecting social networks...": "Підключення соціальних мереж...",
  "Collect page": "Зібрати сторінку",
  "Tell us about yourself": "Розкажіть про себе",
  "Media": "Медіа",
  "Your name or business name": "Ваше ім'я або назва бізнесу",
  "Select an area": "Оберіть напрямок",
  "No templates yet": "Шаблонів ще немає",
  "Select a template": "Оберіть шаблон",
  "Selected": "Обрано",
  "Services": "Послуги",
  "Social networks": "Соціальні мережі",
  "Step": "Крок",
  "✨ The page has been created!": "✨ Сторінку створено!",
  "AI Builder": "AI-конструктор",
  // Block types
  "Booking": "Бронювання",
  "Button": "Кнопка",
  "Form": "Форма",
  "Event": "Подія",
  "Gallery": "Галерея",
  "Link": "Посилання",
  "Messenger": "Месенджер",
  "Pricing": "Прайс",
  "Product": "Товар",
  "Social": "Соціальне",
  "Video": "Відео",
  // More common
  "drop-off": "відхід",
  "retained": "утримано",
  "Apply": "Застосувати",
  "view": "перегляд",
  "14 days": "14 днів",
  "30 days": "30 днів",
  "7 days": "7 днів",
  "90 days": "90 днів",
};

// ======= Core Logic =======

function flattenJSON(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenJSON(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

function fixSurzhik(str) {
  let result = str;
  for (const [pattern, replacement] of SURZHIK_FIXES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function translateEnToUk(str) {
  // Exact match first
  if (EN_TO_UK[str]) return EN_TO_UK[str];
  
  // Try trimmed
  const trimmed = str.trim();
  if (EN_TO_UK[trimmed]) return EN_TO_UK[trimmed];
  
  return null;
}

// ======= Main Processing =======

function processLocale() {
  const flatEn = flattenJSON(en);
  const flatUk = flattenJSON(uk);
  const flatRu = flattenJSON(ru);
  
  const result = JSON.parse(JSON.stringify(uk)); // deep clone
  const report = {
    russianFixed: [],
    englishTranslated: [],
    surzhikFixed: [],
    missingAdded: [],
    unchanged: 0,
  };
  
  for (const [key, enValue] of Object.entries(flatEn)) {
    totalKeys++;
    const ukValue = flatUk[key];
    const ruValue = flatRu[key];
    
    // 1. Missing key - add from en.json with translation attempt
    if (ukValue === undefined || ukValue === null || ukValue === '') {
      const translated = translateEnToUk(enValue);
      if (translated) {
        setNestedValue(result, key, translated);
        report.missingAdded.push({ key, from: enValue, to: translated });
      } else {
        setNestedValue(result, key, enValue); // fallback to English
        report.missingAdded.push({ key, from: enValue, to: enValue + ' [NEEDS_TRANSLATION]' });
      }
      addedMissing++;
      continue;
    }
    
    if (typeof ukValue !== 'string') continue;
    
    // 2. Check for Russian characters (corrupted)
    if (hasRussianChars(ukValue)) {
      // Try surzhik fix first
      let fixed = fixSurzhik(ukValue);
      if (fixed !== ukValue && !hasRussianChars(fixed)) {
        setNestedValue(result, key, fixed);
        report.surzhikFixed.push({ key, from: ukValue, to: fixed });
        fixedSurzhik++;
        continue;
      }
      
      // If still has Russian after surzhik fix, try to translate from English
      const enTranslation = translateEnToUk(enValue);
      if (enTranslation) {
        setNestedValue(result, key, enTranslation);
        report.russianFixed.push({ key, from: ukValue, to: enTranslation });
        fixedRussian++;
        continue;
      }
      
      // Mark for manual review but apply surzhik fixes anyway
      if (fixed !== ukValue) {
        setNestedValue(result, key, fixed);
        report.surzhikFixed.push({ key, from: ukValue, to: fixed });
        fixedSurzhik++;
      } else {
        report.unchanged++;
      }
      continue;
    }
    
    // 3. Check for untranslated English strings
    if (isEnglish(ukValue)) {
      const translated = translateEnToUk(ukValue);
      if (translated) {
        setNestedValue(result, key, translated);
        report.englishTranslated.push({ key, from: ukValue, to: translated });
        fixedEnglish++;
        continue;
      }
      // Leave as-is if no translation available
      report.unchanged++;
      continue;
    }
    
    // 4. Check for surzhik (Cyrillic but mixed RU/UK)
    const fixed = fixSurzhik(ukValue);
    if (fixed !== ukValue) {
      setNestedValue(result, key, fixed);
      report.surzhikFixed.push({ key, from: ukValue, to: fixed });
      fixedSurzhik++;
      continue;
    }
    
    report.unchanged++;
  }
  
  return { result, report };
}

// ======= Sort keys alphabetically (recursive) =======
function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObject(obj[key]);
  }
  return sorted;
}

// ======= Execute =======

console.log('🇺🇦 Restoring uk.json...\n');

const { result, report } = processLocale();
const sorted = sortObject(result);

// Write result
fs.writeFileSync(ukPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

// Print report
console.log('=== RESTORATION REPORT ===\n');
console.log(`Total keys in en.json: ${totalKeys}`);
console.log(`Russian text fixed:    ${fixedRussian}`);
console.log(`English translated:    ${fixedEnglish}`);
console.log(`Surzhik corrected:     ${fixedSurzhik}`);
console.log(`Missing keys added:    ${addedMissing}`);
console.log(`Unchanged:             ${report.unchanged}`);
console.log(`\nTotal changes: ${fixedRussian + fixedEnglish + fixedSurzhik + addedMissing}`);

// Save detailed report
const reportPath = path.join(__dirname, '..', 'tmp', 'uk-restoration-report.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`\nDetailed report: ${reportPath}`);

// Print sample fixes
if (report.russianFixed.length > 0) {
  console.log('\n--- Sample Russian fixes ---');
  report.russianFixed.slice(0, 10).forEach(f => console.log(`  ${f.key}: "${f.from}" → "${f.to}"`));
}
if (report.englishTranslated.length > 0) {
  console.log('\n--- Sample English translations ---');
  report.englishTranslated.slice(0, 10).forEach(f => console.log(`  ${f.key}: "${f.from}" → "${f.to}"`));
}
if (report.surzhikFixed.length > 0) {
  console.log('\n--- Sample surzhik fixes ---');
  report.surzhikFixed.slice(0, 10).forEach(f => console.log(`  ${f.key}: "${f.from}" → "${f.to}"`));
}

console.log('\n✅ uk.json restored and sorted!');
