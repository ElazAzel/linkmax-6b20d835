import type { DepositConfiguration } from '@/domain/revenue/service-offering';

export const BEAUTY_NICHES = ['nails', 'lashes', 'brows'] as const;
export type BeautyNiche = (typeof BEAUTY_NICHES)[number];

export const REVENUE_KIT_STEPS = [
  'identity',
  'services',
  'availability',
  'deposit-policy',
  'trust-preview',
  'publish-distribute',
] as const;
export type RevenueKitStep = (typeof REVENUE_KIT_STEPS)[number];

export type RevenueKitLocale = 'ru' | 'kk' | 'en';
export type RevenueKitI18nText = Record<RevenueKitLocale, string>;

export interface RevenueKitServiceDraft {
  presetId: string;
  name: RevenueKitI18nText;
  description: RevenueKitI18nText;
  durationMinutes: number;
  priceAmount: string;
  currency: 'KZT';
  active: boolean;
  displayOrder: number;
}

export interface RevenueKitDraft {
  version: 1;
  kitId: 'beauty-v1';
  niche: BeautyNiche;
  identity: {
    displayName: string;
    city: string;
    specialization: string;
    avatarUrl: string | null;
    contactChannel: 'whatsapp' | 'telegram';
    contactValue: string;
  };
  services: RevenueKitServiceDraft[];
  availability: {
    weekdays: number[];
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    timezone: 'Asia/Almaty';
    bookingHorizonDays: number;
  };
  depositPolicy: {
    deposit: DepositConfiguration;
    cancellationWindowHours: number;
    paymentInstructions: RevenueKitI18nText;
  };
  trust: {
    portfolioUrls: string[];
    policyAccepted: boolean;
  };
  distribution: {
    publish: boolean;
    channels: Array<'instagram' | 'telegram' | 'whatsapp'>;
  };
}

export const BEAUTY_REVENUE_KIT = Object.freeze({
  id: 'beauty-v1' as const,
  version: 1 as const,
  supportedNiches: BEAUTY_NICHES,
  requiredBlockTypes: Object.freeze(['profile', 'pricing', 'booking', 'messenger'] as const),
  currency: 'KZT' as const,
  defaultTimezone: 'Asia/Almaty' as const,
  steps: REVENUE_KIT_STEPS,
});

type ServicePreset = Readonly<RevenueKitServiceDraft>;

const SERVICE_PRESETS: Readonly<Record<BeautyNiche, readonly ServicePreset[]>> = Object.freeze({
  nails: Object.freeze([
    Object.freeze({
      presetId: 'nails-gel-manicure',
      name: { ru: 'Маникюр с покрытием', kk: 'Жабынды маникюр', en: 'Gel manicure' },
      description: {
        ru: 'Комбинированный маникюр и однотонное покрытие',
        kk: 'Комбинацияланған маникюр және бір түсті жабын',
        en: 'Combined manicure with a single-color gel finish',
      },
      durationMinutes: 90,
      priceAmount: '7000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 0,
    }),
    Object.freeze({
      presetId: 'nails-pedicure',
      name: { ru: 'Педикюр с покрытием', kk: 'Жабынды педикюр', en: 'Gel pedicure' },
      description: {
        ru: 'Обработка стоп и однотонное покрытие',
        kk: 'Табанды өңдеу және бір түсті жабын',
        en: 'Foot care with a single-color gel finish',
      },
      durationMinutes: 120,
      priceAmount: '9000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 1,
    }),
    Object.freeze({
      presetId: 'nails-removal-care',
      name: { ru: 'Снятие и уход', kk: 'Жабынды алу және күтім', en: 'Removal and care' },
      description: {
        ru: 'Без нового покрытия',
        kk: 'Жаңа жабынсыз',
        en: 'Removal without a new coating',
      },
      durationMinutes: 45,
      priceAmount: '2500.00',
      currency: 'KZT',
      active: true,
      displayOrder: 2,
    }),
  ]),
  lashes: Object.freeze([
    Object.freeze({
      presetId: 'lashes-classic',
      name: { ru: 'Классическое наращивание', kk: 'Классикалық кірпік ұзарту', en: 'Classic lash extensions' },
      description: { ru: 'Естественный объём', kk: 'Табиғи көлем', en: 'Natural-looking volume' },
      durationMinutes: 120,
      priceAmount: '10000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 0,
    }),
    Object.freeze({
      presetId: 'lashes-volume-2d',
      name: { ru: 'Объём 2D', kk: '2D көлем', en: '2D volume lashes' },
      description: { ru: 'Мягкий выразительный объём', kk: 'Жұмсақ әрі айқын көлем', en: 'Soft defined volume' },
      durationMinutes: 150,
      priceAmount: '13000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 1,
    }),
    Object.freeze({
      presetId: 'lashes-lamination',
      name: { ru: 'Ламинирование ресниц', kk: 'Кірпікті ламинациялау', en: 'Lash lift' },
      description: { ru: 'Изгиб, окрашивание и уход', kk: 'Иілім, бояу және күтім', en: 'Lift, tint and care' },
      durationMinutes: 75,
      priceAmount: '9000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 2,
    }),
  ]),
  brows: Object.freeze([
    Object.freeze({
      presetId: 'brows-shape-tint',
      name: { ru: 'Коррекция и окрашивание', kk: 'Қасты түзету және бояу', en: 'Brow shaping and tint' },
      description: { ru: 'Форма и стойкое окрашивание', kk: 'Пішін және тұрақты бояу', en: 'Shape and long-lasting tint' },
      durationMinutes: 60,
      priceAmount: '6000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 0,
    }),
    Object.freeze({
      presetId: 'brows-lamination',
      name: { ru: 'Ламинирование бровей', kk: 'Қасты ламинациялау', en: 'Brow lamination' },
      description: { ru: 'Укладка, коррекция и уход', kk: 'Сәндеу, түзету және күтім', en: 'Styling, shaping and care' },
      durationMinutes: 75,
      priceAmount: '8000.00',
      currency: 'KZT',
      active: true,
      displayOrder: 1,
    }),
    Object.freeze({
      presetId: 'brows-shape',
      name: { ru: 'Коррекция формы', kk: 'Қас пішінін түзету', en: 'Brow shaping' },
      description: { ru: 'Без окрашивания', kk: 'Бояусыз', en: 'Shaping without tint' },
      durationMinutes: 30,
      priceAmount: '3500.00',
      currency: 'KZT',
      active: true,
      displayOrder: 2,
    }),
  ]),
});

function cloneText(value: RevenueKitI18nText): RevenueKitI18nText {
  return { ru: value.ru, kk: value.kk, en: value.en };
}

export function createBeautyPreset(niche: BeautyNiche): RevenueKitDraft {
  if (!BEAUTY_NICHES.includes(niche)) {
    throw new Error('unsupported_beauty_niche');
  }

  return {
    version: 1,
    kitId: 'beauty-v1',
    niche,
    identity: {
      displayName: '',
      city: '',
      specialization: niche,
      avatarUrl: null,
      contactChannel: 'whatsapp',
      contactValue: '',
    },
    services: SERVICE_PRESETS[niche].map((service) => ({
      ...service,
      name: cloneText(service.name),
      description: cloneText(service.description),
    })),
    availability: {
      weekdays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '18:00',
      breakStart: null,
      breakEnd: null,
      timezone: 'Asia/Almaty',
      bookingHorizonDays: 30,
    },
    depositPolicy: {
      deposit: { mode: 'none', value: '0.00' },
      cancellationWindowHours: 24,
      paymentInstructions: { ru: '', kk: '', en: '' },
    },
    trust: {
      portfolioUrls: [],
      policyAccepted: false,
    },
    distribution: {
      publish: true,
      channels: ['instagram', 'whatsapp'],
    },
  };
}
