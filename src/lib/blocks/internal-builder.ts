import { createBlock } from './block-factory';
import { generateBlockId } from './block-utils';
import { applyArtDirection } from '@/lib/design/art-direction';
import type { AlgorithmicTemplateBlock } from './algorithmic-templates';
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
    ProfileBlock,
    CarouselBlock,
    LinkBlock,
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

function hydrateProfileBlock(block: ProfileBlock, userInfo: UserInfo): string | undefined {
    if (userInfo.name) block.name = userInfo.name;
    // Extract CTA URL from bio before showing it
    const { url, remainder } = extractUrlFromText(userInfo.bio);
    block.bio = remainder || '';
    // Return the CTA separately so no temporary fields reach persisted blocks.
    return url || undefined;

}

function hydrateSocialsBlock(block: SocialsBlock, parsedSocials: ReturnType<typeof extractSocialsPipeline>) {
    if (parsedSocials.length > 0) {
        block.platforms = parsedSocials.map((s, i) => ({
            id: `soc-${i + 1}`,
            platform: s.platform,
            url: s.url
        }));
    }
}

// ============== ADVANCED HELPERS ==============

/**
 * Recognizes the type of media from a URL and creates an appropriate block
 */
function createSmartMediaBlock(url: string, title: string = 'Мои материалы'): Block {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const isYoutubeOrVimeo = ['youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'].includes(host);
    const isImage = /\.(jpeg|jpg|png|webp|gif|avif)($|\?)/i.test(url) || host === 'images.unsplash.com';

    if (isYoutubeOrVimeo) {
        const videoBlock = createBlock('video') as VideoBlock;
        videoBlock.title = title;
        videoBlock.url = url;
        videoBlock.platform = host.includes('vimeo') ? 'vimeo' : 'youtube';
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
 * Creates a showcase list; quoted prices remain text when business tools are off.
 */
function createFeatureListBlock(parsedServices: ReturnType<typeof extractServicesPipeline>): Block {
    const textBlock = createBlock('text') as TextBlock;
    textBlock.content = '## Чем я могу помочь\n' + parsedServices
        .map((srv) => `- **${srv.title}**${srv.description ? ` — ${srv.description}` : ''}${srv.price > 0 ? ` · ${srv.price.toLocaleString('ru-RU')} ${srv.currency || 'KZT'}` : ''}`)
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
    templateBlocks: readonly AlgorithmicTemplateBlock[],
    userInfo: UserInfo,
    options: { now?: number; seed?: string; businessEnabled?: boolean } = {},
): Block[] {
    const blocks: Block[] = [];
    const push = (block: Block) => blocks.push({
        ...block,
        id: options.now === undefined ? generateBlockId(block.type) : `smart-${block.type}-${options.now}-${blocks.length}`,
        blockSize: 'wide',
        blockStyle: { ...block.blockStyle, borderRadius: 'lg', animation: 'fade-in' },
    } as Block);

    // Profile
    const profile = createBlock('profile') as ProfileBlock;
    profile.avatar = '';
    profile.verified = false;
    profile.bio = '';
    profile.coverGradient = 'light';
    profile.avatarPosition = 'left';
    profile.avatarShape = 'squircle';
    const ctaUrl = hydrateProfileBlock(profile, userInfo);
    if (!userInfo.name?.trim()) profile.name = '';
    if (!profile.bio || profile.bio === 'Tell people about yourself') profile.bio = '';
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
    // Free-form gallery prompts populate both fields. Do not repeat an entire
    // biography as a made-up service when it contains no actual priced offers.
    if (services.length > 0 && (services.some((service) => service.price > 0) || userInfo.services.trim() !== userInfo.bio.trim())) {
        if (services.some((s) => s.price > 0) && options.businessEnabled !== false) {
            const sales = userInfo.goal === 'sales' || (!userInfo.goal && templateBlocks.some((block) => block.type === 'catalog'));
            const block = createBlock(sales ? 'catalog' : 'pricing') as CatalogBlock | PricingBlock;
            block.title = sales ? SERVICE_TITLE_SALES : SERVICE_TITLE;
            const currency = services.find((s) => s.currency)?.currency || 'KZT';
            block.currency = currency as PricingBlock['currency'];
            block.items = services.map((srv, i) => ({
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
        ? chats.map((c) => ({ platform: c.platform as MessengerBlock['messengers'][number]['platform'], username: c.username }))
        : [{ platform: 'whatsapp', username: '' }];
    // Keep an editable contact prompt only when no other contact was supplied.
    if (chats.length > 0 || (!contacts.length && !userInfo.socials.trim())) push(messenger as Block);
    const email = contacts.find((c) => c.platform === 'email');
    if (email) {
        const link = createBlock('link') as LinkBlock;
        link.title = 'Написать на почту';
        link.url = `mailto:${email.username}`;
        push(link as Block);
    }

    // Socials
    const socials = extractSocialsPipeline(userInfo.socials);
    if (socials.length > 0) {
        const block = createBlock('socials') as SocialsBlock;
        block.title = '';
        hydrateSocialsBlock(block, socials);
        push(block as Block);
    }

    // Address
    if (address) {
        const map = createBlock('map') as MapBlock;
        map.address = address;
        push(map as Block);
    }

    // Media
    const urls = [...new Set((userInfo.mediaLinks || '').match(/https?:\/\/[^\s<>"']+/gi) || [])]
        .map((url) => url.replace(/[),.;]+$/, ''))
        .filter((url) => { try { return Boolean(new URL(url).hostname); } catch { return false; } });
    const media = urls.map((url, i) => createSmartMediaBlock(url, urls.length > 1 ? `Материал ${i + 1}` : 'Мои материалы'));
    const images = media.filter((block): block is ImageBlock => block.type === 'image');
    if (images.length > 1) {
        const gallery = createBlock('carousel') as CarouselBlock;
        gallery.title = '';
        gallery.images = images.map((image) => ({ url: image.url, alt: image.alt }));
        gallery.autoPlay = false;
        push(gallery as Block);
    } else if (images.length === 1) push(images[0] as Block);
    media.filter((block) => block.type !== 'image').forEach(push);

    // Creator recipes introduce the work before services; service recipes keep
    // offers first. Only supplied media participates, never sample stock work.
    if (templateBlocks.findIndex((block) => block.type === 'image') === 1) {
        const visual = blocks.filter((block) => ['image', 'carousel', 'video'].includes(block.type));
        blocks.splice(0, blocks.length, blocks[0], ...visual, ...blocks.slice(1).filter((block) => !visual.includes(block)));
    }
    const recipeId = templateBlocks.find((block) => block.type === 'profile')?.overrides?.recipeId;
    const directed = applyArtDirection(blocks, {
        recipeId: typeof recipeId === 'string' ? recipeId : undefined,
        seed: options.seed ?? userInfo.name,
    }).blocks;
    // Art direction generates ephemeral section IDs. Fixed-clock callers (tests,
    // SSR previews) need the entire result, including section links, reproducible.
    const sections = new Map<string, string>();
    return directed.map((block) => {
        if (options.now === undefined || !block.sectionId) return block;
        if (!sections.has(block.sectionId)) sections.set(block.sectionId, `smart-section-${options.now}-${sections.size}`);
        return { ...block, sectionId: sections.get(block.sectionId) };
    });
}
