import { createBlock } from './block-factory';
import type { Block, CatalogItem, CatalogBlock, PricingItem, PricingBlock, MessengerBlock, SocialsBlock } from '@/types/page';
import { extractServicesPipeline, extractContactsPipeline, extractSocialsPipeline } from './extractors';

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
    if (userInfo.bio) block.bio = userInfo.bio;
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

// ============== ALGORITHM PIPELINE ==============

/**
 * Advanced deterministic hydration algorithm.
 * Uses strategy patterns and data extraction pipelines to build a rich page layout
 * from raw user input, gracefully degrading or falling back when data is missing.
 */
export function generateBlocksFromTemplate(
    templateBlocks: any[],
    userInfo: UserInfo
): Block[] {
    // 1. Data Normalization Pipeline
    const parsedServices = extractServicesPipeline(userInfo.services);
    const parsedContacts = extractContactsPipeline(userInfo.contacts);
    const parsedSocials = extractSocialsPipeline(userInfo.socials);

    // Track state to avoid duplicate injections
    const state = {
        injectedProfile: false,
        injectedServices: parsedServices.length === 0 && !userInfo.services,
        injectedContacts: parsedContacts.length === 0 && !userInfo.contacts,
        injectedSocials: parsedSocials.length === 0 && !userInfo.socials,
    };

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
        if (!state.injectedProfile && (block.type === 'profile' || block.type === 'avatar')) {
            hydrateProfileBlock(block, userInfo);
            state.injectedProfile = true;
        } else if (!state.injectedProfile && block.type === 'text' && (block as any).content === '') {
            (block as any).content = `# ${userInfo.name}\n${userInfo.bio}`;
            state.injectedProfile = true;
        }

        if (!state.injectedServices && (block.type === 'catalog' || block.type === 'pricing')) {
            hydrateCatalogOrPricingBlock(block, parsedServices);
            state.injectedServices = true;
        }

        if (!state.injectedContacts && block.type === 'messenger') {
            hydrateMessengerBlock(block, parsedContacts, userInfo.contacts);
            state.injectedContacts = true;
        } else if (!state.injectedContacts && block.type === 'form') {
            (block as any).title = 'Оставить заявку';
            state.injectedContacts = true;
        }

        if (!state.injectedSocials && block.type === 'socials') {
            hydrateSocialsBlock(block, parsedSocials, userInfo.socials);
            state.injectedSocials = true;
        }
    }

    // 4. Smart Fallbacks (Appending missing crucial blocks)
    if ((userInfo.name || userInfo.bio) && !state.injectedProfile) {
        const profileBlock = createBlock('profile');
        hydrateProfileBlock(profileBlock, userInfo);
        blocks.unshift({ ...profileBlock, id: `profile-fallback-${Date.now()}` } as Block);
    }

    if (!state.injectedServices && parsedServices.length > 0) {
        const catalogBlock = createBlock('catalog') as CatalogBlock;
        catalogBlock.title = 'Каталог услуг';
        hydrateCatalogOrPricingBlock(catalogBlock, parsedServices);
        blocks.push({ ...catalogBlock, id: `catalog-fallback-${Date.now()}` } as Block);
    } else if (!state.injectedServices && userInfo.services) {
        const textBlock = createBlock('text');
        (textBlock as any).content = `**Услуги:**\n${userInfo.services}`;
        blocks.push({ ...textBlock, id: `text-services-${Date.now()}` } as Block);
    }

    if (!state.injectedContacts && (parsedContacts.length > 0 || userInfo.contacts)) {
        const messengerBlock = createBlock('messenger') as MessengerBlock;
        hydrateMessengerBlock(messengerBlock, parsedContacts, userInfo.contacts);
        blocks.push({ ...messengerBlock, id: `messenger-fallback-${Date.now()}` } as Block);
    }

    if (!state.injectedSocials && (parsedSocials.length > 0 || userInfo.socials)) {
        const socialsBlock = createBlock('socials') as SocialsBlock;
        socialsBlock.title = 'Мои соцсети';
        hydrateSocialsBlock(socialsBlock, parsedSocials, userInfo.socials);
        blocks.push({ ...socialsBlock, id: `socials-fallback-${Date.now()}` } as Block);
    }

    if (userInfo.mediaLinks) {
        const linkBlock = createBlock('link');
        (linkBlock as any).title = 'Мои материалы';
        (linkBlock as any).url = userInfo.mediaLinks;
        blocks.push({ ...linkBlock, id: `link-media-${Date.now()}` } as Block);
    }

    return blocks;
}
