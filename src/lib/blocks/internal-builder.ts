import { createBlock } from './block-factory';
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
    SeparatorBlock
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

    // Advanced Animation Heuristic for Creatives
    const creativeKeywords = /(дизайн|арт|фото|видео|креатив|маркетинг|seo|копирайт|художник|design|art|photo|video|creator|marketing)/i;
    if (remainder.match(creativeKeywords)) {
        block.nameAnimation = 'typing';
        block.avatarFrame = 'gradient';
    }
}

function hydrateCatalogOrPricingBlock(block: any, parsedServices: any[]) {
    block.title = 'Мои услуги';
    const items = parsedServices.map((srv, i) => ({
        id: `item-${Date.now()}-${i}`,
        name: srv.title,
        description: srv.description,
        price: srv.price,
    })) as any[];
    block.items = items;
}

function hydrateMessengerBlock(block: any, parsedContacts: any[], rawContacts: string) {
    block.title = 'Связаться со мной';
    if (parsedContacts.length > 0) {
        block.messengers = parsedContacts.map((c: any) => ({
            platform: c.platform,
            username: c.username,
        }));
    } else if (rawContacts) {
        // Fallback string if regex failed
        block.messengers = [{ platform: 'whatsapp', username: rawContacts }];
    }
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
        videoBlock.blockStyle = { padding: 'md', animation: 'fade-in' }; // Premium defaults
        return videoBlock as Block;
    }

    if (isImage) {
        const imageBlock = createBlock('image') as ImageBlock;
        imageBlock.url = url;
        imageBlock.alt = title;
        imageBlock.style = 'default';
        imageBlock.blockStyle = { padding: 'md', animation: 'fade-in' };
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

    // Create an elegant bulleted list instead of a catalog
    const content = '### Мои навыки и преимущества\n\n' + parsedServices.map(srv => {
        let line = `✨ **${srv.title}**`;
        if (srv.description) line += `  \n_${srv.description}_`;
        return line;
    }).join('\n\n');

    textBlock.content = content;
    textBlock.style = 'paragraph';
    textBlock.blockStyle = { padding: 'lg', animation: 'fade-in' };
    return textBlock as Block;
}

// ============== ALGORITHM PIPELINE ==============

/**
 * Advanced deterministic hydration algorithm.
 * Uses strategy patterns, NLP extraction pipelines, and smart layouting
 * to build a rich premium page layout from raw user input.
 */
export function generateBlocksFromTemplate(
    templateBlocks: any[],
    userInfo: UserInfo
): Block[] {
    // 1. Data Normalization Pipeline
    const parsedServices = extractServicesPipeline(userInfo.services);

    // Extract address from contacts
    const { location: extractedAddress, remainder: remainderContacts } = extractLocation(userInfo.contacts);
    const parsedContacts = extractContactsPipeline(remainderContacts || userInfo.contacts);

    const parsedSocials = extractSocialsPipeline(userInfo.socials);

    // Check if services have prices. This dictates if we use Catalog or Text List
    const hasPrices = parsedServices.some((s: any) => s.price > 0);

    // Track state to avoid duplicate injections
    const state = {
        injectedProfile: false,
        injectedServices: parsedServices.length === 0 && !userInfo.services,
        injectedContacts: parsedContacts.length === 0 && !userInfo.contacts,
        injectedSocials: parsedSocials.length === 0 && !userInfo.socials,
        injectedAddress: !extractedAddress, // if no address found, treat as done
        injectedDiscount: false
    };

    let ctaUrlToInject: string | null = null;
    let discountToInject: string | null = null;

    // Check for Gamification Discounts in Services
    const { discountText, remainder: remainderServices } = extractDiscount(userInfo.services);
    if (discountText) {
        discountToInject = discountText;
    } else {
        // Search bio as fallback
        const { discountText: discountBio } = extractDiscount(userInfo.bio);
        if (discountBio) discountToInject = discountBio;
    }

    // 2. Base Block Generation
    const blocks: Block[] = templateBlocks.map((blockData: any, index: number) => {
        const blockType = blockData.type || 'text';
        const baseBlock = createBlock(blockType);
        const overrides = blockData.overrides || {};
        return {
            ...baseBlock,
            ...overrides,
            ...blockData,
            id: `${blockType}-${Date.now()}-${index}`,
        } as Block;
    });

    // 3. Hydration Loop (Strategy Pattern)
    for (const block of blocks) {
        // Profile
        if (!state.injectedProfile && (block.type === 'profile' || block.type === 'avatar')) {
            hydrateProfileBlock(block, userInfo);
            state.injectedProfile = true;
            if ((block as any).__extractedCta) ctaUrlToInject = (block as any).__extractedCta;
        } else if (!state.injectedProfile && block.type === 'text' && (block as any).content === '') {
            (block as any).content = `# ${userInfo.name}\n${userInfo.bio}`;
            state.injectedProfile = true;
        }

        // Services
        if (!state.injectedServices && (block.type === 'catalog' || block.type === 'pricing')) {
            if (hasPrices) {
                hydrateCatalogOrPricingBlock(block, parsedServices);
            } else {
                // Convert existing block to Text list
                const featureListText = (createFeatureListBlock(parsedServices) as any).content;
                (block as any).type = 'text';
                (block as any).content = featureListText;
            }
            state.injectedServices = true;
        }

        // Contacts
        if (!state.injectedContacts && block.type === 'messenger') {
            hydrateMessengerBlock(block, parsedContacts, remainderContacts || userInfo.contacts);
            state.injectedContacts = true;
        } else if (!state.injectedContacts && block.type === 'form') {
            (block as any).title = 'Оставить заявку';
            state.injectedContacts = true;
        }

        // Socials
        if (!state.injectedSocials && block.type === 'socials') {
            hydrateSocialsBlock(block, parsedSocials, userInfo.socials);
            state.injectedSocials = true;
        }

        // Address
        if (!state.injectedAddress && block.type === 'map') {
            (block as any).address = extractedAddress;
            state.injectedAddress = true;
        }
    }

    // 4. Smart Fallbacks (Appending missing crucial blocks)
    // Profile fallback
    if ((userInfo.name || userInfo.bio) && !state.injectedProfile) {
        const profileBlock = createBlock('profile');
        hydrateProfileBlock(profileBlock, userInfo);
        if ((profileBlock as any).__extractedCta) ctaUrlToInject = (profileBlock as any).__extractedCta;

        // Advanced Profile styling
        (profileBlock as any).blockStyle = { padding: 'md', animation: 'fade-in' };
        (profileBlock as any).blockSize = 'wide';

        blocks.unshift({ ...profileBlock, id: `profile-fallback-${Date.now()}` } as Block);
    }

    // CTA Insertion right after profile
    if (ctaUrlToInject) {
        const ctaBlock = createBlock('button') as ButtonBlock;
        ctaBlock.title = 'Подробнее';
        ctaBlock.url = ctaUrlToInject;
        ctaBlock.width = 'full';
        ctaBlock.blockStyle = { padding: 'md', animation: 'scale-in', hoverEffect: 'glow' };
        (ctaBlock as any).blockSize = 'wide';

        // Find profile index to insert right after
        const profileIndex = blocks.findIndex(b => b.type === 'profile' || b.type === 'avatar');
        if (profileIndex >= 0) {
            blocks.splice(profileIndex + 1, 0, { ...ctaBlock, id: `cta-fallback-${Date.now()}` });
        } else {
            blocks.unshift({ ...ctaBlock, id: `cta-fallback-${Date.now()}` });
        }
    }

    // Gamification (Scratch Block)
    if (discountToInject && !state.injectedDiscount) {
        const scratchBlock = createBlock('scratch') as any; // Type may need to be loose if scratch isn't universally typed yet
        scratchBlock.type = 'scratch';
        scratchBlock.title = 'Ваш бонус';
        scratchBlock.content = discountToInject;
        scratchBlock.blockStyle = { animation: 'scale-in', padding: 'md' };
        scratchBlock.blockSize = 'wide';
        // Add right after CTA or Profile
        blocks.push({ ...scratchBlock, id: `scratch-fallback-${Date.now()}` } as Block);
        state.injectedDiscount = true;
    }

    // Services fallback
    if (!state.injectedServices && parsedServices.length > 0) {
        if (hasPrices) {
            const catalogBlock = createBlock('catalog') as CatalogBlock;
            catalogBlock.title = 'Каталог услуг';
            hydrateCatalogOrPricingBlock(catalogBlock, parsedServices);
            catalogBlock.blockStyle = { animation: 'fade-in', padding: 'md' };
            (catalogBlock as any).blockSize = 'wide';
            blocks.push({ ...catalogBlock, id: `catalog-fallback-${Date.now()}` } as Block);
        } else {
            const featureList = createFeatureListBlock(parsedServices) as any;
            featureList.blockSize = 'wide';
            blocks.push({ ...featureList, id: `features-fallback-${Date.now()}` });
        }
    }

    // Contacts fallback (Small Grid Pair 1)
    if (!state.injectedContacts && (parsedContacts.length > 0 || remainderContacts)) {
        const messengerBlock = createBlock('messenger') as MessengerBlock;
        hydrateMessengerBlock(messengerBlock, parsedContacts, remainderContacts || userInfo.contacts);
        messengerBlock.blockStyle = { animation: 'fade-in', padding: 'md', shadow: 'sm', hoverEffect: 'lift' };
        (messengerBlock as any).blockSize = 'small'; // Responsive grid
        blocks.push({ ...messengerBlock, id: `messenger-fallback-${Date.now()}` } as Block);
    }

    // Map fallback (Small Grid Pair 2)
    if (extractedAddress && !state.injectedAddress) {
        const mapBlock = createBlock('map') as MapBlock;
        mapBlock.address = extractedAddress;
        mapBlock.blockStyle = { animation: 'fade-in', padding: 'md', borderRadius: 'lg', shadow: 'sm', hoverEffect: 'lift' };
        (mapBlock as any).blockSize = 'small'; // Responsive grid paired with messenger naturally
        blocks.push({ ...mapBlock, id: `map-fallback-${Date.now()}` } as Block);
    }

    // Socials fallback
    if (!state.injectedSocials && (parsedSocials.length > 0 || userInfo.socials)) {
        const socialsBlock = createBlock('socials') as SocialsBlock;
        socialsBlock.title = 'Мои соцсети';
        hydrateSocialsBlock(socialsBlock, parsedSocials, userInfo.socials);
        socialsBlock.blockStyle = { animation: 'fade-in', padding: 'md', shadow: 'sm', hoverEffect: 'lift' };
        (socialsBlock as any).blockSize = 'small'; // Leaves room for other small blocks in row
        blocks.push({ ...socialsBlock, id: `socials-fallback-${Date.now()}` } as Block);
    }

    // Smart Media Links fallback
    if (userInfo.mediaLinks) {
        // Split by commas and create blocks
        const urls = userInfo.mediaLinks.split(',').map(s => s.trim()).filter(Boolean);
        urls.forEach((url, i) => {
            const mediaBlock = createSmartMediaBlock(url, urls.length > 1 ? `Материал ${i + 1}` : 'Мои материалы');
            if (mediaBlock.type !== 'video' && mediaBlock.type !== 'image') {
                (mediaBlock as any).blockSize = 'small';
            } else {
                (mediaBlock as any).blockSize = 'wide';
            }
            blocks.push({ ...mediaBlock, id: `media-fallback-${Date.now()}-${i}` });
        });
    }

    // 5. Layouting & Auto-Separators (Rhythm and Polish)
    // Avoid double separators, ensure flow.
    const heavyBlocks = ['catalog', 'pricing', 'form', 'map', 'video'];
    const polishedBlocks: Block[] = [];

    for (let i = 0; i < blocks.length; i++) {
        const currentBlock = blocks[i];
        polishedBlocks.push(currentBlock);

        // If current and next blocks are heavy, insert a smart separator
        if (heavyBlocks.includes(currentBlock.type) && i < blocks.length - 1) {
            const nextBlock = blocks[i + 1];
            if (heavyBlocks.includes(nextBlock.type) || nextBlock.type === 'messenger' || nextBlock.type === 'text') {
                const separatorBlock = createBlock('separator') as SeparatorBlock;
                separatorBlock.variant = 'dashed';
                separatorBlock.width = 'half';
                separatorBlock.spacing = 'lg';
                separatorBlock.id = `auto-separator-${Date.now()}-${i}`;
                polishedBlocks.push(separatorBlock as Block);
            }
        }
    }

    return polishedBlocks;
}
