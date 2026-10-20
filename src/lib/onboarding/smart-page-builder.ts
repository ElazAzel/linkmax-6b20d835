/** One local builder shared by the onboarding wizard and template personalization.
 * No model, token balance, edge function, or fabricated business facts.
 */
import { generateBlocksFromTemplate } from '@/lib/blocks/internal-builder';
import { getAlgorithmicTemplateForNiche } from '@/lib/blocks/algorithmic-templates';
import type { Block } from '@/types/page';
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
  businessEnabled?: boolean;
}

type RevenueMode = 'appointment' | 'lead' | 'commerce' | 'event' | 'brand';

export interface SmartPageBuilderResult {
  profile: { name: string; bio: string };
  blocks: Block[];
  diagnostics: { revenueMode: RevenueMode; qualityScore: number; appliedRules: string[] };
}

/** Match words/stems, not arbitrary fragments ("it" used to match "fitness"). */
export function inferSmartPageNiche(text: string): Niche {
  const rules: Array<[Niche, RegExp]> = [
    ['beauty', /\bbeauty\b|\bsalon\b|makeup|lashes|brow|\bnail|\bhair|cosmet|маникюр|педикюр|ресниц|бров|салон|космет|шаштараз/i],
    ['fitness', /fitness|\bgym\b|workout|\byoga\b|pilates|фитнес|тренер|трениров|йога|спорт/i],
    ['health', /\bhealth\b|doctor|clinic|therapy|psycholog|wellness|психолог|терап|врач|клиник|здоров|дәрігер/i],
    ['education', /teacher|tutor|course|lesson|school|education|mentor|репетитор|учител|препода|обучен|урок|курс|мұғалім|сабақ/i],
    ['realestate', /real\s*estate|realtor|property|apartment|недвижим|риелтор|риэлтор|квартир|жиль|пәтер/i],
    ['events', /\bevent|workshop|masterclass|conference|ticket|мероприят|свадьб|конференц|мастер.класс|билет|той/i],
    ['food', /\bfood\b|chef|restaurant|cafe|bakery|catering|кондитер|торт|повар|ресторан|кофе|кафе|выпечк|наубай/i],
    ['tech', /developer|software|\bit\b|\bsaas\b|automation|\bcode\b|разработ|программ|автоматизац|сайт|бағдарлама/i],
    ['fashion', /fashion|stylist|wardrobe|clothes|стилист|одежд|гардероб|киім/i],
    ['travel', /travel|\btour\b|\bguide\b|\btrip\b|туризм|путешеств|экскурс|саяхат/i],
    ['art', /design|photo|\bvideo\b|artist|creative|portfolio|дизайн|фотограф|иллюст|худож|портфолио|суретші/i],
    ['music', /music|\bdj\b|singer|\bband\b|producer|музык|певец|певица|диджей|әнші/i],
    ['business', /business|agency|marketing|\bb2b\b|бизнес|агентство|маркет|сатылым/i],
    ['expert', /expert|consultant|\bcoach\b|advisor|freelancer|эксперт|консульт|коуч|фриланс/i],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';
}

function revenueMode(niche: Niche, goal?: OnboardingGoal | null): RevenueMode {
  if (goal === 'brand') return 'brand';
  if (goal === 'events') return 'event';
  if (goal === 'sales') return 'commerce';
  if (['beauty', 'fitness', 'health', 'education', 'services'].includes(niche)) return 'appointment';
  if (['food', 'fashion'].includes(niche)) return 'commerce';
  if (['music', 'events'].includes(niche)) return 'event';
  return niche === 'art' ? 'brand' : 'lead';
}

export function buildSmartPage(input: SmartPageBuilderInput): SmartPageBuilderResult {
  const userInfo = {
    ...input.userInfo,
    name: input.userInfo.name.trim(),
    bio: (input.userInfo.bio || input.userInfo.expertOffer || '').trim(),
    services: input.userInfo.services || input.userInfo.expertOffer || '',
    goal: input.goal ?? input.userInfo.goal,
  };
  const blocks = generateBlocksFromTemplate(getAlgorithmicTemplateForNiche(input.niche), userInfo, {
    now: input.now,
    businessEnabled: input.businessEnabled ?? false,
    seed: `${input.niche}:${userInfo.name}`,
  });
  const profile = blocks.find((block) => block.type === 'profile');
  const facts = [
    Boolean(userInfo.name),
    Boolean(userInfo.bio),
    blocks.some((block) => ['pricing', 'catalog', 'text'].includes(block.type)),
    blocks.some((block) => ['image', 'carousel', 'video'].includes(block.type)),
    blocks.some((block) => block.type === 'socials' || block.type === 'link' ||
      (block.type === 'messenger' && block.messengers.some((contact) => Boolean(contact.username)))),
  ];
  return {
    profile: { name: userInfo.name, bio: profile?.type === 'profile' ? String(profile.bio) : userInfo.bio },
    blocks,
    diagnostics: {
      revenueMode: revenueMode(input.niche, userInfo.goal),
      qualityScore: facts.filter(Boolean).length * 20,
      appliedRules: ['local-data-only', 'supplied-prices-only', 'no-fabricated-proof', `niche:${input.niche}`, 'art-direction'],
    },
  };
}
