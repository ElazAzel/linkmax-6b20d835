/**
 * What an agent may put on a page. Mirrors src/types/blocks; only fields an
 * agent can fill without uploads or backend records are listed. Text fields
 * accept a plain string or a {ru, en, kk, ...} object.
 */
export type BlockSize = 'small' | 'wide' | 'tall' | 'large';

export interface CatalogEntry {
  type: string;
  purpose: string;
  required: string[];
  fields: Record<string, string>;
  /** Paths of text a visitor reads; arrays use [] (items[].question). */
  translatable: string[];
  default_size: BlockSize;
  example: Record<string, unknown>;
}

const TEXT = 'text: string or {ru, en, kk, ...}';

export const BLOCK_CATALOG: CatalogEntry[] = [
  {
    type: 'profile',
    purpose: 'Page header: photo, name, short bio. Exactly one per page, first. Publishing needs it.',
    required: ['name'],
    fields: { name: TEXT, bio: TEXT, avatar: 'image URL', coverImage: 'wide image URL (used for share previews)', verified: 'boolean' },
    translatable: ['name', 'bio'],
    default_size: 'wide',
    example: { type: 'profile', name: 'Айгерим Нуртаева', bio: { ru: 'Маникюр и брови в Алматы', en: 'Nails and brows in Almaty' } },
  },
  {
    type: 'button',
    purpose: 'Main call to action (book, write, buy). Use 1-2 per page.',
    required: ['title', 'url'],
    fields: { title: TEXT, url: 'https://… or tel:/mailto:', width: 'full | medium | small' },
    translatable: ['title'],
    default_size: 'wide',
    example: { type: 'button', title: 'Записаться', url: 'https://wa.me/77001234567' },
  },
  {
    type: 'link',
    purpose: 'A secondary link with a title.',
    required: ['title', 'url'],
    fields: { title: TEXT, url: 'https://…' },
    translatable: ['title'],
    default_size: 'small',
    example: { type: 'link', title: 'Портфолио', url: 'https://behance.net/name' },
  },
  {
    type: 'text',
    purpose: 'Heading or paragraph.',
    required: ['content'],
    fields: { content: TEXT, style: 'heading | paragraph | quote', alignment: 'left | center | right' },
    translatable: ['content'],
    default_size: 'wide',
    example: { type: 'text', style: 'heading', content: 'Услуги' },
  },
  {
    type: 'card',
    purpose: 'Title, text, photo and one button: an offer, a case, a service.',
    required: ['title'],
    fields: { title: TEXT, text: TEXT, image: 'image URL', imagePosition: 'right | top', buttonText: TEXT, url: 'https://…' },
    translatable: ['title', 'text', 'buttonText'],
    default_size: 'wide',
    example: { type: 'card', title: 'Маникюр с покрытием', text: '1,5 часа, стерильные инструменты', buttonText: 'Записаться', url: 'https://wa.me/77001234567' },
  },
  {
    type: 'image',
    purpose: 'One photo with optional caption and link.',
    required: ['url', 'alt'],
    fields: { url: 'image URL', alt: TEXT, caption: TEXT, link: 'https://…' },
    translatable: ['alt', 'caption'],
    default_size: 'small',
    example: { type: 'image', url: 'https://…/work.jpg', alt: 'Работа: френч' },
  },
  {
    type: 'carousel',
    purpose: 'Swipeable photos.',
    required: ['images'],
    fields: { title: TEXT, images: 'array of {url, alt: text, link?}' },
    translatable: ['title', 'images[].alt'],
    default_size: 'wide',
    example: { type: 'carousel', images: [{ url: 'https://…/1.jpg', alt: 'Работа 1' }] },
  },
  {
    type: 'tiles',
    purpose: 'Grid of picture tiles, each a link with a caption.',
    required: ['items'],
    fields: { title: TEXT, items: 'array of {title: text, image, url}', columns: '2 | 3' },
    translatable: ['title', 'items[].title'],
    default_size: 'wide',
    example: { type: 'tiles', items: [{ title: 'Кейс 1', image: 'https://…/1.jpg', url: 'https://…' }] },
  },
  {
    type: 'video',
    purpose: 'YouTube or Vimeo video.',
    required: ['url', 'platform'],
    fields: { title: TEXT, url: 'video URL', platform: 'youtube | vimeo' },
    translatable: ['title'],
    default_size: 'wide',
    example: { type: 'video', url: 'https://youtu.be/xxxx', platform: 'youtube', title: 'Обо мне' },
  },
  {
    type: 'socials',
    purpose: 'Row of social network icons.',
    required: ['platforms'],
    fields: { title: TEXT, platforms: 'array of {platform: instagram | telegram | tiktok | youtube | linkedin | facebook | x | threads | vk, url}' },
    translatable: ['title'],
    default_size: 'wide',
    example: { type: 'socials', platforms: [{ platform: 'instagram', url: 'https://instagram.com/name' }] },
  },
  {
    type: 'messenger',
    purpose: 'Write-me buttons for WhatsApp / Telegram. The fastest way to get leads.',
    required: ['messengers'],
    fields: { title: TEXT, messengers: 'array of {platform: whatsapp | telegram | viber, username: phone digits or @handle, message?: prefilled text}' },
    translatable: ['title'],
    default_size: 'wide',
    example: { type: 'messenger', messengers: [{ platform: 'whatsapp', username: '77001234567' }] },
  },
  {
    type: 'pricing',
    purpose: 'Price list of services.',
    required: ['items'],
    fields: { title: TEXT, currency: 'KZT | RUB | USD | …', items: 'array of {name: text, description?: text, price: number, period?: text, duration?: minutes, priceType?: fixed | from | range}' },
    translatable: ['title', 'items[].name', 'items[].description', 'items[].period'],
    default_size: 'wide',
    example: { type: 'pricing', currency: 'KZT', items: [{ name: 'Маникюр', price: 8000, duration: 90 }] },
  },
  {
    type: 'product',
    purpose: 'One product with price and buy link.',
    required: ['name', 'price', 'currency'],
    fields: { name: TEXT, description: TEXT, price: 'number', currency: 'KZT | RUB | USD | …', image: 'image URL', buyLink: 'https://…', buttonText: TEXT },
    translatable: ['name', 'description', 'buttonText'],
    default_size: 'small',
    example: { type: 'product', name: 'Гайд по уходу', description: 'PDF, 20 страниц', price: 3000, currency: 'KZT' },
  },
  {
    type: 'catalog',
    purpose: 'List or grid of items with prices.',
    required: ['items'],
    fields: { title: TEXT, currency: 'KZT | …', layout: 'list | grid', items: 'array of {name: text, description?: text, price?: number, image?}' },
    translatable: ['title', 'items[].name', 'items[].description'],
    default_size: 'wide',
    example: { type: 'catalog', items: [{ name: 'Свеча «Лес»', price: 6500 }] },
  },
  {
    type: 'faq',
    purpose: 'Questions and answers. Good for search engines and AI assistants.',
    required: ['items'],
    fields: { title: TEXT, items: 'array of {question: text, answer: text}' },
    translatable: ['title', 'items[].question', 'items[].answer'],
    default_size: 'wide',
    example: { type: 'faq', items: [{ question: 'Сколько длится процедура?', answer: 'Около полутора часов.' }] },
  },
  {
    type: 'testimonial',
    purpose: 'Client reviews. Use only real reviews the owner provided.',
    required: ['testimonials'],
    fields: { title: TEXT, testimonials: 'array of {name: text, text: text, role?: text, rating?: 1-5}' },
    translatable: ['title', 'testimonials[].name', 'testimonials[].text', 'testimonials[].role'],
    default_size: 'wide',
    example: { type: 'testimonial', testimonials: [{ name: 'Дана', text: 'Держится три недели!' }] },
  },
  {
    type: 'form',
    purpose: 'Lead form; submissions arrive as leads.',
    required: ['title', 'fields', 'buttonText'],
    fields: { title: TEXT, buttonText: TEXT, fields: 'array of {name: text, type: text | email | phone | textarea, required: boolean, placeholder?: text}' },
    translatable: ['title', 'buttonText', 'fields[].name', 'fields[].placeholder'],
    default_size: 'wide',
    example: { type: 'form', title: 'Оставьте заявку', buttonText: 'Отправить', fields: [{ name: 'Имя', type: 'text', required: true }, { name: 'Телефон', type: 'phone', required: true }] },
  },
  {
    type: 'map',
    purpose: 'Address on a map.',
    required: ['address'],
    fields: { address: TEXT },
    translatable: ['address'],
    default_size: 'wide',
    example: { type: 'map', address: 'Алматы, ул. Абая 10' },
  },
  {
    type: 'countdown',
    purpose: 'Timer to a date (launch, sale, event).',
    required: ['targetDate'],
    fields: { title: TEXT, targetDate: 'ISO date', expiredText: TEXT },
    translatable: ['title', 'expiredText'],
    default_size: 'wide',
    example: { type: 'countdown', title: 'Старт курса', targetDate: '2026-12-01T10:00:00+05:00' },
  },
  {
    type: 'separator',
    purpose: 'Visual divider between sections.',
    required: [],
    fields: { variant: 'solid | dashed | dotted | gradient' },
    translatable: [],
    default_size: 'wide',
    example: { type: 'separator' },
  },
];

const BY_TYPE = new Map(BLOCK_CATALOG.map((entry) => [entry.type, entry]));

export function catalogEntry(type: string): CatalogEntry | undefined {
  return BY_TYPE.get(type);
}

/** Text paths to translate for any block type, including types an agent cannot create. */
const EXTRA_TRANSLATABLE: Record<string, string[]> = {
  avatar: ['name', 'subtitle'],
  before_after: ['title', 'beforeLabel', 'afterLabel'],
  newsletter: ['title', 'description', 'buttonText'],
  download: ['title', 'description', 'buttonText'],
  booking: ['title', 'description'],
  event: ['title', 'description'],
  scratch: ['title', 'revealText'],
  community: ['title', 'description'],
};

export function translatablePaths(type: string): string[] {
  return BY_TYPE.get(type)?.translatable ?? EXTRA_TRANSLATABLE[type] ?? ['title', 'description'];
}

export const BLOCK_SIZES: BlockSize[] = ['small', 'wide', 'tall', 'large'];
