// Removed invalid import

/**
 * Represents structured data extracted from raw user input
 */
export interface ParsedUserData {
    services: ParsedService[];
    messengers: ParsedMessenger[];
    socials: ParsedSocial[];
}

export interface ParsedService {
    title: string;
    description: string;
    price: number;
    currency: string;
}

export interface ParsedMessenger {
    platform: 'whatsapp' | 'telegram' | 'viber' | 'wechat' | 'email';
    username: string;
}

export interface ParsedSocial {
    platform: string;
    url: string;
}

// ----------------------------------------------------------------------
// PRICE & SERVICE EXTRACTION
// ----------------------------------------------------------------------

const CURRENCY_ALIASES: Array<[RegExp, string]> = [
    [/^(?:тг|тенге|kzt|₸)$/i, 'KZT'],
    [/^(?:руб|рублей|р|rub|₽)$/i, 'RUB'],
    [/^(?:\$|usd|долл)$/i, 'USD'],
    [/^(?:€|eur|евро)$/i, 'EUR'],
];

// "60 минут", "5 сессий", "10 занятий", "2 часа" are quantities, not prices.
const QUANTITY_UNIT = /^(?:мин|минут|минуты|min|час|часа|часов|ч|h|сесси|сеанс|заняти|урок|встреч|дн|день|дня|недел|месяц|мес|шт|раз|человек|чел|%)/i;

/**
 * The price in one service line: "Маникюр — 8 000 тг", "Консультация 60 минут 15000",
 * "$100 session". Numbers followed by a duration or count are skipped; a number
 * with a currency wins, otherwise the largest remaining number.
 */
export function extractPrice(text: string): { price: number; currency: string; remainder: string } {
    if (!text) return { price: 0, currency: '', remainder: '' };

    const tokenRegex = /([$€₸₽])?\s*(\d{1,3}(?:[ \u00a0.,]\d{3})+|\d+)(?:[.,]\d{1,2})?\s*([a-zA-Zа-яА-ЯёЁ]+\.?|[$€₸₽])?/g;
    type Candidate = { price: number; currency: string; match: string; hasCurrency: boolean };
    const candidates: Candidate[] = [];
    let m: RegExpExecArray | null;
    while ((m = tokenRegex.exec(text)) !== null) {
        const pre = m[1] ?? '';
        const unit = (m[3] ?? '').replace(/\.$/, '');
        if (unit && QUANTITY_UNIT.test(unit) && !pre) continue;
        const value = Number(m[2].replace(/[ \u00a0.,]/g, ''));
        if (!Number.isFinite(value) || value <= 0) continue;
        const alias = CURRENCY_ALIASES.find(([re]) => re.test(pre) || (unit && re.test(unit)));
        // A trailing word that is not a currency stays in the remainder.
        const match = alias || !unit ? m[0] : m[0].slice(0, m[0].lastIndexOf(unit));
        candidates.push({ price: value, currency: alias?.[1] ?? 'KZT', match: match.trim(), hasCurrency: Boolean(alias) });
    }
    if (candidates.length === 0) return { price: 0, currency: '', remainder: text.trim() };

    const best = candidates.find((c) => c.hasCurrency)
        ?? candidates.reduce((a, b) => (b.price > a.price ? b : a));
    const remainder = text.replace(best.match, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s*[-—–:,]\s*$/, '')
        .replace(/^\s*[-—–:,]\s*/, '')
        .trim();
    return { price: best.price, currency: best.currency, remainder };
}

/**
 * Parses raw services text into structured items using heuristic splitting
 */
export function extractServicesPipeline(text: string): ParsedService[] {
    if (!text || !text.trim()) return [];

    // Heuristic 1: Split by newlines. If no newlines but has commas, split by commas.
    // If it's just one long continuous string with no obvious delimiters, we'll try to split by sentences.
    let lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length === 1 && text.includes(',')) {
        lines = text.split(',').map(s => s.trim()).filter(Boolean);
    }

    return lines.map(line => {
        // Step 1: Extract Price
        const { price, currency, remainder: textWithoutPrice } = extractPrice(line);

        // Step 2: Split title and description
        // usually separated by a dash or colon
        let title = textWithoutPrice.replace(/\s+от$/i, '').trim();
        let description = '';

        const splitMatch = textWithoutPrice.match(/^(.*?)\s*[-—:]\s*(.*)$/);
        if (splitMatch) {
            title = splitMatch[1].trim();
            description = splitMatch[2].trim();
        } else {
            // Fallback: If it's a long sentence, just use the first few words as title
            if (textWithoutPrice.length > 40) {
                title = textWithoutPrice.slice(0, 30) + '...';
                description = textWithoutPrice;
            }
        }

        return { title, description, price, currency: price > 0 ? currency : '' };
    }).slice(0, 10); // Limit to 10 items
}

// ----------------------------------------------------------------------
// CONTACT EXTRACTION
// ----------------------------------------------------------------------

export function extractContactsPipeline(text: string): ParsedMessenger[] {
    if (!text || !text.trim()) return [];

    const results: ParsedMessenger[] = [];
    const lowerText = text.toLowerCase();

    // 1. Phone extraction (very robust regex for international phones)
    // Matches: +7 777 123 45 67, 8(999)123-45-67, +1-555-555-5555
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}/g;
    let phoneMatch: RegExpExecArray | null;
    while ((phoneMatch = phoneRegex.exec(text)) !== null) {
        const phone = phoneMatch[0].replace(/[^+\d]/g, '');
        // Deduplicate
        if (!results.find(r => r.username === phone)) {
            results.push({ platform: 'whatsapp', username: phone });
        }
    }

    // 2. Email extraction
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    let emailMatch: RegExpExecArray | null;
    while ((emailMatch = emailRegex.exec(text)) !== null) {
        if (!results.find(r => r.username === emailMatch![0])) {
            results.push({ platform: 'email', username: emailMatch![0] });
        }
    }

    // 3. Telegram Contextual Extraction
    // First, look for direct links t.me/username
    const tmeRegex = /t\.me\/([a-zA-Z0-9_]{5,32})/g;
    let tmeMatch: RegExpExecArray | null;
    while ((tmeMatch = tmeRegex.exec(text)) !== null) {
        if (!results.find(r => r.platform === 'telegram' && r.username === tmeMatch![1])) {
            results.push({ platform: 'telegram', username: tmeMatch![1] });
        }
    }

    // Second, look for @username if "тг", "tg", "telegram" is nearby
    const atTgRegex = /(?:тг|tg|telegram|телеграм|телеграмм)[:\s.-]*@([a-zA-Z0-9_]{5,32})/gi;
    let atTgMatch: RegExpExecArray | null;
    while ((atTgMatch = atTgRegex.exec(text)) !== null) {
        if (!results.find(r => r.platform === 'telegram' && r.username === atTgMatch![1])) {
            results.push({ platform: 'telegram', username: atTgMatch![1] });
        }
    }

    // A bare "@handle" in the contacts field is how people here write Telegram.
    if (!results.some(r => r.platform === 'telegram')) {
        // ...unless it is labelled as another network ("Instagram @nick").
        const bare = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, ' ')
            .replace(/(?:instagram|inst|insta|инста|инстаграм|tiktok|тикток)[:\s]*@[\w.]+/gi, ' ')
            .match(/(?:^|[\s,;(])@([a-zA-Z][a-zA-Z0-9_]{4,31})\b/);
        if (bare) results.push({ platform: 'telegram', username: bare[1] });
    }

    return results;
}


// ----------------------------------------------------------------------
// SOCIALS EXTRACTION
// ----------------------------------------------------------------------

const SOCIAL_PLATFORMS: Record<string, string> = {
    'instagram': 'instagram',
    'inst': 'instagram',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
    'yt': 'youtube',
    'vk': 'vk',
    'facebook': 'facebook',
    'fb': 'facebook',
    'twitter': 'x',
    'x': 'x',
    'linkedin': 'linkedin',
    'github': 'github',
    'dribbble': 'dribbble',
    'behance': 'behance',
    'pinterest': 'pinterest',
    'telegram': 'telegram',
    'tg': 'telegram',
    'twitch': 'twitch' // fallback mapped if necessary
};

export function extractSocialsPipeline(text: string): ParsedSocial[] {
    if (!text || !text.trim()) return [];

    const results: ParsedSocial[] = [];
    const tokens = text.toLowerCase().split(/[\s,;\n]+/); // tokenize

    // 1. Safe URL extraction
    const urlRegex = /(https?:\/\/[^\s,]+)/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
        const fullUrl = urlMatch[1];
        try {
            const parsedUrl = new URL(fullUrl);
            const host = parsedUrl.hostname.replace('www.', '');

            // Map host to platform
            for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
                if (host.includes(key) && !results.find(r => r.platform === platform)) {
                    results.push({ platform, url: fullUrl });
                    break; // move to next url
                }
            }
        } catch (e) {
            // Invalid URL, skip
        }
    }

    // 2. Contextual @username extraction (e.g. "inst: @nickname")
    for (const [shortcut, platform] of Object.entries(SOCIAL_PLATFORMS)) {
        if (results.find(r => r.platform === platform)) continue; // Already found via URL

        // regex: inst: @username or inst @username
        const contextRegex = new RegExp(`${shortcut}[:\\s.-]*@([a-zA-Z0-9_.]+)`, 'gi');
        let contextMatch;
        while ((contextMatch = contextRegex.exec(text)) !== null) {
            let resolvedUrl = `https://${SOCIAL_PLATFORMS[shortcut] === 'x' ? 'x' : SOCIAL_PLATFORMS[shortcut]}.com/`;
            if (platform === 'telegram') resolvedUrl = 'https://t.me/';
            if (platform === 'tiktok') resolvedUrl = 'https://tiktok.com/@';

            results.push({ platform, url: `${resolvedUrl}${contextMatch[1]}` });
            break; // Stop looking for this platform once found
        }
    }

    // 3. Fallback: isolated URLs that don't have http schema but look like domains
    for (const [shortcut, platform] of Object.entries(SOCIAL_PLATFORMS)) {
        if (results.find(r => r.platform === platform)) continue;

        const domainRegex = new RegExp(`${shortcut}\\.com\\/([a-zA-Z0-9_.]+)`, 'gi');
        let domainMatch;
        while ((domainMatch = domainRegex.exec(text)) !== null) {
            const baseUrl = `https://${SOCIAL_PLATFORMS[shortcut] === 'x' ? 'x' : SOCIAL_PLATFORMS[shortcut]}.com/`;
            results.push({ platform, url: `${baseUrl}${domainMatch[1]}` });
            break;
        }
    }

    return results;
}

// ----------------------------------------------------------------------
// CTA & LOCATION EXTRACTION
// ----------------------------------------------------------------------

/**
 * Extracts a single primary CTA URL from a text block, and returns the modified text
 * Useful for pulling a "Book here" link out of a Bio.
 */
export function extractUrlFromText(text: string): { url: string; remainder: string } {
    if (!text) return { url: '', remainder: '' };

    // Matches first HTTP/HTTPS link that isn't just a generic domain mention
    const ctaRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(ctaRegex);

    if (match) {
        const url = match[1];
        // Remove the URL, and clean up any trailing colons or "по ссылке:" phrases loosely
        let remainder = text.replace(url, '').trim();
        remainder = remainder.replace(/(?:по ссылке|link|тут)[:\s-]*$/i, '').trim();
        return { url, remainder };
    }

    return { url: '', remainder: text };
}

/**
 * Heuristics to extract physical addresses/locations
 * Looks for common Russian/International address markers
 */
export function extractLocation(text: string): { location: string; remainder: string } {
    if (!text) return { location: '', remainder: '' };

    // Simple heuristic regex: looks for "г. ", "ул. ", "проспект", "street", "city" followed by words
    const locationRegex = /(?:^|[\s(])(?:г\.|ул\.|пр-т\.?|пр\.|мкр\.?|микрорайон|бульвар|б-р|город|улица|проспект|жк|street|st\.|ave\.?|city)\s*[:\s]?\s*[«"]?[А-ЯA-Zа-яa-z0-9]/i;
    const match = text.match(locationRegex);

    if (match) {
        // Find the whole line or segment containing the match to pull out a decent address string
        // Contacts are usually typed on one line: "+7 701…, @tg, ул. Абая 10".
        const parts = text.split(/[\n;,]/);
        const found: string[] = [];
        const rest: string[] = [];
        let inAddress = false;
        for (const raw of parts) {
            const part = raw.trim();
            if (!part) continue;
            if (locationRegex.test(part) || /^(?:адрес|локация|место)\b/i.test(part)) {
                found.push(part);
                inAddress = true;
            } else if (inAddress && /^(?:\d+[а-яa-z]?|д\.?\s*\d+|офис|оф\.|кв\.|этаж|блок|кабинет)/i.test(part)) {
                // "ул. Абая, 10, офис 5" continues the address
                found.push(part);
            } else {
                inAddress = false;
                rest.push(part);
            }
        }

        if (found.length > 0) {
            return {
                location: found.join(', ').replace(/^(?:Адрес|Локация|Место)[:\s-]*/i, '').trim(),
                remainder: rest.join(', ').trim()
            };
        }
    }

    return { location: '', remainder: text };
}

/**
 * Gamification Heuristics: extracts discounts, promos, or bonuses
 * Looks for words indicating a special offer.
 */
export function extractDiscount(text: string): { discountText: string; remainder: string } {
    if (!text) return { discountText: '', remainder: '' };

    // Regex to find "скидка", "акция", "промокод", "подарок" + context around it (like "Скидка 10% на первый сеанс")
    const discountRegex = /(?:скидка|акция|промокод|подарок|бонус|discount|promo|sale)[\s:]*([^\n.;]{2,40})/i;
    const match = text.match(discountRegex);

    if (match) {
        // Find the whole sentence/line containing the promo
        const lines = text.split(/[\n;]/);
        let foundLine = '';
        const remainderLines = [];

        for (const line of lines) {
            if (line.match(discountRegex)) {
                foundLine = line.trim();
            } else {
                remainderLines.push(line);
            }
        }

        if (foundLine) {
            return {
                discountText: foundLine,
                remainder: remainderLines.join('\n').trim()
            };
        }
    }

    return { discountText: '', remainder: text };
}
