import { createBlock } from './block-factory';
import { generateBlockId } from './block-utils';
import type {
    Block,
    CatalogItem,
    CatalogBlock,
    PricingItem,
    PricingBlock,
    MessengerBlock,
    SocialsBlock,
    TextBlock,
    VideoBlock,
    ImageBlock,
    MapBlock,
    ButtonBlock,
} from '@/types/page';
import {
    extractServicesPipeline,
    extractContactsPipeline,
    extractSocialsPipeline,
    extractUrlFromText,
    extractLocation,
    extractDiscount
} from './extractors';

interface UserInfo {
    name: string;
    bio: string;
    goal?: string;
    contacts: string;
    services: string;
    socials: string;
    mediaLinks: string;
}

// ============== HYDRATION STRATEGIES ==============

function hydrateProfileBlock(block: any, userInfo: UserInfo) {
    if (userInfo.name) block.name = userInfo.name;
    // Extract CTA URL from bio before showing it
    const { url, remainder } = extractUrlFromText(userInfo.bio);
    if (remainder) block.bio = remainder;
    // Store extracted CTA inside block temp data so pipeline can process it later
    if (url) block.__extractedCta = url;

}

function hydrateSocialsBlock(block: any, parsedSocials: any[], rawSocials: string) {
    if (parsedSocials.length > 0) {
        block.platforms = parsedSocials.map((s: any, i: number) => ({
            id: `soc-${Date.now()}-${i}`,
            platform: s.platform,
            url: s.url
        }));
    } else if (rawSocials) {
        // Fallback guess
        block.platforms = [{ id: 'soc-1', platform: 'instagram', url: rawSocials }];
    }
}

// ============== ADVANCED HELPERS ==============

/**
 * Recognizes the type of media from a URL and creates an appropriate block
 */
function createSmartMediaBlock(url: string, title: string = 'Мои материалы'): Block {
    const isYoutubeOrVimeo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
    const isImage = url.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i);

    if (isYoutubeOrVimeo) {
        const videoBlock = createBlock('video') as VideoBlock;
        videoBlock.title = title;
        videoBlock.url = url;
        videoBlock.platform = url.includes('vimeo') ? 'vimeo' : 'youtube';
                return videoBlock as Block;
    }

    if (isImage) {
        const imageBlock = createBlock('image') as ImageBlock;
        imageBlock.url = url;
        imageBlock.alt = title;
        imageBlock.style = 'default';
        (imageBlock as ImageBlock & { blockSize?: string }).blockSize = 'full';
        return imageBlock as Block;
    }

    // Fallback: Button
    const buttonBlock = createBlock('button') as ButtonBlock;
    buttonBlock.title = title;
    buttonBlock.url = url;
    buttonBlock.width = 'full';
    buttonBlock.blockStyle = { padding: 'md', animation: 'scale-in', hoverEffect: 'lift' };
    return buttonBlock as Block;
}

/**
 * Creates a feature list without a catalog block if there are no prices
 */
function createFeatureListBlock(parsedServices: any[]): Block {
    const textBlock = createBlock('text') as TextBlock;
    textBlock.content = '## Чем я могу помочь\n' + parsedServices
        .map((srv) => `- **${srv.title}**${srv.description ? ` — ${srv.description}` : ''}`)
        .join('\n');
    textBlock.style = 'paragraph';
    return textBlock as Block;
}

// ============== ALGORITHM PIPELINE ==============

const SERVICE_TITLE_SALES = 'Каталог';
const SERVICE_TITLE = 'Услуги и цены';

/**
 * Builds a page only from what the person typed. It used to start from a
 * niche recipe and leave every block it could not fill with factory filler:
 * "Напишите что-нибудь интересное…", "Товар 1 / 1000 ₸", an English form,
 * a generic FAQ, an empty booking widget and dashed separators.
 *
 * Order: profile → main link → offer → services → contacts → socials →
 * address → media. Contacts always get a block (empty ones stay hidden from
 * visitors and prompt the owner in the editor).
 */
export function generateBlocksFromTemplate(
    _templateBlocks: unknown[],
    userInfo: UserInfo
): Block[] {
    const blocks: Block[] = [];
    const push = (block: Block) => blocks.push({ ...block, id: generateBlockId(block.type) } as Block);

    // Profile
    const profile = createBlock('profile') as any;
    profile.avatar = '';
    hydrateProfileBlock(profile, userInfo);
    if (!userInfo.name?.trim()) profile.name = '';
    if (!profile.bio || profile.bio === 'Tell people about yourself') profile.bio = '';
    const ctaUrl: string | undefined = profile.__extractedCta;
    delete profile.__extractedCta;
    push(profile as Block);

    // Main link from the bio
    if (ctaUrl) {
        const cta = createBlock('button') as ButtonBlock;
        cta.title = userInfo.goal === 'leads' ? 'Записаться' : 'Подробнее';
        cta.url = ctaUrl;
        cta.width = 'full';
        push(cta as Block);
    }

    // Offer ("Скидка 10% на первый визит")
    const { discountText } = extractDiscount(userInfo.services);
    const offer = discountText || extractDiscount(userInfo.bio).discountText;
    if (offer) {
        const text = createBlock('text') as TextBlock;
        text.content = `🎁 **${offer}**`;
        push(text as Block);
    }

    // Services
    const services = extractServicesPipeline(extractDiscount(userInfo.services).remainder || userInfo.services)
        .filter((s) => s.title || s.price > 0);
    if (services.length > 0) {
        if (services.some((s) => s.price > 0)) {
            const sales = userInfo.goal === 'sales';
            const block = createBlock(sales ? 'catalog' : 'pricing') as CatalogBlock | PricingBlock;
            block.title = sales ? SERVICE_TITLE_SALES : SERVICE_TITLE;
            const currency = services.find((s) => s.currency)?.currency || 'KZT';
            (block as any).currency = currency;
            (block as any).items = services.map((srv, i) => ({
                id: `item-${i + 1}`,
                name: srv.title || `Услуга ${i + 1}`,
                description: srv.description,
                price: srv.price,
                currency: srv.currency || currency,
            })) as Array<CatalogItem & PricingItem>;
            push(block as Block);
        } else {
            push(createFeatureListBlock(services));
        }
    }

    // Contacts
    const { location: address, remainder: contactsRest } = extractLocation(userInfo.contacts);
    const contacts = extractContactsPipeline(contactsRest || userInfo.contacts);
    const chats = contacts.filter((c) => c.platform !== 'email');
    const messenger = createBlock('messenger') as MessengerBlock;
    messenger.title = userInfo.goal === 'leads' ? 'Записаться' : 'Связаться со мной';
    messenger.messengers = chats.length > 0
        ? chats.map((c) => ({ platform: c.platform as 'whatsapp' | 'telegram', username: c.username }))
        : [{ platform: 'whatsapp', username: '' }];
    push(messenger as Block);
    const email = contacts.find((c) => c.platform === 'email');
    if (email) {
        const link = createBlock('link') as any;
        link.title = 'Написать на почту';
        link.url = `mailto:${email.username}`;
        push(link as Block);
    }

    // Socials
    const socials = extractSocialsPipeline(userInfo.socials);
    if (socials.length > 0) {
        const block = createBlock('socials') as SocialsBlock;
        block.title = '';
        hydrateSocialsBlock(block, socials, userInfo.socials);
        push(block as Block);
    }

    // Address
    if (address) {
        const map = createBlock('map') as MapBlock;
        map.address = address;
        push(map as Block);
    }

    // Media
    const urls = (userInfo.mediaLinks || '').split(/[\s,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
    urls.forEach((url, i) => push(createSmartMediaBlock(url, urls.length > 1 ? `Материал ${i + 1}` : 'Мои материалы')));

    return blocks;
}
