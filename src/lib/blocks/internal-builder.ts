import { createBlock } from './block-factory';
import type { Block } from '@/types/page';

interface UserInfo {
    name: string;
    bio: string;
    contacts: string;
    services: string;
    socials: string;
    mediaLinks: string;
}

/**
 * Deterministically hydration algorithm that replaces the LLM generation.
 * It takes a database template and user input, injecting the input into appropriate
 * blocks, or appending new blocks if the template lacks suitable targets.
 */
export function generateBlocksFromTemplate(
    templateBlocks: any[],
    userInfo: UserInfo
): Block[] {
    // 1. Start with raw template blocks, converting them to properly formatted Blocks.
    //    (Assuming they just need to be cast, or run through block-factory if missing IDs)
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

    // Keep track of what we've injected to avoid duplicates or miss injections
    let injectedServices = false;
    let injectedContacts = false;
    let injectedSocials = false;

    // 2. Iterate through existing blocks to inject data where it makes sense
    for (const block of blocks) {
        // Inject Services
        if (userInfo.services && !injectedServices) {
            if (block.type === 'pricing' || block.type === 'catalog') {
                const anyBlock = block as any;
                anyBlock.title = 'Мои услуги';
                if (anyBlock.items && anyBlock.items.length > 0) {
                    anyBlock.items[0].description = userInfo.services.slice(0, 100); // Simplistic injection
                }
                injectedServices = true;
            } else if (block.type === 'text' && !injectedServices) {
                // Find the first text block to inject services if no generic pricing exists
                (block as any).content = `**Услуги:**\n${userInfo.services}`;
                injectedServices = true;
            }
        }

        // Inject Contacts
        if (userInfo.contacts && !injectedContacts) {
            if (block.type === 'messenger') {
                const msgBlock = block as any;
                msgBlock.title = 'Связаться со мной';
                // Assume user provided a phone number or handle in contacts.
                if (msgBlock.messengers && msgBlock.messengers.length > 0) {
                    msgBlock.messengers[0].username = userInfo.contacts;
                }
                injectedContacts = true;
            } else if (block.type === 'form') {
                (block as any).title = 'Оставить заявку';
                injectedContacts = true; // Just mapping intent to a form
            }
        }

        // Inject Socials
        if (userInfo.socials && !injectedSocials) {
            if (block.type === 'socials') {
                const socBlock = block as any;
                if (socBlock.platforms && socBlock.platforms.length > 0) {
                    socBlock.platforms[0].url = userInfo.socials; // Basic injection into first slot
                }
                injectedSocials = true;
            }
        }
    }

    // 3. Append Fallback Blocks if template was missing necessary structures
    if (userInfo.services && !injectedServices) {
        const textBlock = createBlock('text');
        (textBlock as any).content = `**Услуги:**\n${userInfo.services}`;
        blocks.push({ ...textBlock, id: `text-services-${Date.now()}` } as Block);
    }

    if (userInfo.contacts && !injectedContacts) {
        const messengerBlock = createBlock('messenger');
        (messengerBlock as any).title = 'Связаться со мной';
        if ((messengerBlock as any).messengers && (messengerBlock as any).messengers.length > 0) {
            (messengerBlock as any).messengers[0].username = userInfo.contacts;
        }
        blocks.push({ ...messengerBlock, id: `messenger-contacts-${Date.now()}` } as Block);
    }

    if (userInfo.socials && !injectedSocials) {
        const socialsBlock = createBlock('socials');
        (socialsBlock as any).title = 'Мои соцсети';
        if ((socialsBlock as any).platforms && (socialsBlock as any).platforms.length > 0) {
            (socialsBlock as any).platforms[0].url = userInfo.socials;
        }
        blocks.push({ ...socialsBlock, id: `socials-fallback-${Date.now()}` } as Block);
    }

    if (userInfo.mediaLinks) {
        // Just append a link block
        const linkBlock = createBlock('link');
        (linkBlock as any).title = 'Мои материалы';
        (linkBlock as any).url = userInfo.mediaLinks;
        blocks.push({ ...linkBlock, id: `link-media-${Date.now()}` } as Block);
    }

    return blocks;
}
