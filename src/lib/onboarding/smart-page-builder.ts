import { createBlock } from '@/lib/blocks/block-factory';
import {
  extractContactsPipeline,
  extractLocation,
  extractServicesPipeline,
  extractSocialsPipeline,
  extractUrlFromText,
  type ParsedMessenger,
  type ParsedService,
} from '@/lib/blocks/extractors';
import type {
  Block,
  BlockSizePreset,
  BookingBlock,
  ButtonBlock,
  CatalogBlock,
  CatalogItem,
  FAQBlock,
  FormBlock,
  MessengerBlock,
  PricingBlock,
  PricingItem,
  ProfileBlock,
  SocialsBlock,
  TestimonialBlock,
  TextBlock,
} from '@/types/page';
import type { Niche, OnboardingGoal } from '@/lib/niches';

export interface SmartBuilderUserInfo {
  name: string;
  bio: string;
  goal?: OnboardingGoal;
  contacts: string;
  services: string;
  socials: string;
  mediaLinks: string;
  expertGoal?: string;
  expertOffer?: string;
  expertChannel?: 'telegram' | 'email';
}

export interface SmartPageBuilderInput {
  userInfo: SmartBuilderUserInfo;
  niche: Niche;
  goal?: OnboardingGoal | null;
  now?: number;
}

export interface SmartPageBuilderResult {
  profile: {
    name: string;
    bio: string;
  };
  blocks: Block[];
  diagnostics: {
    revenueMode: RevenueMode;
    qualityScore: number;
    appliedRules: string[];
  };
}

type RevenueMode = 'appointment' | 'lead' | 'commerce' | 'event' | 'brand';

interface ServiceSeed {
  name: string;
  description: string;
  price: number;
  duration?: number;
}

interface NicheBlueprint {
  mode: RevenueMode;
  profession: string;
  promise: string;
  cta: string;
  proof: string[];
  services: ServiceSeed[];
  avatarIcon: string;
}

type MessengerContact = ParsedMessenger & {
  platform: MessengerBlock['messengers'][number]['platform'];
};

const DEFAULT_SERVICES: ServiceSeed[] = [
  { name: 'Discovery call', description: 'Fast diagnosis and next-step plan.', price: 0, duration: 30 },
  { name: 'Core service', description: 'A focused offer built around your main customer outcome.', price: 15000, duration: 60 },
  { name: 'Premium package', description: 'Deeper work with priority support and follow-up.', price: 45000, duration: 120 },
];

const BLUEPRINTS: Record<Niche, NicheBlueprint> = {
  expert: {
    mode: 'lead',
    profession: 'Expert consultant',
    promise: 'Clear advice, practical next steps, and measurable progress.',
    cta: 'Book a consultation',
    proof: ['Structured sessions', 'Clear action plan', 'Follow-up support'],
    services: [
      { name: 'Strategy session', description: 'A focused session with a concrete action plan.', price: 25000, duration: 60 },
      { name: 'Audit and roadmap', description: 'Diagnosis, priorities, and a 30-day execution plan.', price: 45000, duration: 90 },
      { name: 'Monthly advisory', description: 'Ongoing expert support for decisions and growth.', price: 120000, duration: 60 },
    ],
    avatarIcon: 'badge-check',
  },
  education: {
    mode: 'appointment',
    profession: 'Educator',
    promise: 'Understand the topic faster with a clear plan and guided practice.',
    cta: 'Book a lesson',
    proof: ['Personal plan', 'Practice tasks', 'Progress tracking'],
    services: [
      { name: 'Trial lesson', description: 'Meet, diagnose the level, and set a learning route.', price: 0, duration: 30 },
      { name: 'Individual lesson', description: 'One-to-one lesson with homework and feedback.', price: 8000, duration: 60 },
      { name: 'Monthly program', description: 'Regular lessons and progress control.', price: 65000, duration: 60 },
    ],
    avatarIcon: 'graduation-cap',
  },
  business: {
    mode: 'lead',
    profession: 'Business service',
    promise: 'Practical systems for sales, operations, and repeatable growth.',
    cta: 'Request a proposal',
    proof: ['Business-first workflow', 'Clear deliverables', 'Fast implementation'],
    services: [
      { name: 'Business audit', description: 'Find bottlenecks and quick wins.', price: 35000, duration: 90 },
      { name: 'Growth sprint', description: 'A focused implementation sprint for one core metric.', price: 150000, duration: 120 },
      { name: 'Retainer', description: 'Monthly execution support and reporting.', price: 300000, duration: 60 },
    ],
    avatarIcon: 'briefcase-business',
  },
  fitness: {
    mode: 'appointment',
    profession: 'Fitness coach',
    promise: 'A realistic plan for strength, shape, and consistency.',
    cta: 'Book a training',
    proof: ['Personal program', 'Technique control', 'Nutrition guidance'],
    services: [
      { name: 'Trial training', description: 'Movement check and first workout.', price: 5000, duration: 60 },
      { name: 'Personal training', description: 'One-to-one workout with technique control.', price: 12000, duration: 60 },
      { name: 'Monthly coaching', description: 'Training plan, check-ins, and support.', price: 90000, duration: 60 },
    ],
    avatarIcon: 'dumbbell',
  },
  health: {
    mode: 'appointment',
    profession: 'Health specialist',
    promise: 'Calm, careful support with a clear path forward.',
    cta: 'Book an appointment',
    proof: ['Confidential format', 'Personal approach', 'Clear recommendations'],
    services: [
      { name: 'Initial consultation', description: 'Discuss the request and define next steps.', price: 18000, duration: 60 },
      { name: 'Follow-up session', description: 'Track progress and adjust the plan.', price: 15000, duration: 45 },
      { name: 'Support package', description: 'Several sessions with ongoing support.', price: 70000, duration: 60 },
    ],
    avatarIcon: 'heart-pulse',
  },
  beauty: {
    mode: 'appointment',
    profession: 'Beauty professional',
    promise: 'A polished result, clean process, and care that feels personal.',
    cta: 'Book a visit',
    proof: ['Sterile tools', 'Premium materials', 'Before/after portfolio'],
    services: [
      { name: 'Express service', description: 'A quick appointment for a clean result.', price: 7000, duration: 45 },
      { name: 'Signature service', description: 'Your most requested beauty service.', price: 15000, duration: 90 },
      { name: 'Premium care', description: 'Extended service with additional care.', price: 28000, duration: 120 },
    ],
    avatarIcon: 'sparkles',
  },
  art: {
    mode: 'brand',
    profession: 'Creative professional',
    promise: 'Distinct visual work with a clear idea and refined execution.',
    cta: 'Discuss a project',
    proof: ['Portfolio-first approach', 'Custom concept', 'Polished delivery'],
    services: [
      { name: 'Creative consultation', description: 'Clarify the idea, references, and format.', price: 10000, duration: 45 },
      { name: 'Custom project', description: 'Design or creative work tailored to the brief.', price: 60000, duration: 120 },
      { name: 'Brand package', description: 'A complete visual set for launch.', price: 180000, duration: 120 },
    ],
    avatarIcon: 'palette',
  },
  food: {
    mode: 'commerce',
    profession: 'Food business',
    promise: 'Fresh offers, fast ordering, and a simple path to repeat customers.',
    cta: 'Order now',
    proof: ['Fresh ingredients', 'Fast confirmation', 'Popular menu'],
    services: [
      { name: 'Starter set', description: 'A simple entry offer for first-time customers.', price: 4500, duration: 30 },
      { name: 'Signature menu', description: 'Most popular ready-to-order offer.', price: 12000, duration: 45 },
      { name: 'Event catering', description: 'Custom menu for groups and events.', price: 60000, duration: 120 },
    ],
    avatarIcon: 'chef-hat',
  },
  music: {
    mode: 'event',
    profession: 'Music professional',
    promise: 'A memorable sound and a clear way to book or follow the next show.',
    cta: 'Book or listen',
    proof: ['Live experience', 'Custom program', 'Event-ready setup'],
    services: [
      { name: 'Event performance', description: 'Live set for a private or business event.', price: 120000, duration: 120 },
      { name: 'Studio session', description: 'Recording or production session.', price: 30000, duration: 120 },
      { name: 'Music lesson', description: 'Personal lesson with practice plan.', price: 10000, duration: 60 },
    ],
    avatarIcon: 'music',
  },
  tech: {
    mode: 'lead',
    profession: 'Tech specialist',
    promise: 'Technical clarity, reliable implementation, and fast iteration.',
    cta: 'Start a tech consult',
    proof: ['Clean implementation', 'Measured performance', 'Maintainable systems'],
    services: [
      { name: 'Technical audit', description: 'Code, stack, or product review with priorities.', price: 50000, duration: 90 },
      { name: 'MVP sprint', description: 'Prototype or feature delivery sprint.', price: 250000, duration: 120 },
      { name: 'Support retainer', description: 'Ongoing improvements and fixes.', price: 180000, duration: 60 },
    ],
    avatarIcon: 'code-2',
  },
  fashion: {
    mode: 'commerce',
    profession: 'Fashion professional',
    promise: 'A confident visual image with pieces and styling that fit real life.',
    cta: 'Choose a look',
    proof: ['Personal selection', 'Style direction', 'Ready-to-use looks'],
    services: [
      { name: 'Style consultation', description: 'Define direction, colors, and shopping plan.', price: 20000, duration: 60 },
      { name: 'Wardrobe review', description: 'Build outfits from what you already own.', price: 45000, duration: 120 },
      { name: 'Personal shopping', description: 'Guided selection and complete looks.', price: 80000, duration: 180 },
    ],
    avatarIcon: 'shirt',
  },
  travel: {
    mode: 'lead',
    profession: 'Travel expert',
    promise: 'Thoughtful routes, less stress, and memorable travel moments.',
    cta: 'Plan a trip',
    proof: ['Custom route', 'Local details', 'Clear budget'],
    services: [
      { name: 'Route plan', description: 'Personal route with timing and budget.', price: 25000, duration: 60 },
      { name: 'Full trip design', description: 'Route, hotels, logistics, and recommendations.', price: 90000, duration: 120 },
      { name: 'Travel support', description: 'Help before and during the trip.', price: 50000, duration: 60 },
    ],
    avatarIcon: 'plane',
  },
  realestate: {
    mode: 'lead',
    profession: 'Real estate specialist',
    promise: 'Clear property options, safe process, and fast communication.',
    cta: 'Request property options',
    proof: ['Market knowledge', 'Document support', 'Fast shortlist'],
    services: [
      { name: 'Buyer consultation', description: 'Define criteria, budget, and next steps.', price: 0, duration: 45 },
      { name: 'Property shortlist', description: 'Selected options with pros, cons, and pricing.', price: 30000, duration: 60 },
      { name: 'Deal support', description: 'Guidance through viewing, negotiation, and documents.', price: 150000, duration: 120 },
    ],
    avatarIcon: 'home',
  },
  events: {
    mode: 'event',
    profession: 'Event professional',
    promise: 'A clear event concept, smooth registration, and memorable experience.',
    cta: 'Reserve a spot',
    proof: ['Turnkey planning', 'Guest flow', 'Follow-up support'],
    services: [
      { name: 'Event consultation', description: 'Concept, format, and budget planning.', price: 15000, duration: 60 },
      { name: 'Event package', description: 'Planning and coordination for your event.', price: 180000, duration: 120 },
      { name: 'Workshop seat', description: 'Registration for the next public session.', price: 12000, duration: 90 },
    ],
    avatarIcon: 'calendar-days',
  },
  services: {
    mode: 'appointment',
    profession: 'Service provider',
    promise: 'Reliable work, clear pricing, and quick communication.',
    cta: 'Request service',
    proof: ['Clear terms', 'Fast response', 'Reliable execution'],
    services: DEFAULT_SERVICES,
    avatarIcon: 'wrench',
  },
  other: {
    mode: 'lead',
    profession: 'Independent professional',
    promise: 'A simple way to understand the offer and get in touch.',
    cta: 'Contact me',
    proof: ['Clear offer', 'Fast reply', 'Personal approach'],
    services: DEFAULT_SERVICES,
    avatarIcon: 'star',
  },
};

const APPOINTMENT_NICHES = new Set<Niche>(['beauty', 'fitness', 'health', 'education', 'services']);
const COMMERCE_NICHES = new Set<Niche>(['food', 'fashion']);
const EVENT_NICHES = new Set<Niche>(['events', 'music']);

function nextIdFactory(now: number) {
  let index = 0;
  return (type: string) => `smart-${type}-${now}-${index++}`;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveRevenueMode(niche: Niche, goal?: OnboardingGoal | null): RevenueMode {
  if (goal === 'events') return 'event';
  if (goal === 'sales') return 'commerce';
  if (goal === 'brand') return 'brand';
  if (APPOINTMENT_NICHES.has(niche)) return 'appointment';
  if (COMMERCE_NICHES.has(niche)) return 'commerce';
  if (EVENT_NICHES.has(niche)) return 'event';
  return BLUEPRINTS[niche]?.mode ?? 'lead';
}

function inferNicheFromText(text: string): Niche {
  const lower = text.toLowerCase();
  const rules: Array<[Niche, RegExp]> = [
    ['beauty', /beauty|salon|makeup|lashes|brow|nail|hair|cosmet/i],
    ['fitness', /fitness|coach|gym|training|workout|yoga|pilates/i],
    ['health', /health|doctor|clinic|therapy|psycholog|wellness/i],
    ['education', /teacher|tutor|course|lesson|school|education|mentor/i],
    ['realestate', /real estate|realtor|property|apartment|house/i],
    ['events', /event|workshop|masterclass|conference|ticket/i],
    ['food', /food|chef|restaurant|cafe|bakery|catering/i],
    ['tech', /developer|software|it|saas|product|automation|code/i],
    ['fashion', /fashion|style|stylist|wardrobe|clothes/i],
    ['travel', /travel|tour|guide|trip|route/i],
    ['art', /design|photo|video|artist|creative|portfolio/i],
    ['music', /music|dj|singer|band|producer/i],
    ['business', /business|agency|consulting|marketing|sales|b2b/i],
    ['expert', /expert|consultant|coach|advisor|freelancer/i],
  ];

  return rules.find(([, pattern]) => pattern.test(lower))?.[0] ?? 'expert';
}

export function inferSmartPageNiche(text: string): Niche {
  return inferNicheFromText(text);
}

function mergeServices(parsed: ParsedService[], blueprint: NicheBlueprint): ParsedService[] {
  if (parsed.length > 0) return parsed;

  return blueprint.services.map((service) => ({
    title: service.name,
    description: service.description,
    price: service.price,
    currency: service.price > 0 ? 'KZT' : '',
  }));
}

function serviceToPricingItem(service: ParsedService, index: number, blueprint: NicheBlueprint): PricingItem {
  const seed = blueprint.services[index] ?? blueprint.services[0] ?? DEFAULT_SERVICES[0];
  return {
    id: `service-${index + 1}`,
    name: service.title,
    description: service.description || seed.description,
    price: service.price,
    currency: (service.currency || 'KZT') as PricingItem['currency'],
    period: seed.duration ? `${seed.duration} min` : undefined,
    featured: index === 1 || (index === 0 && service.price === 0),
    duration: seed.duration,
    priceType: service.price > 0 ? 'fixed' : 'from',
    isBookable: true,
    availableDays: ['by_appointment'],
  };
}

function serviceToCatalogItem(service: ParsedService, index: number, blueprint: NicheBlueprint): CatalogItem {
  const seed = blueprint.services[index] ?? blueprint.services[0] ?? DEFAULT_SERVICES[0];
  return {
    id: `item-${index + 1}`,
    name: service.title,
    description: service.description || seed.description,
    price: service.price > 0 ? service.price : seed.price,
    currency: (service.currency || 'KZT') as CatalogItem['currency'],
  };
}

function buildProfileBio(userInfo: SmartBuilderUserInfo, blueprint: NicheBlueprint): string {
  const bio = cleanText(userInfo.bio);
  if (bio) return extractUrlFromText(bio).remainder || bio;
  if (userInfo.expertOffer) return cleanText(userInfo.expertOffer);
  return blueprint.promise;
}

function resolvePrimaryUrl(userInfo: SmartBuilderUserInfo, socialsText: string, contactsText: string): string {
  const { url } = extractUrlFromText(`${userInfo.bio} ${userInfo.mediaLinks}`);
  if (url) return url;

  const contacts = extractContactsPipeline(contactsText);
  const telegram = contacts.find((contact) => contact.platform === 'telegram');
  if (telegram) return `https://t.me/${telegram.username.replace(/^@/, '')}`;

  const phone = contacts.find((contact) => contact.platform === 'whatsapp');
  if (phone) return `https://wa.me/${phone.username.replace(/[^\d]/g, '')}`;

  const socials = extractSocialsPipeline(socialsText);
  return socials[0]?.url ?? '#contact';
}

function applyCommonStyle<T extends Block>(
  block: T,
  blockSize: BlockSizePreset,
  index: number,
): T {
  return {
    ...block,
    blockSize,
    blockStyle: {
      padding: index === 0 ? 'lg' : 'md',
      borderRadius: 'lg',
      animation: index < 2 ? 'scale-in' : 'fade-in',
      animationDelay: Math.min(index * 80, 480),
      hoverEffect: index > 1 ? 'lift' : undefined,
      ...block.blockStyle,
    },
  };
}

function createTrustText(blueprint: NicheBlueprint): string {
  const lines = blueprint.proof.map((item) => `- ${item}`);
  return ['### Why customers choose this offer', ...lines].join('\n');
}

function qualityScore(blocks: Block[]): number {
  const hasProfile = blocks.some((block) => block.type === 'profile');
  const hasOffer = blocks.some((block) => block.type === 'pricing' || block.type === 'catalog');
  const hasCta = blocks.some((block) => block.type === 'button' || block.type === 'booking' || block.type === 'form');
  const hasContact = blocks.some((block) => block.type === 'messenger' || block.type === 'socials' || block.type === 'form');
  const hasTrust = blocks.some((block) => block.type === 'testimonial' || block.type === 'faq' || block.type === 'text');
  return [hasProfile, hasOffer, hasCta, hasContact, hasTrust].filter(Boolean).length * 20;
}

function isMessengerContact(contact: ParsedMessenger): contact is MessengerContact {
  return contact.platform !== 'email';
}

export function buildSmartPage(input: SmartPageBuilderInput): SmartPageBuilderResult {
  const now = input.now ?? Date.now();
  const nextId = nextIdFactory(now);
  const goal = input.goal ?? input.userInfo.goal;
  const blueprint = BLUEPRINTS[input.niche] ?? BLUEPRINTS.other;
  const revenueMode = resolveRevenueMode(input.niche, goal);
  const parsedServices = mergeServices(extractServicesPipeline(input.userInfo.services || input.userInfo.expertOffer || ''), blueprint);
  const { location, remainder: contactsWithoutAddress } = extractLocation(input.userInfo.contacts);
  const parsedContacts = extractContactsPipeline(contactsWithoutAddress || input.userInfo.contacts);
  const parsedSocials = extractSocialsPipeline(input.userInfo.socials);
  const primaryUrl = resolvePrimaryUrl(input.userInfo, input.userInfo.socials, input.userInfo.contacts);
  const profile = {
    name: cleanText(input.userInfo.name) || 'My Business',
    bio: buildProfileBio(input.userInfo, blueprint),
  };

  const blocks: Block[] = [];
  const appliedRules: string[] = [];

  const profileBlock = createBlock('profile') as ProfileBlock;
  blocks.push({
    ...profileBlock,
    id: nextId('profile'),
    name: profile.name,
    bio: profile.bio,
    avatarIcon: blueprint.avatarIcon,
    verified: true,
    verifiedColor: revenueMode === 'commerce' ? 'gold' : 'blue',
    avatarFrame: revenueMode === 'brand' ? 'gradient-purple' : 'gradient',
    shadowStyle: 'medium',
    coverGradient: revenueMode === 'appointment' ? 'light' : 'primary',
    blockSize: 'wide',
  });
  appliedRules.push('identity-first-profile');

  const ctaBlock = createBlock('button') as ButtonBlock;
  blocks.push({
    ...ctaBlock,
    id: nextId('button'),
    title: blueprint.cta,
    url: primaryUrl,
    width: 'full',
    size: 'lg',
    hoverEffect: 'glow',
    blockSize: 'wide',
  });
  appliedRules.push('primary-cta-before-details');

  const promiseBlock = createBlock('text') as TextBlock;
  blocks.push({
    ...promiseBlock,
    id: nextId('text'),
    content: `## ${blueprint.profession}\n${blueprint.promise}`,
    style: 'paragraph',
    blockSize: 'wide',
  });

  if (revenueMode === 'commerce') {
    const catalogBlock = createBlock('catalog') as CatalogBlock;
    blocks.push({
      ...catalogBlock,
      id: nextId('catalog'),
      title: 'Offers',
      items: parsedServices.map((service, index) => serviceToCatalogItem(service, index, blueprint)),
      layout: 'grid',
      showPrices: true,
      currency: 'KZT',
      blockSize: 'wide',
    });
    appliedRules.push('commerce-catalog');
  } else {
    const pricingBlock = createBlock('pricing') as PricingBlock;
    blocks.push({
      ...pricingBlock,
      id: nextId('pricing'),
      title: revenueMode === 'event' ? 'Formats and tickets' : 'Services',
      items: parsedServices.map((service, index) => serviceToPricingItem(service, index, blueprint)),
      currency: 'KZT',
      blockSize: 'wide',
    });
    appliedRules.push('service-pricing');
  }

  if (revenueMode === 'appointment' || revenueMode === 'event') {
    const bookingBlock = createBlock('booking') as BookingBlock;
    blocks.push({
      ...bookingBlock,
      id: nextId('booking'),
      title: revenueMode === 'event' ? 'Reserve your spot' : 'Book a time',
      description: 'Choose a convenient slot and send a request in one step.',
      slotDuration: revenueMode === 'event' ? 90 : 60,
      requirePhone: true,
      requireEmail: revenueMode === 'event',
      buttonText: revenueMode === 'event' ? 'Reserve' : 'Book',
      blockSize: 'wide',
    });
    appliedRules.push('booking-for-time-based-offer');
  }

  const trustBlock = createBlock('text') as TextBlock;
  blocks.push({
    ...trustBlock,
    id: nextId('text'),
    content: createTrustText(blueprint),
    style: 'paragraph',
    blockSize: 'wide',
  });

  const testimonialBlock = createBlock('testimonial') as TestimonialBlock;
  blocks.push({
    ...testimonialBlock,
    id: nextId('testimonial'),
    title: 'Client notes',
    testimonials: [
      {
        name: 'Client',
        role: 'Verified request',
        rating: 5,
        text: 'Clear communication, thoughtful process, and a result that matched the request.',
      },
      {
        name: 'Repeat customer',
        role: 'Returned after first booking',
        rating: 5,
        text: 'The next step was obvious, and it was easy to get in touch again.',
      },
    ],
    blockSize: 'wide',
  });

  if (parsedContacts.length > 0) {
    const messengerContacts: MessengerBlock['messengers'] = parsedContacts
      .filter(isMessengerContact)
      .map((contact) => ({
        platform: contact.platform,
        username: contact.username,
        message: `Hello, I want to contact ${profile.name}`,
      }));

    if (messengerContacts.length > 0) {
      const messengerBlock = createBlock('messenger') as MessengerBlock;
      blocks.push({
        ...messengerBlock,
        id: nextId('messenger'),
        title: 'Fast contact',
        messengers: messengerContacts,
        blockSize: parsedSocials.length > 0 ? 'small' : 'wide',
      });
      appliedRules.push('parsed-messenger-contact');
    }
  }

  const emailContact = parsedContacts.find((contact) => contact.platform === 'email');
  if (!parsedContacts.length || emailContact) {
    const formBlock = createBlock('form') as FormBlock;
    blocks.push({
      ...formBlock,
      id: nextId('form'),
      title: revenueMode === 'lead' ? 'Request a consultation' : 'Send a request',
      submitEmail: emailContact?.username ?? '',
      fields: [
        { name: 'Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'Phone or Telegram', type: 'text', required: true, placeholder: '+7...' },
        { name: 'Request', type: 'textarea', required: false, placeholder: 'What should we help with?' },
      ],
      buttonText: 'Send request',
      blockSize: parsedSocials.length > 0 ? 'small' : 'wide',
    });
    appliedRules.push('lead-capture-fallback');
  }

  if (parsedSocials.length > 0) {
    const socialsBlock = createBlock('socials') as SocialsBlock;
    blocks.push({
      ...socialsBlock,
      id: nextId('socials'),
      title: 'Follow and check more',
      platforms: parsedSocials.map((social, index) => ({
        id: `social-${index + 1}`,
        platform: social.platform,
        icon: social.platform,
        name: social.platform,
        url: social.url,
      })),
      blockSize: 'small',
    });
    appliedRules.push('parsed-social-proof');
  }

  if (location) {
    const mapBlock = createBlock('map');
    blocks.push({
      ...mapBlock,
      id: nextId('map'),
      address: location,
      blockSize: 'wide',
    } as Block);
    appliedRules.push('location-map');
  }

  const faqBlock = createBlock('faq') as FAQBlock;
  blocks.push({
    ...faqBlock,
    id: nextId('faq'),
    title: 'Questions before booking',
    items: [
      {
        id: 'faq-1',
        question: 'How fast do you reply?',
        answer: 'Most requests are answered the same day.',
      },
      {
        id: 'faq-2',
        question: 'How do I choose the right offer?',
        answer: 'Send a short request and we will suggest the best first step.',
      },
    ],
    blockSize: 'wide',
  });

  const polishedBlocks = blocks.map((block, index) => {
    const preferredSize = block.blockSize ?? (index < 4 ? 'wide' : 'small');
    return applyCommonStyle(block, preferredSize, index);
  });

  return {
    profile,
    blocks: polishedBlocks,
    diagnostics: {
      revenueMode,
      qualityScore: qualityScore(polishedBlocks),
      appliedRules,
    },
  };
}
