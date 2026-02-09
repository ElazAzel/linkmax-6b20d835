import { BlockGridProps } from './base';
import { ProfileBlock, LinkBlock, TextBlock, VideoBlock, CarouselBlock, ImageBlock, AvatarBlock, SeparatorBlock, MapBlock, BeforeAfterBlock, FAQBlock } from './content';
import { ButtonBlock, SocialsBlock, MessengerBlock } from './actions';
import { ProductBlock, CatalogBlock, PricingBlock, BookingBlock } from './commerce';
import { NewsletterBlock, TestimonialBlock, CountdownBlock, ShoutoutBlock } from './marketing';
import { CustomCodeBlock, FormBlock, DownloadBlock, ScratchBlock } from './advanced';
import { CommunityBlock, EventBlock } from './community';

export * from './base';
export * from './content';
export * from './actions';
export * from './commerce';
export * from './marketing';
export * from './advanced';
export * from './community';

export type Block = (
    | ProfileBlock
    | LinkBlock
    | ButtonBlock
    | SocialsBlock
    | TextBlock
    | ImageBlock
    | ProductBlock
    | VideoBlock
    | CarouselBlock
    | CustomCodeBlock
    | MessengerBlock
    | FormBlock
    | DownloadBlock
    | NewsletterBlock
    | TestimonialBlock
    | ScratchBlock
    | MapBlock
    | AvatarBlock
    | SeparatorBlock
    | CatalogBlock
    | BeforeAfterBlock
    | FAQBlock
    | CountdownBlock
    | PricingBlock
    | ShoutoutBlock
    | BookingBlock
    | CommunityBlock
    | EventBlock
) & BlockGridProps;
