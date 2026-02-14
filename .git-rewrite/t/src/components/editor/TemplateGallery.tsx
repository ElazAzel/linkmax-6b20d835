import { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Sparkles, Store, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createBlock as createBaseBlock } from '@/lib/block-factory';
import type { Block } from '@/types/page';
import { TemplatePersonalization } from './TemplatePersonalization';
import { TemplateMarketplace } from './TemplateMarketplace';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  isPremium?: boolean;
  blocks: Array<{ type: string; overrides?: Record<string, unknown> }>;
}

// Helper to create template block with overrides
const createTemplateBlock = (type: string, overrides: Record<string, unknown> = {}): Block => {
  const baseBlock = createBaseBlock(type);
  return { ...baseBlock, ...overrides } as Block;
};

// Placeholder images from Unsplash (free to use)
const PLACEHOLDER_IMAGES = {
  barber: [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
  ],
  food: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1482049016gy4e-1c99c8f0b46a?w=800&h=600&fit=crop',
  ],
  photo: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
  ],
  realestate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  ],
};

const TEMPLATES: Template[] = [
  // ===== КРЕАТОРЫ =====
  {
    id: 'influencer',
    name: 'Блогер / Инфлюенсер',
    description: 'Для контент-мейкеров и блогеров — полный набор',
    category: 'Креаторы',
    preview: '👤',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Алина Lifestyle', en: 'Alina Lifestyle', kk: 'Алина Lifestyle' }, bio: { ru: '✨ Блогер • 500K подписчиков\n🎥 Влоги о путешествиях и моде\n📍 Алматы → Мир', en: '✨ Blogger • 500K followers\n🎥 Travel & fashion vlogs\n📍 Almaty → World', kk: '✨ Блогер • 500K жазылушы\n🎥 Саяхат және сән влогтары\n📍 Алматы → Әлем' } } },
      { type: 'countdown', overrides: { title: { ru: '🔥 Новый влог через:', en: '🔥 New vlog in:', kk: '🔥 Жаңа влог:' }, endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), style: 'modern' } },
      { type: 'link', overrides: { title: { ru: '🎬 YouTube — новые влоги каждую неделю', en: '🎬 YouTube — new vlogs weekly', kk: '🎬 YouTube — жаңа влогтар апта сайын' }, url: 'https://youtube.com/@example', icon: 'youtube', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '📸 Instagram — бэкстейдж и stories', en: '📸 Instagram — backstage & stories', kk: '📸 Instagram — бэкстейдж және stories' }, url: 'https://instagram.com/example', icon: 'instagram', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '🎵 TikTok — короткие видео', en: '🎵 TikTok — short videos', kk: '🎵 TikTok — қысқа бейнелер' }, url: 'https://tiktok.com/@example', icon: 'globe', style: 'rounded' } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🔥 Последний влог: Дубай 2024', en: '🔥 Latest vlog: Dubai 2024', kk: '🔥 Соңғы влог: Дубай 2024' } } },
      { type: 'text', overrides: { content: { ru: '💼 Сотрудничество', en: '💼 Collaboration', kk: '💼 Ынтымақтастық' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Реклама в сторис', en: 'Story ad placement', kk: 'Stories-те жарнама' }, description: { ru: '24 часа в сторис + отметка + свайп', en: '24h story + mention + swipe up', kk: '24 сағат stories + белгі + свайп' }, price: 150000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Интеграция в YouTube', en: 'YouTube integration', kk: 'YouTube интеграциясы' }, description: { ru: 'Упоминание + демонстрация продукта', en: 'Mention + product demonstration', kk: 'Атап өту + өнімді көрсету' }, price: 350000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Амбассадорство', en: 'Ambassador package', kk: 'Амбассадорлық' }, description: { ru: '3 месяца • 12 постов • эксклюзив', en: '3 months • 12 posts • exclusive', kk: '3 ай • 12 пост • эксклюзив' }, price: 1500000, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'L\'Oreal Kazakhstan', en: 'L\'Oreal Kazakhstan', kk: 'L\'Oreal Kazakhstan' }, role: { ru: 'Бренд-партнёр', en: 'Brand partner', kk: 'Бренд-серіктес' }, text: { ru: 'Алина — идеальный партнёр для beauty-кампаний. Высокий engagement и качественный контент!', en: 'Alina is the perfect partner for beauty campaigns. High engagement and quality content!', kk: 'Алина — beauty-кампаниялар үшін тамаша серіктес. Жоғары қатысу және сапалы контент!' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Какой формат рекламы лучше?', en: 'What ad format is best?', kk: 'Қай жарнама форматы жақсы?' }, answer: { ru: 'Зависит от ваших целей. Stories — для охвата, YouTube — для глубокого вовлечения. Напишите, обсудим!', en: 'Depends on your goals. Stories for reach, YouTube for deep engagement. Write me, let\'s discuss!', kk: 'Мақсаттарыңызға байланысты. Stories — қамту үшін, YouTube — терең қатысу үшін. Жазыңыз, талқылайық!' } }, { question: { ru: 'Сколько времени на подготовку?', en: 'How much time to prepare?', kk: 'Дайындық қанша уақыт алады?' }, answer: { ru: 'Обычно 3-5 дней. Для сложных интеграций — до 2 недель.', en: 'Usually 3-5 days. For complex integrations — up to 2 weeks.', kk: 'Әдетте 3-5 күн. Күрделі интеграциялар үшін — 2 аптаға дейін.' } }] } },
      { type: 'socials', overrides: { platforms: [{ platform: 'telegram', url: 'https://t.me/example' }, { platform: 'youtube', url: 'https://youtube.com/@example' }, { platform: 'instagram', url: 'https://instagram.com/example' }, { platform: 'tiktok', url: 'https://tiktok.com/@example' }] } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'alina_manager' }, { platform: 'email', username: 'collab@alina.kz' }] } },
    ],
  },
  {
    id: 'musician',
    name: 'Музыкант / Артист',
    description: 'Для музыкантов и исполнителей — концерты, музыка, мерч',
    category: 'Креаторы',
    preview: '🎵',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'ARMAN', en: 'ARMAN', kk: 'ARMAN' }, bio: { ru: '🎤 Хип-хоп артист\n🏆 Лучший альбом 2023\n🎧 5M+ прослушиваний', en: '🎤 Hip-hop artist\n🏆 Best Album 2023\n🎧 5M+ streams', kk: '🎤 Хип-хоп әртіс\n🏆 2023 үздік альбом\n🎧 5M+ тыңдау' } } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🔥 Премьера клипа "Жизнь"', en: '🔥 Music video premiere "Life"', kk: '🔥 "Өмір" клипінің премьерасы' } } },
      { type: 'text', overrides: { content: { ru: '🎧 Слушать музыку', en: '🎧 Listen to music', kk: '🎧 Музыка тыңдау' }, style: 'heading', alignment: 'center' } },
      { type: 'link', overrides: { title: { ru: '🎧 Spotify — слушать новый альбом', en: '🎧 Spotify — listen new album', kk: '🎧 Spotify — жаңа альбомды тыңдау' }, url: 'https://open.spotify.com/artist/example', icon: 'globe', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '🍎 Apple Music', en: '🍎 Apple Music', kk: '🍎 Apple Music' }, url: 'https://music.apple.com/artist/example', icon: 'globe', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '🎬 YouTube Music', en: '🎬 YouTube Music', kk: '🎬 YouTube Music' }, url: 'https://music.youtube.com/channel/example', icon: 'youtube', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '📲 Яндекс Музыка', en: '📲 Yandex Music', kk: '📲 Яндекс Музыка' }, url: 'https://music.yandex.ru/artist/example', icon: 'globe', style: 'pill' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '📅 Ближайшие концерты', en: '📅 Upcoming concerts', kk: '📅 Жақын концерттер' }, style: 'heading', alignment: 'center' } },
      { type: 'countdown', overrides: { title: { ru: '🎤 Большой концерт в Алматы', en: '🎤 Big concert in Almaty', kk: '🎤 Алматыдағы үлкен концерт' }, endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), style: 'modern' } },
      { type: 'product', overrides: { name: { ru: '🎫 Алматы — 15 марта — Дворец Республики', en: '🎫 Almaty — March 15 — Palace of Republic', kk: '🎫 Алматы — 15 наурыз — Республика сарайы' }, description: { ru: 'VIP + Meet & Greet', en: 'VIP + Meet & Greet', kk: 'VIP + Meet & Greet' }, price: 25000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: '🎫 Астана — 22 марта — Barys Arena', en: '🎫 Astana — March 22 — Barys Arena', kk: '🎫 Астана — 22 наурыз — Barys Arena' }, description: { ru: 'Fan zone + Soundcheck', en: 'Fan zone + Soundcheck', kk: 'Fan zone + Soundcheck' }, price: 15000, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '🛍️ Мерч', en: '🛍️ Merch', kk: '🛍️ Мерч' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Худи "ARMAN TOUR 2024"', en: 'Hoodie "ARMAN TOUR 2024"', kk: 'Худи "ARMAN TOUR 2024"' }, description: { ru: 'Лимитированная коллекция • S-XXL', en: 'Limited edition • S-XXL', kk: 'Лимиттелген коллекция • S-XXL' }, price: 18000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Кепка с автографом', en: 'Signed cap', kk: 'Қол қойылған кепка' }, description: { ru: 'Персональный автограф', en: 'Personal autograph', kk: 'Жеке қол қою' }, price: 8000, currency: 'KZT' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'arman_music' }, { platform: 'instagram', username: 'arman_official' }] } },
    ],
  },
  {
    id: 'designer',
    name: 'Дизайнер / Иллюстратор',
    description: 'Портфолио для творческих специалистов с примерами работ',
    category: 'Креаторы',
    preview: '🎨',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Дария Ким', en: 'Dariya Kim', kk: 'Дария Ким' }, bio: { ru: '🎨 UI/UX дизайнер • 7 лет опыта\n✨ Брендинг • Веб-дизайн • Иллюстрации\n🏆 Behance Featured', en: '🎨 UI/UX designer • 7 years exp\n✨ Branding • Web design • Illustrations\n🏆 Behance Featured', kk: '🎨 UI/UX дизайнер • 7 жыл тәжірибе\n✨ Брендинг • Веб-дизайн • Иллюстрациялар\n🏆 Behance Featured' } } },
      { type: 'text', overrides: { content: { ru: '💬 "Дизайн — это не как выглядит, а как работает"', en: '💬 "Design is not how it looks, but how it works"', kk: '💬 "Дизайн — бұл қалай көрінеді емес, қалай жұмыс істейді"' }, style: 'quote', alignment: 'center' } },
      { type: 'carousel', overrides: { title: { ru: '🖼 Избранные работы', en: '🖼 Featured works', kk: '🖼 Таңдаулы жұмыстар' }, images: [{ url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', alt: 'UI Design' }, { url: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop', alt: 'Branding' }, { url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop', alt: 'Illustration' }] } },
      { type: 'text', overrides: { content: { ru: '💰 Услуги и цены', en: '💰 Services & Prices', kk: '💰 Қызметтер мен бағалар' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Логотип', en: 'Logo', kk: 'Логотип' }, price: 80000, currency: 'KZT', period: { ru: 'проект', en: 'project', kk: 'жоба' }, features: [{ ru: '3 концепции', en: '3 concepts', kk: '3 концепция' }, { ru: 'До 3 правок', en: 'Up to 3 revisions', kk: '3 түзетуге дейін' }, { ru: 'Исходники AI/SVG/PNG', en: 'Source files AI/SVG/PNG', kk: 'AI/SVG/PNG файлдары' }], isPopular: false }, { name: { ru: 'Фирменный стиль', en: 'Brand Identity', kk: 'Фирмалық стиль' }, price: 250000, currency: 'KZT', period: { ru: 'проект', en: 'project', kk: 'жоба' }, features: [{ ru: 'Лого + визитки', en: 'Logo + business cards', kk: 'Лого + визиткалар' }, { ru: 'Брендбук до 20 стр', en: 'Brandbook up to 20 pages', kk: '20 бетке дейін брендбук' }, { ru: 'Соцсети + презентации', en: 'Social media + presentations', kk: 'Соцсети + презентациялар' }], isPopular: true }, { name: { ru: 'Лендинг', en: 'Landing Page', kk: 'Лендинг' }, price: 120000, currency: 'KZT', period: { ru: 'проект', en: 'project', kk: 'жоба' }, features: [{ ru: 'До 5 экранов', en: 'Up to 5 screens', kk: '5 экранға дейін' }, { ru: 'Адаптив Desktop/Mobile', en: 'Desktop/Mobile adaptive', kk: 'Desktop/Mobile адаптив' }, { ru: 'Figma с компонентами', en: 'Figma with components', kk: 'Компоненттермен Figma' }], isPopular: false }] } },
      { type: 'text', overrides: { content: { ru: '🏆 Клиенты', en: '🏆 Clients', kk: '🏆 Клиенттер' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: 'Kaspi.kz • Chocofamily • Glovo KZ • Freedom Finance • Air Astana', en: 'Kaspi.kz • Chocofamily • Glovo KZ • Freedom Finance • Air Astana', kk: 'Kaspi.kz • Chocofamily • Glovo KZ • Freedom Finance • Air Astana' }, style: 'paragraph', alignment: 'center' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Айдана', en: 'Aidana', kk: 'Айдана' }, role: { ru: 'CEO Startup Studio', en: 'CEO Startup Studio', kk: 'CEO Startup Studio' }, text: { ru: 'Дария создала бренд для нашего стартапа с нуля. Профессионально, быстро и с душой. Рекомендую!', en: 'Dariya created a brand for our startup from scratch. Professional, fast and with soul. Recommend!', kk: 'Дария стартапымыз үшін нөлден бренд жасады. Кәсіби, жылдам және жанмен. Ұсынамын!' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '🎨 Портфолио на Behance', en: '🎨 Portfolio on Behance', kk: '🎨 Behance портфолиосы' }, url: 'https://behance.net/dariyakim', icon: 'globe', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '📱 Работы в Dribbble', en: '📱 Works on Dribbble', kk: '📱 Dribbble жұмыстары' }, url: 'https://dribbble.com/dariyakim', icon: 'globe', style: 'rounded' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'dariya_design' }, { platform: 'whatsapp', username: '+77001234567' }] } },
    ],
  },
  {
    id: 'streamer',
    name: 'Стример / Геймер',
    description: 'Для стримеров и киберспортсменов',
    category: 'Креаторы',
    preview: '🎮',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'DarkNight', en: 'DarkNight', kk: 'DarkNight' }, bio: { ru: '🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримы: ПН-ПТ 20:00', en: '🎮 Twitch Partner • 100K followers\n🏆 CS2 • Valorant • GTA RP\n⏰ Streams: MON-FRI 8PM', kk: '🎮 Twitch Partner • 100K жазылушы\n🏆 CS2 • Valorant • GTA RP\n⏰ Стримдер: ДС-ЖМ 20:00' } } },
      { type: 'countdown', overrides: { title: { ru: '⏰ Следующий стрим через:', en: '⏰ Next stream in:', kk: '⏰ Келесі стрим:' }, endDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), style: 'modern' } },
      { type: 'link', overrides: { title: { ru: '🟣 Twitch — смотреть стрим LIVE', en: '🟣 Twitch — watch stream LIVE', kk: '🟣 Twitch — LIVE стримді қарау' }, url: 'https://twitch.tv/darknight', icon: 'globe', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '🔴 YouTube — нарезки и хайлайты', en: '🔴 YouTube — clips & highlights', kk: '🔴 YouTube — үзінділер мен хайлайттар' }, url: 'https://youtube.com/@darknight', icon: 'youtube', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '💬 Discord — сообщество (5000+ участников)', en: '💬 Discord — community (5000+ members)', kk: '💬 Discord — қауымдастық (5000+ қатысушы)' }, url: 'https://discord.gg/darknight', icon: 'globe', style: 'pill' } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🔥 Лучший момент недели — ACE на Inferno', en: '🔥 Best moment — ACE on Inferno', kk: '🔥 Аптаның үздік сәті — Inferno-да ACE' } } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '💎 Поддержать стримера', en: '💎 Support streamer', kk: '💎 Стримерді қолдау' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Подписка Tier 1', en: 'Tier 1 Subscription', kk: 'Tier 1 жазылым' }, description: { ru: 'Эмоуты + без рекламы + значок', en: 'Emotes + ad-free + badge', kk: 'Эмоуттар + жарнамасыз + белгі' }, price: 2500, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Подписка Tier 2', en: 'Tier 2 Subscription', kk: 'Tier 2 жазылым' }, description: { ru: 'Всё из Tier 1 + эксклюзив Discord', en: 'All from Tier 1 + exclusive Discord', kk: 'Tier 1 бәрі + эксклюзив Discord' }, price: 5000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Донат (любая сумма)', en: 'Donation (any amount)', kk: 'Донат (кез-келген сома)' }, description: { ru: 'Сообщение на стриме + благодарность', en: 'Message on stream + thanks', kk: 'Стримде хабарлама + алғыс' }, price: 500, currency: 'KZT' } },
      { type: 'text', overrides: { content: { ru: '📅 Расписание стримов', en: '📅 Stream schedule', kk: '📅 Стрим кестесі' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: 'ПН-ПТ: 20:00 — CS2 / Valorant\nСБ: 18:00 — GTA RP (специальный эфир)\nВС: выходной', en: 'MON-FRI: 8PM — CS2 / Valorant\nSAT: 6PM — GTA RP (special stream)\nSUN: day off', kk: 'ДС-ЖМ: 20:00 — CS2 / Valorant\nСБ: 18:00 — GTA RP (арнайы эфир)\nЖС: демалыс' }, style: 'paragraph', alignment: 'center' } },
      { type: 'socials', overrides: { platforms: [{ platform: 'telegram', url: 'https://t.me/darknight_chat' }, { platform: 'tiktok', url: 'https://tiktok.com/@darknight' }, { platform: 'twitter', url: 'https://twitter.com/darknight' }] } },
    ],
  },

  // ===== БИЗНЕС =====
  {
    id: 'barber',
    name: 'Барбершоп',
    description: 'Полный шаблон для барберов — прайс, галерея, запись',
    category: 'Бизнес',
    preview: '💈',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'BLACKBEARD Barbershop', en: 'BLACKBEARD Barbershop', kk: 'BLACKBEARD Barbershop' }, bio: { ru: '✂️ Мужские стрижки в центре Алматы\n🏆 Лучший барбершоп 2023 по версии 2GIS\n⭐ 4.9 рейтинг • 500+ отзывов', en: '✂️ Men\'s haircuts in Almaty center\n🏆 Best barbershop 2023 by 2GIS\n⭐ 4.9 rating • 500+ reviews', kk: '✂️ Алматы орталығында ерлер шаш қию\n🏆 2GIS бойынша 2023 үздік барбершоп\n⭐ 4.9 рейтинг • 500+ пікір' } } },
      { type: 'text', overrides: { content: { ru: '⏰ Режим работы: Пн-Вс 10:00 - 21:00', en: '⏰ Working hours: Mon-Sun 10:00 - 21:00', kk: '⏰ Жұмыс уақыты: Дс-Жс 10:00 - 21:00' }, style: 'paragraph', alignment: 'center' } },
      { type: 'link', overrides: { title: { ru: '📅 ЗАПИСАТЬСЯ ОНЛАЙН', en: '📅 BOOK ONLINE', kk: '📅 ОНЛАЙН ЖАЗЫЛУ' }, url: 'https://dikidi.net/blackbeard', icon: 'calendar', style: 'pill' } },
      { type: 'carousel', overrides: { title: { ru: '💈 Наши работы', en: '💈 Our works', kk: '💈 Біздің жұмыстар' }, images: [{ url: PLACEHOLDER_IMAGES.barber[0], alt: 'Haircut 1' }, { url: PLACEHOLDER_IMAGES.barber[1], alt: 'Haircut 2' }, { url: PLACEHOLDER_IMAGES.barber[2], alt: 'Haircut 3' }] } },
      { type: 'text', overrides: { content: { ru: '💰 Прайс-лист', en: '💰 Price list', kk: '💰 Бағалар тізімі' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Мужская стрижка', en: 'Men\'s haircut', kk: 'Ерлер шаш қию' }, description: { ru: 'Стрижка машинкой/ножницами + укладка + стайлинг', en: 'Clipper/scissors cut + styling', kk: 'Машинкамен/қайшымен қию + сәндеу' }, price: 4000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Стрижка + Борода', en: 'Haircut + Beard', kk: 'Шаш қию + Сақал' }, description: { ru: 'Комплекс: стрижка + моделирование бороды + уход', en: 'Complex: haircut + beard shaping + care', kk: 'Кешен: шаш қию + сақал пішіндеу + күтім' }, price: 6500, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Королевское бритье', en: 'Royal shave', kk: 'Патшалық қырыну' }, description: { ru: 'Горячее полотенце + опасная бритва + уход', en: 'Hot towel + straight razor + care', kk: 'Ыстық сүлгі + қауіпті ұстара + күтім' }, price: 5000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Детская стрижка', en: 'Kids haircut', kk: 'Балалар шаш қию' }, description: { ru: 'До 12 лет • Мультики на экране', en: 'Up to 12 years • Cartoons on screen', kk: '12 жасқа дейін • Экранда мультфильмдер' }, price: 3000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Окрашивание', en: 'Hair coloring', kk: 'Шаш бояу' }, description: { ru: 'Камуфляж седины или креативное окрашивание', en: 'Gray camouflage or creative coloring', kk: 'Ақ шашты жасыру немесе шығармашылық бояу' }, price: 4500, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '👨‍🔧 Наши барберы', en: '👨‍🔧 Our barbers', kk: '👨‍🔧 Біздің барберлер' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '🧔 Арман — топ-барбер, 8 лет опыта\n🧔 Данияр — специалист по бородам\n🧔 Ерлан — детские стрижки', en: '🧔 Arman — top barber, 8 years exp\n🧔 Daniyar — beard specialist\n🧔 Yerlan — kids haircuts', kk: '🧔 Арман — топ-барбер, 8 жыл тәжірибе\n🧔 Данияр — сақал маманы\n🧔 Ерлан — балалар шаш қию' }, style: 'paragraph', alignment: 'left' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Алексей', en: 'Alexey', kk: 'Алексей' }, role: { ru: 'Постоянный клиент', en: 'Regular client', kk: 'Тұрақты клиент' }, text: { ru: 'Хожу только сюда уже 2 года. Лучшие барберы в городе, всегда чётко и по делу. Рекомендую!', en: 'Been coming here for 2 years. Best barbers in town, always on point. Recommend!', kk: '2 жыл бойы тек мұнда келемін. Қалада ең жақсы барберлер, әрқашан дәл. Ұсынамын!' }, rating: 5 }, { name: { ru: 'Тимур', en: 'Timur', kk: 'Тимур' }, role: { ru: 'Постоянный клиент', en: 'Regular client', kk: 'Тұрақты клиент' }, text: { ru: 'Атмосфера — огонь! Виски, PlayStation, крутые ребята. Не барбершоп, а мужской клуб.', en: 'Atmosphere is fire! Whiskey, PlayStation, cool guys. Not a barbershop, but a men\'s club.', kk: 'Атмосфера — өте керемет! Виски, PlayStation, керемет жігіттер. Барбершоп емес, ерлер клубы.' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Нужна ли предварительная запись?', en: 'Do I need to book in advance?', kk: 'Алдын ала жазылу керек пе?' }, answer: { ru: 'Рекомендуем записаться онлайн или позвонить. В выходные — обязательно!', en: 'We recommend booking online or calling. On weekends — mandatory!', kk: 'Онлайн жазылуды немесе қоңырау шалуды ұсынамыз. Демалыс күндері — міндетті!' } }, { question: { ru: 'Есть ли парковка?', en: 'Is there parking?', kk: 'Тұрақ бар ма?' }, answer: { ru: 'Да, бесплатная парковка во дворе и на улице рядом.', en: 'Yes, free parking in the yard and on the street nearby.', kk: 'Иә, ауладa және жақын көшеде тегін тұрақ бар.' } }] } },
      { type: 'map', overrides: { address: 'Алматы, ул. Панфилова 100', title: { ru: '📍 Мы здесь', en: '📍 Find us', kk: '📍 Біз мұндамыз' } } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77071234567' }, { platform: 'instagram', username: 'blackbeard.almaty' }, { platform: 'telegram', username: 'blackbeard_book' }] } },
    ],
  },
  {
    id: 'photographer',
    name: 'Фотограф',
    description: 'Полное портфолио — пакеты услуг, галерея, отзывы',
    category: 'Бизнес',
    preview: '📷',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Анна Фото', en: 'Anna Photo', kk: 'Анна Фото' }, bio: { ru: '📸 Профессиональный фотограф\n💍 Свадьбы • Портреты • Love Story\n🏆 10 лет опыта • 500+ свадеб\n📍 Алматы и выезд', en: '📸 Professional photographer\n💍 Weddings • Portraits • Love Story\n🏆 10 years exp • 500+ weddings\n📍 Almaty & travel', kk: '📸 Кәсіби фотограф\n💍 Тойлар • Портреттер • Love Story\n🏆 10 жыл тәжірибе • 500+ той\n📍 Алматы және сапар' } } },
      { type: 'countdown', overrides: { title: { ru: '🎉 Скидка 20% на весенние съёмки до:', en: '🎉 20% off spring shoots until:', kk: '🎉 Көктемгі түсірілімге 20% жеңілдік:' }, endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), style: 'elegant' } },
      { type: 'carousel', overrides: { title: { ru: '📷 Портфолио', en: '📷 Portfolio', kk: '📷 Портфолио' }, images: [{ url: PLACEHOLDER_IMAGES.photo[0], alt: 'Wedding' }, { url: PLACEHOLDER_IMAGES.photo[1], alt: 'Portrait' }, { url: PLACEHOLDER_IMAGES.photo[2], alt: 'Love Story' }] } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🎬 Свадебный фильм Асель и Арман', en: '🎬 Wedding film Assel & Arman', kk: '🎬 Әсел мен Арманның той фильмі' } } },
      { type: 'text', overrides: { content: { ru: '💎 Пакеты услуг', en: '💎 Service packages', kk: '💎 Қызмет пакеттері' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Портрет', en: 'Portrait', kk: 'Портрет' }, price: 35000, currency: 'KZT', period: { ru: 'сессия', en: 'session', kk: 'сессия' }, features: [{ ru: '1.5 часа съёмки', en: '1.5 hours shooting', kk: '1.5 сағат түсіру' }, { ru: '15 фото в ретуши', en: '15 retouched photos', kk: '15 ретушь фото' }, { ru: 'Локация на выбор', en: 'Location of choice', kk: 'Таңдаулы локация' }, { ru: 'Готовность 5 дней', en: 'Ready in 5 days', kk: '5 күнде дайын' }], isPopular: false }, { name: { ru: 'Love Story', en: 'Love Story', kk: 'Love Story' }, price: 50000, currency: 'KZT', period: { ru: 'сессия', en: 'session', kk: 'сессия' }, features: [{ ru: '2 часа съёмки', en: '2 hours shooting', kk: '2 сағат түсіру' }, { ru: '25 фото в ретуши', en: '25 retouched photos', kk: '25 ретушь фото' }, { ru: 'Помощь со стилем', en: 'Styling help', kk: 'Стиль бойынша көмек' }, { ru: 'Слайд-шоу в подарок', en: 'Slideshow as gift', kk: 'Слайд-шоу сыйлық' }], isPopular: true }, { name: { ru: 'Свадьба', en: 'Wedding', kk: 'Той' }, price: 200000, currency: 'KZT', period: { ru: 'день', en: 'day', kk: 'күн' }, features: [{ ru: 'Полный день (до 12ч)', en: 'Full day (up to 12h)', kk: 'Толық күн (12 сағатқа дейін)' }, { ru: '200+ фото в ретуши', en: '200+ retouched photos', kk: '200+ ретушь фото' }, { ru: 'Видео-тизер 1 мин', en: '1 min video teaser', kk: '1 мин видео-тизер' }, { ru: 'Онлайн галерея', en: 'Online gallery', kk: 'Онлайн галерея' }], isPopular: false }] } },
      { type: 'before_after', overrides: { title: { ru: '✨ До / После обработки', en: '✨ Before / After editing', kk: '✨ Өңдеуге дейін / кейін' }, beforeImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=400&fit=crop&sat=-100', afterImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=400&fit=crop' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Асель и Арман', en: 'Assel & Arman', kk: 'Әсел мен Арман' }, role: { ru: 'Свадьба 2024', en: 'Wedding 2024', kk: 'Той 2024' }, text: { ru: 'Анна — волшебница! Фото получились невероятными, все гости в восторге. Через 3 года пересматриваем и плачем от счастья!', en: 'Anna is a magician! Photos turned out incredible, all guests were delighted. We look back after 3 years and cry with happiness!', kk: 'Анна — сиқыршы! Фотолар керемет шықты, барлық қонақтар қуанышта. 3 жылдан кейін қарап, бақыттан жыладық!' }, rating: 5 }, { name: { ru: 'Мадина', en: 'Madina', kk: 'Мадина' }, role: { ru: 'Портретная съёмка', en: 'Portrait session', kk: 'Портрет түсіру' }, text: { ru: 'Я всегда стеснялась камеры, но Анна создала такую атмосферу, что я расслабилась и получились лучшие фото в моей жизни!', en: 'I was always camera shy, but Anna created such an atmosphere that I relaxed and got the best photos of my life!', kk: 'Мен әрқашан камерадан ұялатынмын, бірақ Анна мені босаңсытатын атмосфера жасады және өмірімдегі ең жақсы фотолар шықты!' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'За сколько дней бронировать?', en: 'How many days to book in advance?', kk: 'Қанша күн бұрын брондау керек?' }, answer: { ru: 'Портреты — за 3-5 дней, свадьбы — за 1-3 месяца (особенно летом!)', en: 'Portraits — 3-5 days, weddings — 1-3 months (especially summer!)', kk: 'Портреттер — 3-5 күн, тойлар — 1-3 ай (әсіресе жазда!)' } }, { question: { ru: 'Выезжаете за город?', en: 'Do you travel outside the city?', kk: 'Қаладан тыс шығасыз ба?' }, answer: { ru: 'Да! Астана, Шымкент, Караганда и за границу. Трансфер и проживание оплачиваются отдельно.', en: 'Yes! Astana, Shymkent, Karaganda and abroad. Transfer and accommodation paid separately.', kk: 'Иә! Астана, Шымкент, Қарағанды және шет елге. Трансфер мен тұру бөлек төленеді.' } }] } },
      { type: 'link', overrides: { title: { ru: '📅 Проверить доступные даты', en: '📅 Check available dates', kk: '📅 Бос күндерді тексеру' }, url: 'https://calendly.com/anna-photo', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77051234567' }, { platform: 'telegram', username: 'anna_photo' }, { platform: 'instagram', username: 'anna.photo.kz' }] } },
    ],
  },
  {
    id: 'beauty',
    name: 'Салон красоты',
    description: 'Для салонов и бьюти-мастеров — полный прайс с бронированием',
    category: 'Бизнес',
    preview: '💅',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'GLOW Beauty Studio', en: 'GLOW Beauty Studio', kk: 'GLOW Beauty Studio' }, bio: { ru: '✨ Салон красоты премиум-класса\n💅 Маникюр • Брови • Ресницы • Макияж\n⭐ 4.9 рейтинг • 1000+ отзывов\n📍 Алматы, Достык Плаза', en: '✨ Premium beauty salon\n💅 Nails • Brows • Lashes • Makeup\n⭐ 4.9 rating • 1000+ reviews\n📍 Almaty, Dostyk Plaza', kk: '✨ Премиум сұлулық салоны\n💅 Маникюр • Қастар • Кірпіктер • Макияж\n⭐ 4.9 рейтинг • 1000+ пікір\n📍 Алматы, Достық Плаза' } } },
      { type: 'text', overrides: { content: { ru: '⏰ Пн-Вс: 10:00 - 21:00 (без выходных)', en: '⏰ Mon-Sun: 10:00 - 21:00 (no days off)', kk: '⏰ Дс-Жс: 10:00 - 21:00 (демалыссыз)' }, style: 'paragraph', alignment: 'center' } },
      { type: 'link', overrides: { title: { ru: '📅 ЗАПИСАТЬСЯ ОНЛАЙН (свободные окна)', en: '📅 BOOK ONLINE (available slots)', kk: '📅 ОНЛАЙН ЖАЗЫЛУ (бос терезелер)' }, url: 'https://dikidi.net/glow', icon: 'calendar', style: 'pill' } },
      { type: 'carousel', overrides: { title: { ru: '✨ Наши работы', en: '✨ Our works', kk: '✨ Біздің жұмыстар' }, images: [{ url: PLACEHOLDER_IMAGES.beauty[0], alt: 'Nails' }, { url: PLACEHOLDER_IMAGES.beauty[1], alt: 'Makeup' }, { url: PLACEHOLDER_IMAGES.beauty[2], alt: 'Brows' }] } },
      { type: 'text', overrides: { content: { ru: '💅 Маникюр', en: '💅 Manicure', kk: '💅 Маникюр' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Маникюр с покрытием', en: 'Manicure with gel polish', kk: 'Жабынды маникюр' }, description: { ru: 'Комбинированный маникюр + гель-лак + дизайн 2 пальца', en: 'Combined manicure + gel polish + 2 nail design', kk: 'Комбинацияланған маникюр + гель-лак + 2 саусақ дизайны' }, price: 6000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Наращивание ногтей', en: 'Nail extensions', kk: 'Тырнақ ұзарту' }, description: { ru: 'Гель или акрил • Любая длина и форма', en: 'Gel or acrylic • Any length and shape', kk: 'Гель немесе акрил • Кез-келген ұзындық және пішін' }, price: 10000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Комплекс руки + ноги', en: 'Hands + feet combo', kk: 'Қол + аяқ кешені' }, description: { ru: 'Маникюр + педикюр с покрытием • Экономия 15%', en: 'Manicure + pedicure with polish • Save 15%', kk: 'Маникюр + педикюр жабынды • 15% үнемдеу' }, price: 12000, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '👁 Брови и ресницы', en: '👁 Brows & lashes', kk: '👁 Қастар мен кірпіктер' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Архитектура бровей', en: 'Brow architecture', kk: 'Қас архитектурасы' }, description: { ru: 'Коррекция + окрашивание + укладка brow fix', en: 'Correction + coloring + brow fix styling', kk: 'Түзету + бояу + brow fix сәндеу' }, price: 5000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Наращивание ресниц 2D-3D', en: '2D-3D lash extensions', kk: '2D-3D кірпік ұзарту' }, description: { ru: 'Премиум материалы • Держатся до 4 недель', en: 'Premium materials • Lasts up to 4 weeks', kk: 'Премиум материалдар • 4 аптаға дейін сақталады' }, price: 8000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Ламинирование ресниц', en: 'Lash lamination', kk: 'Кірпікті ламинациялау' }, description: { ru: 'Botox + окрашивание + подъём', en: 'Botox + coloring + lift', kk: 'Botox + бояу + көтеру' }, price: 6000, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '💄 Макияж', en: '💄 Makeup', kk: '💄 Макияж' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Дневной макияж', en: 'Day makeup', kk: 'Күндізгі макияж' }, description: { ru: 'Натуральный образ • Стойкие материалы', en: 'Natural look • Long-lasting materials', kk: 'Табиғи бейне • Берік материалдар' }, price: 8000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Вечерний макияж', en: 'Evening makeup', kk: 'Кешкі макияж' }, description: { ru: 'Smoky eyes, стрелки, контуринг', en: 'Smoky eyes, arrows, contouring', kk: 'Smoky eyes, бағдаршамдар, контуринг' }, price: 12000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Свадебный макияж', en: 'Bridal makeup', kk: 'Үйлену макияжы' }, description: { ru: 'Репетиция + макияж в день свадьбы', en: 'Rehearsal + wedding day makeup', kk: 'Репетиция + той күні макияжы' }, price: 25000, currency: 'KZT' } },
      { type: 'before_after', overrides: { title: { ru: '✨ Результаты наращивания', en: '✨ Extension results', kk: '✨ Ұзарту нәтижелері' }, beforeImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=300&fit=crop', afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Айжан', en: 'Aizhan', kk: 'Айжан' }, role: { ru: 'Постоянный клиент', en: 'Regular client', kk: 'Тұрақты клиент' }, text: { ru: 'Хожу в GLOW уже 2 года на маникюр и брови. Девочки — профи, всегда идеальный результат. Люблю!', en: 'I\'ve been going to GLOW for 2 years for manicure and brows. Girls are pros, always perfect result. Love it!', kk: 'GLOW-ға 2 жыл бойы маникюр мен қасқа жүремін. Қыздар — профи, әрқашан тамаша нәтиже. Жақсы көремін!' }, rating: 5 }] } },
      { type: 'map', overrides: { address: 'Алматы, Достык 240, Достык Плаза, 2 этаж' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77001234567' }, { platform: 'instagram', username: 'glow.beauty.almaty' }] } },
    ],
  },
  {
    id: 'fitness',
    name: 'Фитнес-тренер',
    description: 'Для тренеров — программы, результаты, онлайн-курсы',
    category: 'Бизнес',
    preview: '💪',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Артём Fitness', en: 'Artem Fitness', kk: 'Артём Fitness' }, bio: { ru: '💪 Сертифицированный тренер\n🏆 Мастер спорта • 8 лет опыта\n🔥 1000+ клиентов • 50 000 кг сброшено\n📍 World Class Almaty + Онлайн', en: '💪 Certified trainer\n🏆 Master of Sports • 8 years exp\n🔥 1000+ clients • 50,000 kg lost\n📍 World Class Almaty + Online', kk: '💪 Сертификатталған жаттықтырушы\n🏆 Спорт шебері • 8 жыл тәжірибе\n🔥 1000+ клиент • 50 000 кг тасталды\n📍 World Class Almaty + Онлайн' } } },
      { type: 'carousel', overrides: { title: { ru: '🏆 Трансформации клиентов', en: '🏆 Client transformations', kk: '🏆 Клиенттердің трансформациялары' }, images: [{ url: PLACEHOLDER_IMAGES.fitness[0], alt: 'Training' }, { url: PLACEHOLDER_IMAGES.fitness[1], alt: 'Results' }, { url: PLACEHOLDER_IMAGES.fitness[2], alt: 'Workout' }] } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🔥 Тренировка дня: HIIT на 20 минут (сожги 300 ккал)', en: '🔥 Workout of the day: 20 min HIIT (burn 300 cal)', kk: '🔥 Күннің жаттығуы: 20 минуттық HIIT (300 ккал жақ)' } } },
      { type: 'countdown', overrides: { title: { ru: '🎁 Скидка 30% на первый месяц до:', en: '🎁 30% off first month until:', kk: '🎁 Бірінші айға 30% жеңілдік:' }, endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), style: 'modern' } },
      { type: 'text', overrides: { content: { ru: '🏋️ Мои программы', en: '🏋️ My programs', kk: '🏋️ Менің бағдарламаларым' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Разовая', en: 'Single', kk: 'Бір рет' }, price: 10000, currency: 'KZT', period: { ru: 'тренировка', en: 'session', kk: 'жаттығу' }, features: [{ ru: '60 минут', en: '60 minutes', kk: '60 минут' }, { ru: 'Зал или онлайн', en: 'Gym or online', kk: 'Зал немесе онлайн' }, { ru: 'Индивидуальный план', en: 'Individual plan', kk: 'Жеке жоспар' }], isPopular: false }, { name: { ru: 'Абонемент', en: 'Subscription', kk: 'Абонемент' }, price: 64000, currency: 'KZT', period: { ru: '8 тренировок', en: '8 sessions', kk: '8 жаттығу' }, features: [{ ru: 'Экономия 20%', en: 'Save 20%', kk: '20% үнемдеу' }, { ru: 'Действует 2 месяца', en: 'Valid 2 months', kk: '2 ай жарамды' }, { ru: 'План питания', en: 'Meal plan', kk: 'Тамақтану жоспары' }, { ru: 'Чат поддержка 24/7', en: '24/7 chat support', kk: '24/7 чат қолдау' }], isPopular: true }, { name: { ru: 'Онлайн-курс', en: 'Online course', kk: 'Онлайн курс' }, price: 35000, currency: 'KZT', period: { ru: '4 недели', en: '4 weeks', kk: '4 апта' }, features: [{ ru: '20 видео-тренировок', en: '20 video workouts', kk: '20 видео жаттығу' }, { ru: 'Доступ навсегда', en: 'Lifetime access', kk: 'Мәңгілік қатынау' }, { ru: 'Рецепты ПП', en: 'Healthy recipes', kk: 'ДТ рецепттері' }, { ru: 'Проверка формы', en: 'Form check', kk: 'Форманы тексеру' }], isPopular: false }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Мадина', en: 'Madina', kk: 'Мадина' }, role: { ru: '-15 кг за 3 месяца', en: '-15 kg in 3 months', kk: '3 айда -15 кг' }, text: { ru: 'За 3 месяца с Артёмом сбросила 15 кг! Тренировки разнообразные, никогда не скучно. Супер мотиватор! Теперь живу активно и с удовольствием!', en: 'Lost 15 kg in 3 months with Artem! Varied workouts, never boring. Super motivator! Now I live actively and happily!', kk: 'Артёммен 3 айда 15 кг тастадым! Жаттығулар әртүрлі, ешқашан зерікпейсің. Супер мотиватор! Қазір белсенді және қуанышпен өмір сүремін!' }, rating: 5 }, { name: { ru: 'Данияр', en: 'Daniyar', kk: 'Данияр' }, role: { ru: '+8 кг мышц', en: '+8 kg muscle', kk: '+8 кг бұлшықет' }, text: { ru: 'Набрал 8 кг сухой массы за полгода. Артём знает, как правильно нагружать и как восстанавливаться. Результат виден!', en: 'Gained 8 kg lean mass in 6 months. Artem knows how to load properly and recover. Results are visible!', kk: '6 айда 8 кг құрғақ масса алдым. Артём дұрыс жүктеуді және қалпына келуді біледі. Нәтиже көрінеді!' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Подойдёт ли новичку?', en: 'Is it suitable for beginners?', kk: 'Бастаушыларға жарай ма?' }, answer: { ru: 'Конечно! Программа адаптируется под ваш уровень. Начнём с базы и постепенно усложним.', en: 'Of course! The program adapts to your level. We\'ll start with basics and gradually increase difficulty.', kk: 'Әрине! Бағдарлама деңгейіңізге бейімделеді. Негізден бастап біртіндеп күрделендіреміз.' } }, { question: { ru: 'Нужно ли покупать инвентарь?', en: 'Do I need to buy equipment?', kk: 'Құрал-жабдық сатып алу керек пе?' }, answer: { ru: 'Для зала — нет. Для дома достаточно коврика и гантелей (можно бутылки с водой).', en: 'For gym — no. For home, a mat and dumbbells are enough (water bottles work too).', kk: 'Зал үшін — жоқ. Үйге кілем мен гантельдер жеткілікті (су бөтелкелері де болады).' } }] } },
      { type: 'link', overrides: { title: { ru: '📱 Бесплатные тренировки на YouTube', en: '📱 Free workouts on YouTube', kk: '📱 YouTube-та тегін жаттығулар' }, url: 'https://youtube.com/@artem_fitness', icon: 'youtube', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '📅 Записаться на пробную тренировку', en: '📅 Book a trial session', kk: '📅 Сынақ жаттығуға жазылу' }, url: 'https://calendly.com/artem-fit', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77011234567' }, { platform: 'telegram', username: 'artem_fit' }, { platform: 'instagram', username: 'artem.fitness.kz' }] } },
    ],
  },
  {
    id: 'chef',
    name: 'Повар / Кондитер',
    description: 'Для кулинаров — меню, цены, доставка, FAQ',
    category: 'Бизнес',
    preview: '👨‍🍳',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Sweet Dreams', en: 'Sweet Dreams', kk: 'Sweet Dreams' }, bio: { ru: '🍰 Торты и десерты на заказ\n✨ 100% натуральные ингредиенты\n🚗 Доставка по Алматы\n📸 1000+ выполненных заказов', en: '🍰 Custom cakes & desserts\n✨ 100% natural ingredients\n🚗 Delivery in Almaty\n📸 1000+ completed orders', kk: '🍰 Тапсырыс бойынша торттар\n✨ 100% табиғи ингредиенттер\n🚗 Алматы бойынша жеткізу\n📸 1000+ орындалған тапсырыс' } } },
      { type: 'countdown', overrides: { title: { ru: '💐 Заказы на 8 марта принимаем до:', en: '💐 March 8 orders accepted until:', kk: '💐 8 наурызға тапсырыстар:' }, endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), style: 'elegant' } },
      { type: 'carousel', overrides: { title: { ru: '🎂 Наши торты', en: '🎂 Our cakes', kk: '🎂 Біздің торттар' }, images: [{ url: PLACEHOLDER_IMAGES.food[0], alt: 'Cake 1' }, { url: PLACEHOLDER_IMAGES.food[1], alt: 'Cake 2' }] } },
      { type: 'text', overrides: { content: { ru: '🍰 Меню и цены', en: '🍰 Menu & prices', kk: '🍰 Мәзір мен бағалар' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Бенто-торт', en: 'Bento cake', kk: 'Бенто-торт' }, description: { ru: '450 гр • Идеален для двоих • Надпись в подарок • Готовность за 1 день', en: '450g • Perfect for two • Free inscription • Ready in 1 day', kk: '450 гр • Екеуге тамаша • Жазу сыйлық • 1 күнде дайын' }, price: 6000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Торт на заказ (1 кг)', en: 'Custom cake (1 kg)', kk: 'Тапсырыс торт (1 кг)' }, description: { ru: 'Любой дизайн • Начинка на выбор • Срок 2-3 дня', en: 'Any design • Filling of choice • 2-3 days', kk: 'Кез-келген дизайн • Таңдаулы толтырма • 2-3 күн' }, price: 9000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Свадебный торт (от 3 кг)', en: 'Wedding cake (from 3 kg)', kk: 'Үйлену торты (3 кг-нан)' }, description: { ru: 'Многоярусный • Индивидуальный дизайн • Дегустация бесплатно', en: 'Multi-tier • Individual design • Free tasting', kk: 'Көп ярусты • Жеке дизайн • Тегін дегустация' }, price: 12000, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'product', overrides: { name: { ru: 'Капкейки (набор 6 шт)', en: 'Cupcakes (set of 6)', kk: 'Капкейктер (6 дана)' }, description: { ru: 'Разные вкусы • Индивидуальный декор', en: 'Various flavors • Individual decor', kk: 'Түрлі дәмдер • Жеке декор' }, price: 4500, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Макаронс (набор 12 шт)', en: 'Macarons (box of 12)', kk: 'Макаронс (12 дана)' }, description: { ru: 'В подарочной коробке • 6 вкусов', en: 'In gift box • 6 flavors', kk: 'Сыйлық қорапшада • 6 дәм' }, price: 5000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Кейк-попсы (набор 10 шт)', en: 'Cake pops (set of 10)', kk: 'Кейк-попстар (10 дана)' }, description: { ru: 'Идеально для детских праздников', en: 'Perfect for kids parties', kk: 'Балалар мерекелеріне тамаша' }, price: 4000, currency: 'KZT' } },
      { type: 'text', overrides: { content: { ru: '🍫 Начинки', en: '🍫 Fillings', kk: '🍫 Толтырмалар' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• Шоколад-вишня\n• Карамель-орех\n• Ваниль-малина\n• Красный бархат\n• Чизкейк\n• Сникерс', en: '• Chocolate-cherry\n• Caramel-nut\n• Vanilla-raspberry\n• Red velvet\n• Cheesecake\n• Snickers', kk: '• Шоколад-шие\n• Карамель-жаңғақ\n• Ваниль-таңқурай\n• Қызыл барқыт\n• Чизкейк\n• Сникерс' }, style: 'paragraph', alignment: 'center' } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'За сколько дней делать заказ?', en: 'How many days in advance to order?', kk: 'Қанша күн бұрын тапсырыс беру керек?' }, answer: { ru: 'Бенто-торты — за 1 день, торты от 2 кг — за 2-3 дня, свадебные — за неделю', en: 'Bento cakes — 1 day, cakes from 2 kg — 2-3 days, wedding — 1 week', kk: 'Бенто-торттар — 1 күн, 2 кг-нан торттар — 2-3 күн, үйлену — 1 апта' } }, { question: { ru: 'Есть доставка?', en: 'Do you deliver?', kk: 'Жеткізу бар ма?' }, answer: { ru: 'Да! По Алматы от 1000₸ (зависит от района). Самовывоз бесплатно (мкр. Самал).', en: 'Yes! In Almaty from 1000₸ (depends on area). Free pickup (Samal district).', kk: 'Иә! Алматы бойынша 1000₸-ден (ауданға байланысты). Тегін алып кету (Самал ықшамауданы).' } }, { question: { ru: 'Можно без сахара?', en: 'Can you make sugar-free?', kk: 'Қантсыз жасауға бола ма?' }, answer: { ru: 'Да, делаем торты на стевии/эритритоле. Цена +20%.', en: 'Yes, we make cakes with stevia/erythritol. Price +20%.', kk: 'Иә, стевия/эритритолмен торт жасаймыз. Баға +20%.' } }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Асия', en: 'Asiya', kk: 'Әсия' }, role: { ru: 'Заказала свадебный торт', en: 'Ordered wedding cake', kk: 'Үйлену торты тапсырыс берді' }, text: { ru: 'Торт на нашу свадьбу был ИДЕАЛЬНЫМ! Вкусно, красиво, и все гости просили контакты. Спасибо!', en: 'The cake for our wedding was PERFECT! Delicious, beautiful, and all guests asked for contacts. Thank you!', kk: 'Біздің тойға торт ТАМАША болды! Дәмді, әдемі, барлық қонақтар байланыс сұрады. Рахмет!' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '📱 Больше работ в Instagram', en: '📱 More works on Instagram', kk: '📱 Instagram-да көбірек жұмыстар' }, url: 'https://instagram.com/sweetdreams.almaty', icon: 'instagram', style: 'rounded' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77021234567' }, { platform: 'instagram', username: 'sweetdreams.almaty' }] } },
    ],
  },
  {
    id: 'shop',
    name: 'Онлайн-магазин',
    description: 'Мини-витрина товаров с каталогом и доставкой',
    category: 'Бизнес',
    preview: '🛍️',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'TREND Store', en: 'TREND Store', kk: 'TREND Store' }, bio: { ru: '🛍️ Модная одежда из Кореи и Турции\n✈️ Доставка по Казахстану 1-3 дня\n💯 Гарантия качества • Обмен/возврат\n⭐ 5000+ довольных клиентов', en: '🛍️ Fashion from Korea & Turkey\n✈️ Delivery across KZ 1-3 days\n💯 Quality guarantee • Exchange/return\n⭐ 5000+ happy customers', kk: '🛍️ Корея мен Түркиядан сән\n✈️ ҚР бойынша жеткізу 1-3 күн\n💯 Сапа кепілдігі • Ауыстыру/қайтару\n⭐ 5000+ қанағаттанған клиент' } } },
      { type: 'countdown', overrides: { title: { ru: '🔥 SALE -50% на всё до:', en: '🔥 SALE -50% on everything until:', kk: '🔥 SALE бәріне -50%:' }, endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), style: 'bold' } },
      { type: 'carousel', overrides: { title: { ru: '🔥 Новинки', en: '🔥 New arrivals', kk: '🔥 Жаңалықтар' }, images: [] } },
      { type: 'catalog', overrides: { title: { ru: '👗 Каталог', en: '👗 Catalog', kk: '👗 Каталог' }, categories: [{ name: { ru: 'Одежда', en: 'Clothing', kk: 'Киім' }, items: [{ name: { ru: 'Худи Oversize', en: 'Oversize Hoodie', kk: 'Oversize Худи' }, description: { ru: 'Хлопок 100% • S-XL • 5 цветов', en: '100% cotton • S-XL • 5 colors', kk: '100% мақта • S-XL • 5 түс' }, price: 12900 }, { name: { ru: 'Джинсы Wide Leg', en: 'Wide Leg Jeans', kk: 'Wide Leg Джинсы' }, description: { ru: 'Высокая посадка • 25-32', en: 'High waist • 25-32', kk: 'Биік белдік • 25-32' }, price: 15900 }] }, { name: { ru: 'Обувь', en: 'Footwear', kk: 'Аяқ киім' }, items: [{ name: { ru: 'New Balance 530', en: 'New Balance 530', kk: 'New Balance 530' }, description: { ru: 'Оригинал • 36-44', en: 'Original • 36-44', kk: 'Оригинал • 36-44' }, price: 54900 }] }] } },
      { type: 'text', overrides: { content: { ru: '🛒 Хиты продаж', en: '🛒 Bestsellers', kk: '🛒 Сатылым хиттері' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Худи Oversize "SEOUL"', en: 'Oversize Hoodie "SEOUL"', kk: 'Oversize Худи "SEOUL"' }, description: { ru: 'Хлопок 100% • Размеры S-XL • 5 цветов • Унисекс', en: '100% cotton • Sizes S-XL • 5 colors • Unisex', kk: '100% мақта • S-XL өлшемдер • 5 түс • Унисекс' }, price: 12900, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Джинсы Wide Leg', en: 'Wide Leg Jeans', kk: 'Wide Leg Джинсы' }, description: { ru: 'Высокая посадка • Размеры 25-32 • Синий/чёрный', en: 'High waist • Sizes 25-32 • Blue/black', kk: 'Биік белдік • 25-32 өлшемдер • Көк/қара' }, price: 15900, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Кроссовки New Balance 530', en: 'New Balance 530 Sneakers', kk: 'New Balance 530 кроссовкалар' }, description: { ru: 'Оригинал 100% • Размеры 36-44 • Белый/серый', en: 'Original 100% • Sizes 36-44 • White/gray', kk: 'Оригинал 100% • 36-44 өлшемдер • Ақ/сұр' }, price: 54900, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Сумка Tote Bag', en: 'Tote Bag', kk: 'Tote Bag сөмке' }, description: { ru: 'Эко-кожа • Вместительная • 3 цвета', en: 'Eco-leather • Spacious • 3 colors', kk: 'Эко-тері • Сыйымды • 3 түс' }, price: 8900, currency: 'KZT' } },
      { type: 'link', overrides: { title: { ru: '📱 Полный каталог в Instagram', en: '📱 Full catalog on Instagram', kk: '📱 Instagram-да толық каталог' }, url: 'https://instagram.com/trend.store.kz', icon: 'instagram', style: 'rounded' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '🚚 Доставка и оплата', en: '🚚 Delivery & payment', kk: '🚚 Жеткізу мен төлем' }, style: 'heading', alignment: 'center' } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Как оплатить?', en: 'How to pay?', kk: 'Қалай төлеуге болады?' }, answer: { ru: 'Kaspi перевод, Kaspi QR, наличные курьеру, рассрочка Kaspi Red', en: 'Kaspi transfer, Kaspi QR, cash to courier, Kaspi Red installment', kk: 'Kaspi аударым, Kaspi QR, курьерге қолма-қол, Kaspi Red бөліп төлеу' } }, { question: { ru: 'Можно примерить?', en: 'Can I try on?', kk: 'Киіп көруге бола ма?' }, answer: { ru: 'Да! Примерка при курьере бесплатно (Алматы, Астана). Можно взять 2-3 размера.', en: 'Yes! Free fitting with courier (Almaty, Astana). You can take 2-3 sizes.', kk: 'Иә! Курьермен тегін киіп көру (Алматы, Астана). 2-3 өлшем алуға болады.' } }, { question: { ru: 'Сроки доставки?', en: 'Delivery time?', kk: 'Жеткізу уақыты?' }, answer: { ru: 'Алматы — 1 день, Астана — 1-2 дня, регионы — 2-4 дня (Казпочта/СДЭК)', en: 'Almaty — 1 day, Astana — 1-2 days, regions — 2-4 days (Kazpost/CDEK)', kk: 'Алматы — 1 күн, Астана — 1-2 күн, аймақтар — 2-4 күн (Қазпошта/CDEK)' } }, { question: { ru: 'Можно вернуть?', en: 'Can I return?', kk: 'Қайтаруға бола ма?' }, answer: { ru: 'Да, в течение 14 дней при сохранении бирок. Обмен бесплатно.', en: 'Yes, within 14 days with tags preserved. Free exchange.', kk: 'Иә, таңбалар сақталса 14 күн ішінде. Тегін ауыстыру.' } }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Алия', en: 'Aliya', kk: 'Әлия' }, role: { ru: 'Алматы', en: 'Almaty', kk: 'Алматы' }, text: { ru: 'Заказываю уже в 5-й раз! Качество топ, доставка быстрая. Рекомендую всем подругам!', en: 'Ordering for the 5th time! Top quality, fast delivery. Recommend to all friends!', kk: '5-ші рет тапсырыс беремін! Сапасы үздік, жеткізу жылдам. Барлық құрбыларыма ұсынамын!' }, rating: 5 }] } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77771234567' }, { platform: 'telegram', username: 'trend_store_kz' }, { platform: 'instagram', username: 'trend.store.kz' }] } },
    ],
  },

  // ===== НОВЫЕ ШАБЛОНЫ =====
  {
    id: 'realestate',
    name: 'Риелтор',
    description: 'Для агентов недвижимости — объекты, услуги, консультация',
    category: 'Бизнес',
    preview: '🏠',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Айгуль Риелтор', en: 'Aigul Realtor', kk: 'Айгүл Риелтор' }, bio: { ru: '🏠 Риелтор • 10 лет на рынке\n🔑 500+ успешных сделок\n📍 Алматы и пригород\n💼 Купля • Продажа • Аренда', en: '🏠 Realtor • 10 years in market\n🔑 500+ successful deals\n📍 Almaty and suburbs\n💼 Buy • Sell • Rent', kk: '🏠 Риелтор • Нарықта 10 жыл\n🔑 500+ сәтті мәміле\n📍 Алматы және маңы\n💼 Сатып алу • Сату • Жалға беру' } } },
      { type: 'carousel', overrides: { title: { ru: '🏠 Актуальные объекты', en: '🏠 Current listings', kk: '🏠 Өзекті нысандар' }, images: [{ url: PLACEHOLDER_IMAGES.realestate[0], alt: 'Property 1' }, { url: PLACEHOLDER_IMAGES.realestate[1], alt: 'Property 2' }, { url: PLACEHOLDER_IMAGES.realestate[2], alt: 'Property 3' }] } },
      { type: 'text', overrides: { content: { ru: '🔥 Горячие предложения', en: '🔥 Hot deals', kk: '🔥 Ыстық ұсыныстар' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: '3-комн. квартира, Достык', en: '3-room apt, Dostyk', kk: '3 бөлмелі пәтер, Достық' }, description: { ru: '120 м² • 5/12 этаж • Евроремонт • Паркинг', en: '120 m² • 5/12 floor • Euro renovation • Parking', kk: '120 м² • 5/12 қабат • Еуроремонт • Паркинг' }, price: 85000000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: '2-комн. квартира, Алмагуль', en: '2-room apt, Almagul', kk: '2 бөлмелі пәтер, Алмагүл' }, description: { ru: '75 м² • 3/9 этаж • Свежий ремонт', en: '75 m² • 3/9 floor • Fresh renovation', kk: '75 м² • 3/9 қабат • Жаңа ремонт' }, price: 45000000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Дом в Медеу', en: 'House in Medeu', kk: 'Медеудегі үй' }, description: { ru: '250 м² + 8 соток • Бассейн • Гараж на 2 авто', en: '250 m² + 8 acres • Pool • 2-car garage', kk: '250 м² + 8 сотка • Бассейн • 2 авто гаражы' }, price: 180000000, currency: 'KZT' } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '💼 Мои услуги', en: '💼 My services', kk: '💼 Менің қызметтерім' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Подбор квартиры', en: 'Apartment search', kk: 'Пәтер іздеу' }, description: { ru: 'Найду идеальный вариант под ваш бюджет', en: 'Find the perfect option for your budget', kk: 'Бюджетіңізге сәйкес тамаша нұсқа табамын' }, price: 0, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Продажа вашей недвижимости', en: 'Selling your property', kk: 'Жылжымайтын мүлкіңізді сату' }, description: { ru: 'Фото + реклама + показы + сопровождение сделки', en: 'Photos + ads + showings + deal support', kk: 'Фото + жарнама + көрсету + мәміле сүйемелдеу' }, price: 0, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Бесплатная консультация', en: 'Free consultation', kk: 'Тегін консультация' }, description: { ru: 'Оценка рынка, советы по покупке/продаже', en: 'Market evaluation, buy/sell advice', kk: 'Нарықты бағалау, сатып алу/сату бойынша кеңес' }, price: 0, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Семья Ахметовых', en: 'Akhmetov family', kk: 'Ахметовтер отбасы' }, role: { ru: 'Купили квартиру', en: 'Bought apartment', kk: 'Пәтер сатып алды' }, text: { ru: 'Айгуль помогла найти квартиру мечты за 2 недели! Всё прозрачно, никаких скрытых комиссий. Рекомендуем!', en: 'Aigul helped find our dream apartment in 2 weeks! Everything transparent, no hidden fees. Recommend!', kk: 'Айгүл 2 аптада арман пәтерді табуға көмектесті! Бәрі ашық, жасырын комиссиялар жоқ. Ұсынамыз!' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Какая ваша комиссия?', en: 'What is your commission?', kk: 'Комиссияңыз қандай?' }, answer: { ru: 'При покупке — бесплатно для покупателя. При продаже — 2% от суммы сделки.', en: 'For buyers — free. For sellers — 2% of deal amount.', kk: 'Сатып алушыларға — тегін. Сатушыларға — мәміле сомасының 2%.' } }] } },
      { type: 'link', overrides: { title: { ru: '📅 Записаться на консультацию', en: '📅 Book consultation', kk: '📅 Консультацияға жазылу' }, url: 'https://calendly.com/aigul-realtor', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77011234567' }, { platform: 'telegram', username: 'aigul_realtor' }] } },
    ],
  },
  {
    id: 'wedding',
    name: 'Свадебные услуги',
    description: 'Для организаторов свадеб, ведущих, декораторов',
    category: 'Бизнес',
    preview: '💒',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Wedding Dream', en: 'Wedding Dream', kk: 'Wedding Dream' }, bio: { ru: '💍 Организация свадеб под ключ\n✨ 7 лет • 300+ свадеб\n🏆 Лучший организатор 2023\n📍 Алматы, Астана, выезд', en: '💍 Turnkey wedding planning\n✨ 7 years • 300+ weddings\n🏆 Best organizer 2023\n📍 Almaty, Astana, travel', kk: '💍 Кілтке дейін той ұйымдастыру\n✨ 7 жыл • 300+ той\n🏆 2023 үздік ұйымдастырушы\n📍 Алматы, Астана, сапар' } } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🎬 Showreel 2024 — Наши свадьбы', en: '🎬 Showreel 2024 — Our weddings', kk: '🎬 Showreel 2024 — Біздің тойлар' } } },
      { type: 'carousel', overrides: { title: { ru: '💐 Портфолио', en: '💐 Portfolio', kk: '💐 Портфолио' }, images: [] } },
      { type: 'text', overrides: { content: { ru: '💎 Пакеты услуг', en: '💎 Service packages', kk: '💎 Қызмет пакеттері' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Координация', en: 'Coordination', kk: 'Координация' }, price: 150000, currency: 'KZT', period: { ru: 'день', en: 'day', kk: 'күн' }, features: [{ ru: 'Координация в день свадьбы', en: 'Wedding day coordination', kk: 'Той күні координациясы' }, { ru: 'Работа с подрядчиками', en: 'Vendor management', kk: 'Мердігерлермен жұмыс' }, { ru: 'Тайминг мероприятия', en: 'Event timing', kk: 'Іс-шара уақыты' }], isPopular: false }, { name: { ru: 'Полный пакет', en: 'Full package', kk: 'Толық пакет' }, price: 500000, currency: 'KZT', period: { ru: 'свадьба', en: 'wedding', kk: 'той' }, features: [{ ru: 'Планирование от А до Я', en: 'Planning A to Z', kk: 'А-дан Я-ға дейін жоспарлау' }, { ru: 'Подбор площадки и подрядчиков', en: 'Venue and vendor selection', kk: 'Алаң және мердігерлерді таңдау' }, { ru: 'Декор-концепция', en: 'Decor concept', kk: 'Декор концепциясы' }, { ru: 'Координация', en: 'Coordination', kk: 'Координация' }], isPopular: true }, { name: { ru: 'VIP', en: 'VIP', kk: 'VIP' }, price: 1000000, currency: 'KZT', period: { ru: 'свадьба', en: 'wedding', kk: 'той' }, features: [{ ru: 'Всё из полного пакета', en: 'Everything from full package', kk: 'Толық пакеттен бәрі' }, { ru: 'Эксклюзивный декор', en: 'Exclusive decor', kk: 'Эксклюзивті декор' }, { ru: 'Premium подрядчики', en: 'Premium vendors', kk: 'Premium мердігерлер' }, { ru: '24/7 поддержка', en: '24/7 support', kk: '24/7 қолдау' }], isPopular: false }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Асель и Арман', en: 'Assel & Arman', kk: 'Әсел мен Арман' }, role: { ru: 'Свадьба 2024', en: 'Wedding 2024', kk: 'Той 2024' }, text: { ru: 'Свадьба нашей мечты! Всё было идеально — от декора до тайминга. Мы просто наслаждались днём, а команда Wedding Dream сделала всё сама.', en: 'The wedding of our dreams! Everything was perfect — from decor to timing. We just enjoyed the day while Wedding Dream team did everything.', kk: 'Арманымыздың тойы! Бәрі тамаша болды — декордан уақытқа дейін. Біз тек күнді тамашаладық, Wedding Dream командасы бәрін өздері жасады.' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '📅 Бесплатная консультация', en: '📅 Free consultation', kk: '📅 Тегін консультация' }, url: 'https://calendly.com/wedding-dream', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77051234567' }, { platform: 'instagram', username: 'weddingdream.kz' }] } },
    ],
  },

  // ===== ЭКСПЕРТЫ =====
  {
    id: 'psychologist',
    name: 'Психолог',
    description: 'Для психологов и терапевтов — полный профиль с записью',
    category: 'Эксперты',
    preview: '🧠',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Айгерим Нурланова', en: 'Aigerim Nurlanova', kk: 'Айгерім Нұрланова' }, bio: { ru: '🎓 Клинический психолог • КазНУ\n💼 12 лет практики • 3000+ клиентов\n🌟 Тревога • Отношения • Самооценка\n📍 Онлайн + офлайн (Алматы)', en: '🎓 Clinical psychologist • KazNU\n💼 12 years practice • 3000+ clients\n🌟 Anxiety • Relationships • Self-esteem\n📍 Online + offline (Almaty)', kk: '🎓 Клиникалық психолог • ҚазҰУ\n💼 12 жыл тәжірибе • 3000+ клиент\n🌟 Үрей • Қарым-қатынас • Өзін-өзі бағалау\n📍 Онлайн + офлайн (Алматы)' } } },
      { type: 'text', overrides: { content: { ru: '💬 "Каждый заслуживает быть услышанным и понятым"', en: '💬 "Everyone deserves to be heard and understood"', kk: '💬 "Әрбір адам естілуге және түсінілуге лайық"' }, style: 'quote', alignment: 'center' } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🎥 Как справиться с тревогой: 5 техник', en: '🎥 How to cope with anxiety: 5 techniques', kk: '🎥 Үреймен қалай күресуге болады: 5 техника' } } },
      { type: 'text', overrides: { content: { ru: '📋 С чем я работаю', en: '📋 What I work with', kk: '📋 Мен немен жұмыс істеймін' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• Тревожность и панические атаки\n• Депрессия и эмоциональное выгорание\n• Отношения и семейные конфликты\n• Низкая самооценка\n• Травмы и потери\n• Карьерные кризисы', en: '• Anxiety and panic attacks\n• Depression and burnout\n• Relationships and family conflicts\n• Low self-esteem\n• Trauma and loss\n• Career crises', kk: '• Үрей және дүрбелең ұстамалары\n• Депрессия және эмоционалды күйзеліс\n• Қарым-қатынас және отбасылық дау-жанжал\n• Өзін-өзі төмен бағалау\n• Жарақаттар мен жоғалтулар\n• Мансаптық дағдарыстар' }, style: 'paragraph', alignment: 'left' } },
      { type: 'text', overrides: { content: { ru: '💰 Услуги', en: '💰 Services', kk: '💰 Қызметтер' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Консультация', en: 'Consultation', kk: 'Консультация' }, price: 18000, currency: 'KZT', period: { ru: '50 мин', en: '50 min', kk: '50 мин' }, features: [{ ru: 'Онлайн или офлайн', en: 'Online or offline', kk: 'Онлайн немесе офлайн' }, { ru: 'Индивидуальный подход', en: 'Individual approach', kk: 'Жеке көзқарас' }], isPopular: false }, { name: { ru: 'Пакет 4 сессии', en: '4 sessions pack', kk: '4 сессия пакеті' }, price: 61200, currency: 'KZT', period: { ru: 'пакет', en: 'package', kk: 'пакет' }, features: [{ ru: 'Экономия 15%', en: 'Save 15%', kk: '15% үнемдеу' }, { ru: 'Глубокая проработка', en: 'Deep work', kk: 'Терең жұмыс' }, { ru: 'Домашние задания', en: 'Homework', kk: 'Үй тапсырмалары' }], isPopular: true }, { name: { ru: 'Семейная', en: 'Family', kk: 'Отбасылық' }, price: 25000, currency: 'KZT', period: { ru: '80 мин', en: '80 min', kk: '80 мин' }, features: [{ ru: 'Для пар и семей', en: 'For couples and families', kk: 'Жұптар мен отбасылар үшін' }, { ru: 'Работа с конфликтами', en: 'Conflict resolution', kk: 'Жанжалдармен жұмыс' }], isPopular: false }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Анонимный отзыв', en: 'Anonymous review', kk: 'Анонимді пікір' }, text: { ru: 'После 6 сессий с Айгерим моя жизнь изменилась. Научилась справляться с паническими атаками и выстраивать границы. Наконец-то чувствую себя собой!', en: 'After 6 sessions with Aigerim my life changed. Learned to cope with panic attacks and set boundaries. Finally feel like myself!', kk: 'Айгеріммен 6 сессиядан кейін өмірім өзгерді. Дүрбелең ұстамаларымен күресуді және шекараларды орнатуды үйрендім. Ақыры өзіммен сезінемін!' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Как проходит первая сессия?', en: 'How does the first session go?', kk: 'Бірінші сессия қалай өтеді?' }, answer: { ru: 'Мы знакомимся, вы рассказываете о себе и запросе. Я задаю уточняющие вопросы и предлагаю план работы.', en: 'We get acquainted, you tell about yourself and your request. I ask clarifying questions and propose a work plan.', kk: 'Таныстық, сіз өзіңіз туралы және сұранысыңыз туралы айтасыз. Мен нақтылайтын сұрақтар қойып, жұмыс жоспарын ұсынамын.' } }, { question: { ru: 'Это конфиденциально?', en: 'Is this confidential?', kk: 'Бұл құпия ма?' }, answer: { ru: 'Абсолютно. Всё, что вы расскажете, остаётся между нами. Я работаю по этическому кодексу психолога.', en: 'Absolutely. Everything you share stays between us. I follow the psychologist\'s code of ethics.', kk: 'Мүлдем. Сіз айтқанның бәрі арамызда қалады. Мен психологтың этикалық кодексі бойынша жұмыс істеймін.' } }] } },
      { type: 'link', overrides: { title: { ru: '📅 Записаться на консультацию', en: '📅 Book consultation', kk: '📅 Консультацияға жазылу' }, url: 'https://calendly.com/aigerim-psy', icon: 'calendar', style: 'pill' } },
      { type: 'link', overrides: { title: { ru: '📱 Телеграм-канал: советы и упражнения', en: '📱 Telegram channel: tips and exercises', kk: '📱 Telegram-канал: кеңестер мен жаттығулар' }, url: 'https://t.me/aigerim_psy_channel', icon: 'globe', style: 'rounded' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'aigerim_psy' }, { platform: 'whatsapp', username: '+77011234567' }] } },
    ],
  },
  {
    id: 'teacher',
    name: 'Репетитор',
    description: 'Для преподавателей — курсы, результаты, материалы',
    category: 'Эксперты',
    preview: '📚',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'English with Kate', en: 'English with Kate', kk: 'English with Kate' }, bio: { ru: '🇬🇧 Преподаватель английского\n🎓 IELTS 8.5 • CELTA certified\n📚 Подготовка к IELTS, SAT, NIS\n🏆 95% учеников — IELTS 7.0+', en: '🇬🇧 English teacher\n🎓 IELTS 8.5 • CELTA certified\n📚 IELTS, SAT, NIS preparation\n🏆 95% students — IELTS 7.0+', kk: '🇬🇧 Ағылшын тілі мұғалімі\n🎓 IELTS 8.5 • CELTA сертификаты\n📚 IELTS, SAT, NIS дайындық\n🏆 95% оқушылар — IELTS 7.0+' } } },
      { type: 'text', overrides: { content: { ru: '🏆 Результаты учеников', en: '🏆 Student results', kk: '🏆 Оқушылар нәтижелері' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• IELTS 7.0+ — 95% учеников\n• Поступление в топ-вузы UK, US, Canada\n• 200+ выпускников за 8 лет\n• Средний рост балла: +1.5 за 2 месяца', en: '• IELTS 7.0+ — 95% of students\n• Admission to top UK, US, Canada universities\n• 200+ graduates in 8 years\n• Average score increase: +1.5 in 2 months', kk: '• IELTS 7.0+ — оқушылардың 95%\n• UK, US, Canada үздік университеттеріне түсу\n• 8 жылда 200+ түлек\n• Орташа балл өсімі: 2 айда +1.5' }, style: 'paragraph', alignment: 'left' } },
      { type: 'countdown', overrides: { title: { ru: '📚 Набор в группу IELTS Intensive до:', en: '📚 IELTS Intensive group enrollment until:', kk: '📚 IELTS Intensive тобына қабылдау:' }, endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), style: 'modern' } },
      { type: 'text', overrides: { content: { ru: '📖 Курсы и цены', en: '📖 Courses & prices', kk: '📖 Курстар мен бағалар' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Индивидуально', en: 'Individual', kk: 'Жеке' }, price: 8000, currency: 'KZT', period: { ru: '60 мин', en: '60 min', kk: '60 мин' }, features: [{ ru: 'Онлайн Zoom', en: 'Online Zoom', kk: 'Онлайн Zoom' }, { ru: 'Персональная программа', en: 'Personal program', kk: 'Жеке бағдарлама' }, { ru: 'Домашние задания', en: 'Homework', kk: 'Үй тапсырмалары' }], isPopular: false }, { name: { ru: 'IELTS Intensive', en: 'IELTS Intensive', kk: 'IELTS Intensive' }, price: 80000, currency: 'KZT', period: { ru: '12 занятий', en: '12 lessons', kk: '12 сабақ' }, features: [{ ru: 'Все секции IELTS', en: 'All IELTS sections', kk: 'Барлық IELTS бөлімдері' }, { ru: 'Mock tests', en: 'Mock tests', kk: 'Mock tests' }, { ru: 'Группа до 6 человек', en: 'Group up to 6', kk: '6 адамға дейін топ' }, { ru: 'Материалы включены', en: 'Materials included', kk: 'Материалдар кіреді' }], isPopular: true }, { name: { ru: 'Speaking Club', en: 'Speaking Club', kk: 'Speaking Club' }, price: 15000, currency: 'KZT', period: { ru: 'месяц', en: 'month', kk: 'ай' }, features: [{ ru: '4 занятия в месяц', en: '4 lessons per month', kk: 'Айына 4 сабақ' }, { ru: 'Группа 4-6 человек', en: 'Group of 4-6', kk: '4-6 адам тобы' }, { ru: 'Разговорная практика', en: 'Speaking practice', kk: 'Сөйлеу практикасы' }], isPopular: false }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Данияр', en: 'Daniyar', kk: 'Данияр' }, role: { ru: 'IELTS 7.5', en: 'IELTS 7.5', kk: 'IELTS 7.5' }, text: { ru: 'Занимался с Катей 3 месяца перед IELTS. Поднял балл с 6.0 до 7.5! Отличная методика, много практики, поддержка 24/7.', en: 'Studied with Kate for 3 months before IELTS. Raised score from 6.0 to 7.5! Excellent methodology, lots of practice, 24/7 support.', kk: 'IELTS алдында Катямен 3 ай оқыдым. Баллды 6.0-ден 7.5-ке көтердім! Керемет әдістеме, көп практика, 24/7 қолдау.' }, rating: 5 }, { name: { ru: 'Асем', en: 'Asem', kk: 'Әсем' }, role: { ru: 'Поступила в UCL', en: 'Admitted to UCL', kk: 'UCL-ге түсті' }, text: { ru: 'Благодаря Кате получила IELTS 8.0 и поступила в University College London! Лучший преподаватель!', en: 'Thanks to Kate got IELTS 8.0 and was admitted to University College London! Best teacher!', kk: 'Катяның арқасында IELTS 8.0 алдым және University College London-ға түстім! Ең жақсы мұғалім!' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '📝 Бесплатный тест уровня', en: '📝 Free level test', kk: '📝 Тегін деңгей тесті' }, url: 'https://forms.google.com/test', icon: 'file-text', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '📱 Telegram-канал: бесплатные материалы', en: '📱 Telegram: free materials', kk: '📱 Telegram: тегін материалдар' }, url: 'https://t.me/english_kate', icon: 'globe', style: 'rounded' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'english_kate' }, { platform: 'whatsapp', username: '+77051234567' }] } },
    ],
  },
  {
    id: 'marketer',
    name: 'SMM / Маркетолог',
    description: 'Для digital-специалистов — кейсы, услуги, результаты',
    category: 'Эксперты',
    preview: '📊',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Тимур Digital', en: 'Timur Digital', kk: 'Тимур Digital' }, bio: { ru: '📈 SMM-маркетолог • Таргетолог\n🏆 100+ проектов • ROI до 400%\n💼 Работал с: Kaspi, Chocofamily, Sulpak\n🔥 Увеличу ваши продажи через соцсети', en: '📈 SMM marketer • Targeting specialist\n🏆 100+ projects • ROI up to 400%\n💼 Worked with: Kaspi, Chocofamily, Sulpak\n🔥 I\'ll boost your social sales', kk: '📈 SMM маркетолог • Таргетолог\n🏆 100+ жоба • ROI 400%-ға дейін\n💼 Жұмыс істеді: Kaspi, Chocofamily, Sulpak\n🔥 Соцсеттер арқылы сатылымды арттырамын' } } },
      { type: 'carousel', overrides: { title: { ru: '📊 Кейсы — рост продаж клиентов', en: '📊 Case studies — client sales growth', kk: '📊 Кейстер — клиенттер сатылымының өсуі' }, images: [] } },
      { type: 'text', overrides: { content: { ru: '🏆 Результаты', en: '🏆 Results', kk: '🏆 Нәтижелер' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• Салон красоты: x3 продаж за 2 месяца\n• Онлайн-магазин: ROAS 450%\n• Ресторан: +5000 подписчиков за месяц\n• Фитнес-клуб: 150 новых клиентов/мес', en: '• Beauty salon: x3 sales in 2 months\n• Online store: ROAS 450%\n• Restaurant: +5000 followers in a month\n• Fitness club: 150 new clients/month', kk: '• Сұлулық салоны: 2 айда x3 сатылым\n• Онлайн-дүкен: ROAS 450%\n• Мейрамхана: айына +5000 жазылушы\n• Фитнес-клуб: айына 150 жаңа клиент' }, style: 'paragraph', alignment: 'left' } },
      { type: 'text', overrides: { content: { ru: '💼 Услуги', en: '💼 Services', kk: '💼 Қызметтер' }, style: 'heading', alignment: 'center' } },
      { type: 'product', overrides: { name: { ru: 'Аудит Instagram', en: 'Instagram audit', kk: 'Instagram аудиті' }, description: { ru: 'Анализ профиля + стратегия роста + чеклист на 30 пунктов', en: 'Profile analysis + growth strategy + 30-point checklist', kk: 'Профиль талдауы + өсу стратегиясы + 30 тармақты чеклист' }, price: 25000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Ведение Instagram', en: 'Instagram management', kk: 'Instagram жүргізу' }, description: { ru: '12 постов + 30 сторис + Reels + отчётность', en: '12 posts + 30 stories + Reels + reporting', kk: '12 пост + 30 stories + Reels + есеп' }, price: 180000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Настройка таргета', en: 'Targeting setup', kk: 'Таргет орнату' }, description: { ru: 'Instagram/Facebook Ads • A/B тестирование • Оптимизация', en: 'Instagram/Facebook Ads • A/B testing • Optimization', kk: 'Instagram/Facebook Ads • A/B тестілеу • Оптимизация' }, price: 50000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Консультация 1 час', en: '1 hour consultation', kk: '1 сағат консультация' }, description: { ru: 'Разбор вашего бизнеса + конкретный план действий', en: 'Business analysis + specific action plan', kk: 'Бизнес талдауы + нақты әрекет жоспары' }, price: 30000, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Алия', en: 'Aliya', kk: 'Әлия' }, role: { ru: 'Салон красоты GLOW', en: 'GLOW Beauty Salon', kk: 'GLOW сұлулық салоны' }, text: { ru: 'Тимур за 2 месяца увеличил наши продажи через Instagram в 3 раза. Таргет работает как часы, клиенты приходят каждый день!', en: 'Timur tripled our Instagram sales in 2 months. Targeting works like clockwork, clients come every day!', kk: 'Тимур 2 айда Instagram арқылы сатылымымызды 3 есе арттырды. Таргет сағат сияқты жұмыс істейді, клиенттер күнде келеді!' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '📱 Telegram-канал с кейсами (бесплатно)', en: '📱 Telegram channel with cases (free)', kk: '📱 Кейстер бар Telegram-канал (тегін)' }, url: 'https://t.me/timur_digital', icon: 'globe', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '📅 Бесплатная консультация 15 мин', en: '📅 Free 15 min consultation', kk: '📅 Тегін 15 мин консультация' }, url: 'https://calendly.com/timur-digital', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'timur_smm' }, { platform: 'whatsapp', username: '+77011234567' }] } },
    ],
  },
  {
    id: 'lawyer',
    name: 'Юрист / Адвокат',
    description: 'Для юридических услуг — специализация, консультации',
    category: 'Эксперты',
    preview: '⚖️',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Адвокат Серик Касымов', en: 'Attorney Serik Kasymov', kk: 'Адвокат Серік Қасымов' }, bio: { ru: '⚖️ Адвокат • 15 лет практики\n🏛 Гражданские и уголовные дела\n🏆 500+ выигранных дел\n📍 Алматы • Онлайн по всему РК', en: '⚖️ Attorney • 15 years practice\n🏛 Civil and criminal cases\n🏆 500+ won cases\n📍 Almaty • Online across KZ', kk: '⚖️ Адвокат • 15 жыл тәжірибе\n🏛 Азаматтық және қылмыстық істер\n🏆 500+ жеңілген іс\n📍 Алматы • ҚР бойынша онлайн' } } },
      { type: 'text', overrides: { content: { ru: '📋 Специализация', en: '📋 Specialization', kk: '📋 Мамандану' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• Семейные споры и разводы\n• Жилищные и земельные вопросы\n• Защита бизнеса и корпоративное право\n• Уголовные дела\n• Трудовые споры\n• Взыскание долгов', en: '• Family disputes and divorces\n• Housing and land issues\n• Business protection and corporate law\n• Criminal cases\n• Labor disputes\n• Debt collection', kk: '• Отбасылық даулар және ажырасулар\n• Тұрғын үй және жер мәселелері\n• Бизнесті қорғау және корпоративтік құқық\n• Қылмыстық істер\n• Еңбек дауларам\n• Борышты өндіру' }, style: 'paragraph', alignment: 'left' } },
      { type: 'product', overrides: { name: { ru: 'Первичная консультация', en: 'Initial consultation', kk: 'Алғашқы консультация' }, description: { ru: '30 минут • Анализ ситуации + рекомендации + оценка перспектив', en: '30 min • Situation analysis + recommendations + prospects', kk: '30 минут • Жағдайды талдау + ұсыныстар + перспективаларды бағалау' }, price: 10000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Составление договора', en: 'Contract drafting', kk: 'Келісімшарт жасау' }, description: { ru: 'Любой тип договора + правовая экспертиза + защита интересов', en: 'Any contract type + legal expertise + interest protection', kk: 'Кез-келген келісімшарт түрі + құқықтық сараптама + мүдделерді қорғау' }, price: 25000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Представительство в суде', en: 'Court representation', kk: 'Сотта өкілдік ету' }, description: { ru: 'Полное ведение дела: документы, заседания, апелляция', en: 'Full case management: documents, hearings, appeal', kk: 'Істі толық жүргізу: құжаттар, отырыстар, апелляция' }, price: 150000, currency: 'KZT' } },
      { type: 'product', overrides: { name: { ru: 'Абонентское обслуживание бизнеса', en: 'Business subscription', kk: 'Бизнесті абоненттік қызмет көрсету' }, description: { ru: 'Неограниченные консультации + проверка документов', en: 'Unlimited consultations + document review', kk: 'Шексіз консультациялар + құжаттарды тексеру' }, price: 100000, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Марат', en: 'Marat', kk: 'Марат' }, role: { ru: 'Предприниматель', en: 'Entrepreneur', kk: 'Кәсіпкер' }, text: { ru: 'Серик помог выиграть сложное дело по земельному спору. Профессионал с большой буквы, знает все тонкости законодательства.', en: 'Serik helped win a complex land dispute case. A true professional who knows all the nuances of legislation.', kk: 'Серік жер дауы бойынша күрделі істі жеңуге көмектесті. Заңнаманың барлық нюанстарын білетін нағыз кәсіпқой.' }, rating: 5 }] } },
      { type: 'faq', overrides: { items: [{ question: { ru: 'Даёте ли гарантии?', en: 'Do you provide guarantees?', kk: 'Кепілдік бересіз бе?' }, answer: { ru: 'Гарантирую профессиональный подход и максимальную защиту интересов. Результат зависит от обстоятельств дела, но я всегда честно оцениваю перспективы.', en: 'I guarantee professional approach and maximum interest protection. Result depends on circumstances, but I always honestly assess prospects.', kk: 'Кәсіби көзқарас пен мүдделеріңізді барынша қорғауға кепілдік беремін. Нәтиже жағдайларға байланысты, бірақ мен әрқашан перспективаларды адал бағалаймын.' } }, { question: { ru: 'Работаете онлайн?', en: 'Do you work online?', kk: 'Онлайн жұмыс істейсіз бе?' }, answer: { ru: 'Да, провожу консультации по Zoom/WhatsApp для клиентов из любого города РК. Документы подписываем через ЭЦП.', en: 'Yes, I conduct consultations via Zoom/WhatsApp for clients from any city in KZ. Documents signed via digital signature.', kk: 'Иә, ҚР кез-келген қаласынан клиенттер үшін Zoom/WhatsApp арқылы консультация өткіземін. Құжаттарды ЭСҚ арқылы қол қоямыз.' } }] } },
      { type: 'link', overrides: { title: { ru: '📅 Записаться на консультацию', en: '📅 Book consultation', kk: '📅 Консультацияға жазылу' }, url: 'https://calendly.com/advokat-serik', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77011234567' }, { platform: 'telegram', username: 'advokat_serik' }] } },
    ],
  },

  // ===== ПРЕМИУМ =====
  {
    id: 'agency',
    name: 'Digital-агентство',
    description: 'Для агентств и студий — showreel, кейсы, заявки',
    category: 'Премиум',
    preview: '🚀',
    isPremium: true,
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'ROCKET Digital Agency', en: 'ROCKET Digital Agency', kk: 'ROCKET Digital Agency' }, bio: { ru: '🚀 Digital-агентство полного цикла\n💻 Разработка • Дизайн • Маркетинг\n🏆 50+ проектов • 5 лет на рынке\n🌍 Работаем по всему СНГ', en: '🚀 Full-cycle digital agency\n💻 Development • Design • Marketing\n🏆 50+ projects • 5 years in market\n🌍 Working across CIS', kk: '🚀 Толық циклді digital агенттік\n💻 Әзірлеу • Дизайн • Маркетинг\n🏆 50+ жоба • Нарықта 5 жыл\n🌍 ТМД бойынша жұмыс істейміз' } } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🎬 Showreel 2024 — наши лучшие проекты', en: '🎬 Showreel 2024 — our best projects', kk: '🎬 Showreel 2024 — біздің үздік жобалар' } } },
      { type: 'carousel', overrides: { title: { ru: '🏆 Избранные кейсы', en: '🏆 Featured cases', kk: '🏆 Таңдаулы кейстер' }, images: [] } },
      { type: 'text', overrides: { content: { ru: '🏢 Нам доверяют', en: '🏢 They trust us', kk: '🏢 Бізге сенеді' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: 'Kaspi.kz • Air Astana • Chocofamily • Freedom Finance • Magnum • Sulpak', en: 'Kaspi.kz • Air Astana • Chocofamily • Freedom Finance • Magnum • Sulpak', kk: 'Kaspi.kz • Air Astana • Chocofamily • Freedom Finance • Magnum • Sulpak' }, style: 'paragraph', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '💼 Наши услуги', en: '💼 Our services', kk: '💼 Біздің қызметтер' }, style: 'heading', alignment: 'center' } },
      { type: 'pricing', overrides: { plans: [{ name: { ru: 'Лендинг', en: 'Landing Page', kk: 'Лендинг' }, price: 350000, currency: 'KZT', period: { ru: 'проект', en: 'project', kk: 'жоба' }, features: [{ ru: 'Дизайн + разработка', en: 'Design + development', kk: 'Дизайн + әзірлеу' }, { ru: 'Адаптив под все устройства', en: 'Responsive for all devices', kk: 'Барлық құрылғыларға адаптив' }, { ru: 'Хостинг на 1 год', en: '1 year hosting', kk: '1 жылға хостинг' }, { ru: 'SEO-оптимизация', en: 'SEO optimization', kk: 'SEO-оптимизация' }], isPopular: false }, { name: { ru: 'Интернет-магазин', en: 'E-commerce', kk: 'Интернет-дүкен' }, price: 900000, currency: 'KZT', period: { ru: 'проект', en: 'project', kk: 'жоба' }, features: [{ ru: 'До 1000 товаров', en: 'Up to 1000 products', kk: '1000 тауарға дейін' }, { ru: 'Интеграции (Kaspi, 1C)', en: 'Integrations (Kaspi, 1C)', kk: 'Интеграциялар (Kaspi, 1C)' }, { ru: 'Админ-панель', en: 'Admin panel', kk: 'Админ-панель' }, { ru: 'Обучение', en: 'Training', kk: 'Оқыту' }], isPopular: true }, { name: { ru: 'SMM + Таргет', en: 'SMM + Targeting', kk: 'SMM + Таргет' }, price: 250000, currency: 'KZT', period: { ru: 'месяц', en: 'month', kk: 'ай' }, features: [{ ru: 'Стратегия и контент-план', en: 'Strategy and content plan', kk: 'Стратегия және контент-жоспар' }, { ru: '12 постов + 30 сторис', en: '12 posts + 30 stories', kk: '12 пост + 30 stories' }, { ru: 'Таргетированная реклама', en: 'Targeted advertising', kk: 'Таргеттелген жарнама' }, { ru: 'Ежемесячный отчёт', en: 'Monthly report', kk: 'Ай сайынғы есеп' }], isPopular: false }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'ТОО "Астана Групп"', en: 'Astana Group LLP', kk: '"Астана Групп" ЖШС' }, role: { ru: 'Интернет-магазин', en: 'E-commerce', kk: 'Интернет-дүкен' }, text: { ru: 'ROCKET разработал нам интернет-магазин, который увеличил онлайн-продажи на 200%. Профессиональная команда, соблюдают сроки!', en: 'ROCKET developed an online store that increased online sales by 200%. Professional team, meet deadlines!', kk: 'ROCKET онлайн сатылымды 200%-ға арттырған интернет-дүкен жасады. Кәсіби команда, мерзімдерді сақтайды!' }, rating: 5 }] } },
      { type: 'form', overrides: { title: { ru: '📝 Оставить заявку — ответим за 30 минут', en: '📝 Submit request — reply in 30 min', kk: '📝 Өтініш қалдыру — 30 минутта жауап береміз' }, buttonText: { ru: 'Отправить', en: 'Send', kk: 'Жіберу' }, fields: [{ label: { ru: 'Имя', en: 'Name', kk: 'Аты' }, type: 'text', required: true }, { label: { ru: 'Телефон/WhatsApp', en: 'Phone/WhatsApp', kk: 'Телефон/WhatsApp' }, type: 'phone', required: true }, { label: { ru: 'Что нужно сделать?', en: 'What needs to be done?', kk: 'Не істеу керек?' }, type: 'textarea', required: false }] } },
      { type: 'socials', overrides: { platforms: [{ platform: 'instagram', url: 'https://instagram.com/rocket.agency' }, { platform: 'telegram', url: 'https://t.me/rocket_agency' }, { platform: 'linkedin', url: 'https://linkedin.com/company/rocket-agency' }, { platform: 'behance', url: 'https://behance.net/rocket-agency' }] } },
    ],
  },
  {
    id: 'restaurant',
    name: 'Ресторан / Кафе',
    description: 'Для заведений общепита — меню, бронь, атмосфера',
    category: 'Премиум',
    preview: '🍽️',
    isPremium: true,
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Ресторан NOMAD', en: 'NOMAD Restaurant', kk: 'NOMAD мейрамханасы' }, bio: { ru: '🍽️ Современная казахская кухня\n⭐ 4.9 на Google • 2GIS\n🏆 Лучший ресторан 2023\n📍 Алматы, Достык 200', en: '🍽️ Modern Kazakh cuisine\n⭐ 4.9 on Google • 2GIS\n🏆 Best restaurant 2023\n📍 Almaty, Dostyk 200', kk: '🍽️ Заманауи қазақ асханасы\n⭐ Google • 2GIS-те 4.9\n🏆 2023 үздік мейрамхана\n📍 Алматы, Достық 200' } } },
      { type: 'text', overrides: { content: { ru: '⏰ Пн-Вс: 12:00 - 00:00', en: '⏰ Mon-Sun: 12:00 - 00:00', kk: '⏰ Дс-Жс: 12:00 - 00:00' }, style: 'paragraph', alignment: 'center' } },
      { type: 'link', overrides: { title: { ru: '📅 ЗАБРОНИРОВАТЬ СТОЛИК', en: '📅 BOOK A TABLE', kk: '📅 ҮСТЕЛ БРОНДАУ' }, url: 'https://restobook.kz/nomad', icon: 'calendar', style: 'pill' } },
      { type: 'carousel', overrides: { title: { ru: '📸 Атмосфера', en: '📸 Atmosphere', kk: '📸 Атмосфера' }, images: [] } },
      { type: 'catalog', overrides: { title: { ru: '🍽️ Меню', en: '🍽️ Menu', kk: '🍽️ Мәзір' }, categories: [{ name: { ru: 'Горячие блюда', en: 'Hot dishes', kk: 'Ыстық тағамдар' }, items: [{ name: { ru: 'Бешбармак', en: 'Beshbarmak', kk: 'Бешбармақ' }, description: { ru: 'Традиционное блюдо • Баранина • 500г', en: 'Traditional dish • Lamb • 500g', kk: 'Дәстүрлі тағам • Қой еті • 500г' }, price: 4500 }, { name: { ru: 'Куырдак', en: 'Kuurdak', kk: 'Қуырдақ' }, description: { ru: 'Жареное мясо с картофелем', en: 'Fried meat with potatoes', kk: 'Картоппен қуырылған ет' }, price: 3200 }, { name: { ru: 'Казы', en: 'Kazy', kk: 'Қазы' }, description: { ru: 'Конская колбаса • Домашняя', en: 'Horse sausage • Homemade', kk: 'Жылқы шұжығы • Үйде жасалған' }, price: 3800 }] }, { name: { ru: 'Закуски', en: 'Appetizers', kk: 'Тағамдар' }, items: [{ name: { ru: 'Баурсаки', en: 'Baursaki', kk: 'Бауырсақ' }, description: { ru: 'Хрустящие • 10 шт', en: 'Crispy • 10 pcs', kk: 'Қытырлақ • 10 дана' }, price: 800 }, { name: { ru: 'Курт', en: 'Kurt', kk: 'Құрт' }, description: { ru: 'Домашний • 100г', en: 'Homemade • 100g', kk: 'Үйде жасалған • 100г' }, price: 600 }] }, { name: { ru: 'Напитки', en: 'Drinks', kk: 'Сусындар' }, items: [{ name: { ru: 'Кумыс', en: 'Kumys', kk: 'Қымыз' }, description: { ru: 'Традиционный • 500мл', en: 'Traditional • 500ml', kk: 'Дәстүрлі • 500мл' }, price: 1200 }, { name: { ru: 'Шубат', en: 'Shubat', kk: 'Шұбат' }, description: { ru: 'Верблюжье молоко • 500мл', en: 'Camel milk • 500ml', kk: 'Түйе сүті • 500мл' }, price: 1500 }] }] } },
      { type: 'separator', overrides: { style: 'line' } },
      { type: 'text', overrides: { content: { ru: '🎉 Банкеты и мероприятия', en: '🎉 Banquets and events', kk: '🎉 Банкеттер мен іс-шаралар' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• VIP-зал на 20 человек\n• Большой зал на 80 человек\n• Караоке\n• Живая музыка по пятницам и субботам\n• Детская комната', en: '• VIP room for 20 people\n• Main hall for 80 people\n• Karaoke\n• Live music on Fridays and Saturdays\n• Kids room', kk: '• 20 адамға VIP-зал\n• 80 адамға үлкен зал\n• Караоке\n• Жұма және сенбіде тірі музыка\n• Балалар бөлмесі' }, style: 'paragraph', alignment: 'center' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Алия', en: 'Aliya', kk: 'Әлия' }, role: { ru: 'Постоянный гость', en: 'Regular guest', kk: 'Тұрақты қонақ' }, text: { ru: 'Лучший бешбармак в городе! Атмосфера уютная, персонал вежливый. Приходим всей семьёй каждые выходные.', en: 'Best beshbarmak in the city! Cozy atmosphere, polite staff. We come with the whole family every weekend.', kk: 'Қаладағы ең жақсы бешбармақ! Жайлы атмосфера, сыпайы қызметкерлер. Демалыс сайын бүкіл отбасымен келеміз.' }, rating: 5 }] } },
      { type: 'map', overrides: { address: 'Алматы, Достык 200' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '+77071234567' }, { platform: 'instagram', username: 'nomad.restaurant' }] } },
    ],
  },
  {
    id: 'portfolio-pro',
    name: 'Портфолио PRO',
    description: 'Расширенное профессиональное портфолио с резюме',
    category: 'Премиум',
    preview: '💼',
    isPremium: true,
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Алексей Ким', en: 'Alexey Kim', kk: 'Алексей Ким' }, bio: { ru: '💼 Product Manager • Ex-Kaspi\n🚀 10+ лет в IT • Запустил 20+ продуктов\n🏆 Forbes 30 Under 30 Kazakhstan\n📍 Алматы • Open to work', en: '💼 Product Manager • Ex-Kaspi\n🚀 10+ years in IT • Launched 20+ products\n🏆 Forbes 30 Under 30 Kazakhstan\n📍 Almaty • Open to work', kk: '💼 Product Manager • Ex-Kaspi\n🚀 IT-да 10+ жыл • 20+ өнім шығарды\n🏆 Forbes 30 Under 30 Kazakhstan\n📍 Алматы • Жұмысқа ашық' } } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: { ru: '🎬 Видео-визитка (2 минуты)', en: '🎬 Video introduction (2 min)', kk: '🎬 Видео-визитка (2 минут)' } } },
      { type: 'carousel', overrides: { title: { ru: '🏆 Ключевые проекты', en: '🏆 Key projects', kk: '🏆 Негізгі жобалар' }, images: [] } },
      { type: 'text', overrides: { content: { ru: '📊 Достижения', en: '📊 Achievements', kk: '📊 Жетістіктер' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: '• Kaspi.kz — рост MAU с 5M до 12M (+140%)\n• Kaspi Travel — запуск с 0 до $10M GMV за год\n• Chocofamily — редизайн увеличил конверсию на 40%\n• Mentor для 50+ начинающих продактов', en: '• Kaspi.kz — MAU growth from 5M to 12M (+140%)\n• Kaspi Travel — launch from 0 to $10M GMV in a year\n• Chocofamily — redesign increased conversion by 40%\n• Mentored 50+ aspiring product managers', kk: '• Kaspi.kz — MAU 5M-нан 12M-ға өсті (+140%)\n• Kaspi Travel — жылына 0-ден $10M GMV-ға дейін іске қосу\n• Chocofamily — редизайн конверсияны 40%-ға арттырды\n• 50+ бастаушы продактқа тәлімгер' }, style: 'paragraph', alignment: 'left' } },
      { type: 'text', overrides: { content: { ru: '🛠 Навыки', en: '🛠 Skills', kk: '🛠 Дағдылар' }, style: 'heading', alignment: 'center' } },
      { type: 'text', overrides: { content: { ru: 'Product Strategy • Agile/Scrum • Data Analysis • User Research • A/B Testing • Figma • SQL • Python • Team Leadership', en: 'Product Strategy • Agile/Scrum • Data Analysis • User Research • A/B Testing • Figma • SQL • Python • Team Leadership', kk: 'Product Strategy • Agile/Scrum • Data Analysis • User Research • A/B Testing • Figma • SQL • Python • Team Leadership' }, style: 'paragraph', alignment: 'center' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: { ru: 'Михаил Ломтадзе', en: 'Mikhail Lomtadze', kk: 'Михаил Ломтадзе' }, role: { ru: 'CEO Kaspi.kz', en: 'CEO Kaspi.kz', kk: 'Kaspi.kz CEO' }, text: { ru: 'Алексей — один из лучших продакт-менеджеров, с которыми мне доводилось работать. Системный подход, сильная аналитика, умение вести за собой команду.', en: 'Alexey is one of the best product managers I have ever worked with. Systematic approach, strong analytics, ability to lead a team.', kk: 'Алексей — мен бірге жұмыс істеген ең жақсы продакт-менеджерлердің бірі. Жүйелі көзқарас, күшті аналитика, команданы бастау қабілеті.' }, rating: 5 }] } },
      { type: 'link', overrides: { title: { ru: '💼 LinkedIn', en: '💼 LinkedIn', kk: '💼 LinkedIn' }, url: 'https://linkedin.com/in/alexeykim', icon: 'linkedin', style: 'rounded' } },
      { type: 'download', overrides: { title: { ru: '📄 Скачать резюме (PDF)', en: '📄 Download CV (PDF)', kk: '📄 Резюмені жүктеу (PDF)' }, fileName: 'alexey_kim_cv.pdf' } },
      { type: 'link', overrides: { title: { ru: '📅 Назначить звонок', en: '📅 Schedule a call', kk: '📅 Қоңырау тағайындау' }, url: 'https://calendly.com/alexey-kim', icon: 'calendar', style: 'pill' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'telegram', username: 'alexey_kim_pm' }, { platform: 'linkedin', username: 'alexeykim' }, { platform: 'email', username: 'alexey@example.com' }] } },
    ],
  },

  // ===== ДРУГОЕ =====
  {
    id: 'personal',
    name: 'Личная страница',
    description: 'Простая страница со ссылками для всех',
    category: 'Другое',
    preview: '👤',
    blocks: [
      { type: 'profile', overrides: { name: { ru: 'Ваше имя', en: 'Your Name', kk: 'Сіздің атыңыз' }, bio: { ru: '✨ Расскажите о себе\n📍 Ваш город\n💼 Чем занимаетесь', en: '✨ Tell about yourself\n📍 Your city\n💼 What you do', kk: '✨ Өзіңіз туралы айтыңыз\n📍 Сіздің қалаңыз\n💼 Не істейсіз' } } },
      { type: 'link', overrides: { title: { ru: '📱 Instagram', en: '📱 Instagram', kk: '📱 Instagram' }, url: 'https://instagram.com/', icon: 'instagram', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '💬 Telegram', en: '💬 Telegram', kk: '💬 Telegram' }, url: 'https://t.me/', icon: 'globe', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '🎬 YouTube', en: '🎬 YouTube', kk: '🎬 YouTube' }, url: 'https://youtube.com/', icon: 'youtube', style: 'rounded' } },
      { type: 'link', overrides: { title: { ru: '🔗 Ваша ссылка', en: '🔗 Your link', kk: '🔗 Сіздің сілтемеңіз' }, url: 'https://example.com', icon: 'link', style: 'rounded' } },
      { type: 'socials', overrides: { platforms: [{ platform: 'instagram', url: 'https://instagram.com/' }, { platform: 'telegram', url: 'https://t.me/' }, { platform: 'tiktok', url: 'https://tiktok.com/' }] } },
    ],
  },
  {
    id: 'blank',
    name: 'Пустой шаблон',
    description: 'Начните с чистого листа — полная свобода',
    category: 'Другое',
    preview: '📄',
    blocks: [],
  },
];

const CATEGORIES = ['Все', 'Креаторы', 'Бизнес', 'Эксперты', 'Премиум', 'Другое'];

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (blocks: Block[]) => void;
}

export const TemplateGallery = memo(function TemplateGallery({
  open,
  onClose,
  onSelect,
}: TemplateGalleryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const handleSelect = (template: Template) => {
    // Generate blocks with full structure from block-factory + overrides
    const fullBlocks = template.blocks.map((blockDef) => 
      createTemplateBlock(blockDef.type, blockDef.overrides || {})
    );
    onSelect(fullBlocks);
    setCopiedId(template.id);
    setTimeout(() => {
      setCopiedId(null);
      onClose();
    }, 500);
  };

  const filteredTemplates = selectedCategory === 'Все' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-3 sm:p-6 pb-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-xl flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">{t('templates.title', 'Галерея шаблонов')}</span>
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMarketplaceOpen(true)}
              className="gap-1 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('templates.marketplace', 'Маркетплейс')}</span>
            </Button>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            {t('templates.description', 'Выберите готовый шаблон — AI персонализирует под ваш бизнес')}
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter - Horizontal scroll on mobile */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b overflow-hidden">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-3 h-7 sm:h-9 flex-shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[55vh] sm:h-[55vh]">
          <div className="p-3 sm:p-6 pt-3 sm:pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`relative p-2.5 sm:p-4 hover:border-primary cursor-pointer transition-all hover:shadow-lg group active:scale-[0.98] ${
                    copiedId === template.id ? 'border-green-500 bg-green-500/10' : ''
                  }`}
                  onClick={() => handleSelect(template)}
                >
                  {template.isPremium && (
                    <Badge className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] px-1.5">
                      PRO
                    </Badge>
                  )}
                  
                  <div className="text-2xl sm:text-4xl mb-1.5 sm:mb-2 text-center group-hover:scale-110 transition-transform">
                    {copiedId === template.id ? (
                      <Check className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-500" />
                    ) : (
                      template.preview
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-[11px] sm:text-sm text-center mb-0.5 sm:mb-1 truncate">
                    {template.name}
                  </h4>
                  
                  <p className="text-[9px] sm:text-xs text-muted-foreground text-center line-clamp-2 min-h-[2em] sm:min-h-[2.5em]">
                    {template.description}
                  </p>
                  
                  <div className="mt-1.5 sm:mt-3 text-center">
                    <Badge variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2">
                      {template.blocks.length} {t('templates.blocks', 'блоков')}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-3 sm:p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            {t('common.cancel', 'Отмена')}
          </Button>
        </div>
      </DialogContent>

      {/* Personalization Dialog */}
      {selectedTemplate && (
        <TemplatePersonalization
          open={personalizationOpen}
          onClose={() => setPersonalizationOpen(false)}
          templateBlocks={selectedTemplate.blocks}
          templateName={selectedTemplate.name}
          onApply={(blocks, profile) => {
            onSelect(blocks);
            setPersonalizationOpen(false);
            onClose();
          }}
        />
      )}

      {/* Marketplace Dialog */}
      <TemplateMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        onApplyTemplate={(blocks) => {
          onSelect(blocks);
          setMarketplaceOpen(false);
          onClose();
        }}
      />
    </Dialog>
  );
});