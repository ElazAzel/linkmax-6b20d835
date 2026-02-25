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

/**
 * Advanced price extraction
 * Looks for common currency symbols and patterns: 15000, 15 000 тг, $100, 500руб
 */
export function extractPrice(text: string): { price: number; currency: string; remainder: string } {
    if (!text) return { price: 0, currency: '', remainder: '' };

    // Common currency patterns
    const currencyMap: Record<string, string> = {
        'тг': 'KZT', 'kzt': 'KZT', '₸': 'KZT',
        'руб': 'RUB', 'rub': 'RUB', '₽': 'RUB',
        '$': 'USD', 'usd': 'USD',
        '€': 'EUR', 'eur': 'EUR'
    };

    // Regex to find things like: "15 000 тг", "$100", "500руб", "15000"
    // Capture group 1: currency symbol before (e.g. $)
    // Capture group 2: number (can have spaces or commas)
    // Capture group 3: currency symbol after (e.g. тг, руб)
    const priceRegex = /([$€₸₽]?)(\s*\d+(?:[.,\s]\d+)*\s*)([a-zA-Zа-яА-ЯёЁ]+|[$€₸₽]?)/i;
    const match = text.match(priceRegex);

    if (match) {
        const fullMatch = match[0];
        const preSymbol = match[1]?.trim().toLowerCase();
        const numStr = match[2]?.replace(/[\s,]/g, '') || '0';
        const postSymbol = match[3]?.trim().toLowerCase();

        // Safe parse
        const parsedPrice = parseFloat(numStr);
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
            // Decide currency
            let currencyLabel = 'KZT'; // Default
            for (const [key, val] of Object.entries(currencyMap)) {
                if (preSymbol === key || postSymbol === key) {
                    currencyLabel = val;
                    break;
                }
            }

            // Remove the found price from the original string to leave just the description
            const remainder = text.replace(fullMatch, '').trim().replace(/[-—:.,]$/, '').trim();

            return { price: parsedPrice, currency: currencyLabel, remainder };
        }
    }

    return { price: 0, currency: '', remainder: text };
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
        let title = textWithoutPrice;
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
    let phoneMatch;
    while ((phoneMatch = phoneRegex.exec(text)) !== null) {
        const phone = phoneMatch[0].replace(/[^+\d]/g, '');
        // Deduplicate
        if (!results.find(r => r.username === phone)) {
            results.push({ platform: 'whatsapp', username: phone });
        }
    }

    // 2. Email extraction
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    let emailMatch;
    while ((emailMatch = emailRegex.exec(text)) !== null) {
        if (!results.find(r => r.username === emailMatch[0])) {
            results.push({ platform: 'email', username: emailMatch[0] });
        }
    }

    // 3. Telegram Contextual Extraction
    // First, look for direct links t.me/username
    const tmeRegex = /t\.me\/([a-zA-Z0-9_]{5,32})/g;
    let tmeMatch;
    while ((tmeMatch = tmeRegex.exec(text)) !== null) {
        if (!results.find(r => r.platform === 'telegram' && r.username === tmeMatch[1])) {
            results.push({ platform: 'telegram', username: tmeMatch[1] });
        }
    }

    // Second, look for @username if "тг", "tg", "telegram" is nearby
    const atTgRegex = /(?:тг|tg|telegram|телеграм|телеграмм)[:\s.-]*@([a-zA-Z0-9_]{5,32})/gi;
    let atTgMatch;
    while ((atTgMatch = atTgRegex.exec(text)) !== null) {
        if (!results.find(r => r.platform === 'telegram' && r.username === atTgMatch[1])) {
            results.push({ platform: 'telegram', username: atTgMatch[1] });
        }
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
            const baseUrl = `https://${SOCIAL_PLATFORMS[shortcut] === 'x' ? 'x' : SOCIAL_PLATFORMS[shortcut]}.com/`;
            if (platform === 'telegram') baseUrl = 'https://t.me/';
            if (platform === 'tiktok') baseUrl = 'https://tiktok.com/@';

            results.push({ platform, url: `${baseUrl}${contextMatch[1]}` });
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
    const locationRegex = /(?:г\.|ул\.|пр-т\.|город|улица|проспект|street|city|region)[:\s]+([^,\n]{2,50})(?:[,.\n]|$)/i;
    const match = text.match(locationRegex);

    if (match) {
        // Find the whole line or segment containing the match to pull out a decent address string
        const lines = text.split(/[\n;]/);
        let foundLine = '';
        const remainderLines = [];

        for (const line of lines) {
            if (line.match(locationRegex)) {
                foundLine = line.trim();
            } else {
                remainderLines.push(line);
            }
        }

        if (foundLine) {
            return {
                location: foundLine.replace(/^(?:Адрес|Локация|Место)[:\s-]*/i, '').trim(),
                remainder: remainderLines.join('\n').trim()
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
