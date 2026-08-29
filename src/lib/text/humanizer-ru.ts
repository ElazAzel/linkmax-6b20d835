/**
 * humanizer-ru — детерминированный слой «человечности» русского текста.
 *
 * Портирован из скилла ilyautov/humanizer-ru (MIT): жёсткие баны, лексические
 * маркеры быстрого сканера и артефакты копипасты из чат-ботов. Здесь только
 * грепабельная половина — регулярки и подстановки, без LLM.
 *
 * Соответствует правилу проекта Algorithmic-First: правки применяются
 * детерминированно, без обращения к моделям.
 */

export interface MarkerHit {
  category: string;
  marker: string;
  count: number;
}

export interface HumanizeReport {
  hardBans: MarkerHit[];
  markers: MarkerHit[];
  /** 0..100, где 100 — «читается как живой русский текст». */
  score: number;
  /** Разброс длин предложений: у людей выше. */
  burstiness: number;
  wordCount: number;
}

export interface HumanizeResult extends HumanizeReport {
  text: string;
  /** Правила, которые реально сработали. */
  applied: string[];
}

/** 20 жёстких банов. Любое попадание считается провалом аудита. */
export const HARD_BANS: ReadonlyArray<readonly [string, RegExp]> = [
  ['Не просто X, а Y', /\bне\s+просто\b[^.!?]{1,40}?\bа\b/gi],
  ['Не только X, но и Y', /\bне\s+только\b[^.!?]{1,40}?\bно\s+и\b/gi],
  ['В современном мире', /\bв\s+современном\s+мире\b/gi],
  ['Стоит отметить, что', /\bстоит\s+отметить\b/gi],
  ['Важно понимать, что', /\bважно\s+понимать\b/gi],
  ['Данный/Данная/Данное', /\bданн(ый|ая|ое|ого|ой|ом|ую)\b/gi],
  ['Является', /\bявля(ется|ются)\b/gi],
  ['Играет важную/ключевую роль', /\bигра(ет|ют)\s+(важн[а-яё]*|ключев[а-яё]*)\s+роль\b/gi],
  ['Можно с уверенностью сказать', /\bможно\s+с\s+уверенностью\s+сказать\b/gi],
  ['Подводя итог / Таким образом', /\bподводя\s+итог\b|(?:^|[.!?…:;]\s+|\n\s*(?:[-*•]\s*)?|,\s*)таким\s+образом\s*,/gi],
  ['Длинное тире', /—/g],
  ['В условиях [прил.] [сущ.]', /\bв\s+условиях\s+[а-яё]+/gi],
  ['Погрузимся / посмотрим поближе', /\b(погрузимся|посмотрим\s+[а-яё]+\s+поближе|давайте\s+посмотрим)\b/gi],
  ['И вот здесь начинается самое интересное', /\bвот\s+(здесь|тут)\s+начинается\s+самое\s+интересное\b/gi],
  ['Раскрыть потенциал', /\bраскры(ть|ва[а-яё]+)\s+потенциал\b/gi],
  ['Вывести на новый уровень', /\bвыв(ести|одит)\s+на\s+новый\s+уровень\b/gi],
  ['Комплексный подход/решение', /\bкомплексн(ый|ое|ого|ым)\s+(подход[а-яё]*|решени[а-яё]+)\b/gi],
  ['В связи с этим', /\bв\s+связи\s+с\s+этим\b/gi],
  [
    'Открывает новые горизонты/перспективы/возможности',
    /\bоткрыва(ет|ют)\s+новые\s+(горизонт[а-яё]+|перспектив[а-яё]+|возможност[а-яё]+)\b/gi,
  ],
];

/** Лексические категории быстрого сканера (мягкие маркеры). */
export const SCANNER: Readonly<Record<string, readonly RegExp[]>> = {
  Канцелярит: [
    /осуществлени[а-яё]*/gi,
    /реализаци[а-яё]*/gi,
    /внедрени[а-яё]*/gi,
    /оптимизаци[а-яё]*/gi,
    /функционировани[а-яё]*/gi,
    /взаимодействи[а-яё]*/gi,
    /\bв\s+рамках\b/gi,
    /\bв\s+целях\b/gi,
    /\bв\s+контексте\b/gi,
    /\bпосредством\b/gi,
    /\bв\s+соответствии\s+с\b/gi,
    /внимание\s+удел(яется|ено)/gi,
  ],
  Кальки: [
    /\bчто\s+касается\b/gi,
    /\bв\s+то\s+время\s+как\b/gi,
    /\bс\s+другой\s+стороны\b/gi,
    /\bтем\s+не\s+менее\b/gi,
    /\bнесмотря\s+на\s+то,?\s+что\b/gi,
    /\bстоит\s+помнить\b/gi,
    /\bследует\s+учитывать\b/gi,
    /\bнеобходимо\s+отметить\b/gi,
  ],
  Раздувание: [
    /\bключев[а-яё]+/gi,
    /\bважнейш[а-яё]+/gi,
    /\bколоссальн[а-яё]+/gi,
    /\bфундаментальн[а-яё]+/gi,
    /невозможно\s+переоценить/gi,
  ],
  'Триада-отрицание': [
    /(?:^|[.!?…\n]\s*)(?:без|ни)\s+[^.!?\n]{1,40}[.!?]\s+(?:без|ни)\s+[^.!?\n]{1,40}[.!?]\s+(?:только|просто|лишь)\b/gi,
  ],
  'Финальная мораль': [
    /\bмораль\s+(?:этой|всей\s+этой|сей)\s+истори(?:и|ю|ей)\b/gi,
    /\b(?:эта|вся\s+эта)\s+истори(?:я|и)\s+(?:учит|научила|учила)\s+(?:нас|нам)\b/gi,
  ],
  'Артефакты копипасты': [
    /:contentReference/gi,
    /oai_citation/gi,
    /utm_source=(?:chatgpt\.com|openai)/gi,
    /oaicite:\d+/gi,
    /turn\d+(?:search|fetch|file)\d+/gi,
    /citeturn\d+[a-z]+\d+/gi,
    /【\d+(?::\d+)?†source】/g,
    /\[citation:\d+\]/gi,
    /\[cite:\s*\d+\]/gi,
    /\[span_\d+\]\(start_span\)/gi,
    /<\/?think>/gi,
    /[\ue200-\ue204]/g,
    /grok_render_citation_card_json/gi,
  ],
};

/** Детерминированные замены: канцелярит и клише на живые обороты. */
const REWRITES: ReadonlyArray<readonly [string, RegExp, string]> = [
  ['Артефакты копипасты', /\s*(?::contentReference|oai_citation|oaicite:\d+|\[citation:\d+\]|\[cite:\s*\d+\]|【\d+(?::\d+)?†source】|turn\d+(?:search|fetch|file)\d+|citeturn\d+[a-z]+\d+|\[span_\d+\]\(start_span\)|<\/?think>|grok_render_citation_card_json)\s*/gi, ' '],
  ['Невидимые разделители', /[\ue200-\ue204\u200b\u200e\u200f]/g, ''],
  ['utm чат-бота', /[?&]utm_source=(?:chatgpt\.com|openai)[^\s)"']*/gi, ''],
  ['В современном мире', /\bв\s+современном\s+мире[,\s]+/gi, ''],
  ['Стоит отметить, что', /\b(?:стоит\s+отметить|необходимо\s+отметить|важно\s+понимать|стоит\s+помнить|следует\s+учитывать)\s*,?\s*(?:что)?\s*/gi, ''],
  ['Можно с уверенностью сказать', /\bможно\s+с\s+уверенностью\s+сказать\s*,?\s*(?:что)?\s*/gi, ''],
  ['Таким образом', /(^|[.!?…]\s+|\n)таким\s+образом\s*,\s*/gi, '$1Значит, '],
  ['Подводя итог', /\bподводя\s+итог[а-яё]*\s*,?\s*/gi, 'Короче: '],
  ['В связи с этим', /\bв\s+связи\s+с\s+этим\b/gi, 'поэтому'],
  ['Является', /\bявля(?:ется|ются)\b/gi, 'это'],
  ['Данный → этот', /\bданный\b/gi, 'этот'],
  ['Данная → эта', /\bданная\b/gi, 'эта'],
  ['Данное → это', /\bданное\b/gi, 'это'],
  ['Данного → этого', /\bданного\b/gi, 'этого'],
  ['Данной → этой', /\bданной\b/gi, 'этой'],
  ['Данном → этом', /\bданном\b/gi, 'этом'],
  ['Данную → эту', /\bданную\b/gi, 'эту'],
  ['В рамках', /\bв\s+рамках\b/gi, 'в'],
  ['В целях', /\bв\s+целях\b/gi, 'чтобы'],
  ['Посредством', /\bпосредством\b/gi, 'через'],
  ['В соответствии с', /\bв\s+соответствии\s+с\b/gi, 'по'],
  ['Осуществлять', /\bосуществля(ет|ют|ем)\s+/gi, ''],
  ['Осуществление', /\bосуществлени[ея]\s+/gi, ''],
  ['Комплексный подход', /\bкомплексн(?:ый|ое|ого|ым)\s+(подход[а-яё]*|решени[а-яё]+)/gi, 'рабочий $1'],
  ['Раскрыть потенциал', /\bраскры(?:ть|ва[а-яё]+)\s+потенциал\b/gi, 'выжать максимум'],
  ['Вывести на новый уровень', /\bвыв(?:ести|одит)\s+на\s+новый\s+уровень\b/gi, 'сделать заметно лучше'],
  ['Открывает новые горизонты', /\bоткрыва(?:ет|ют)\s+новые\s+(?:горизонт[а-яё]+|перспектив[а-яё]+|возможност[а-яё]+)\b/gi, 'даёт больше свободы'],
  ['Играет ключевую роль', /\bигра(?:ет|ют)\s+(?:важн[а-яё]*|ключев[а-яё]*)\s+роль\b/gi, 'решает дело'],
  ['Погрузимся', /\b(?:погрузимся|давайте\s+посмотрим)\b[,\s]*/gi, ''],
  ['В условиях', /\bв\s+условиях\s+/gi, 'при '],
  ['Длинное тире', /\s*—\s*/g, ' - '],
  ['Декоративные эмодзи', /(^|\n)\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*(?=[А-ЯЁA-Z])/gu, '$1'],
  ['Болд-декор', /\*\*(.+?)\*\*/g, '$1'],
];

/** Инструкция для системных промптов: пишем сразу по-человечески. */
export const HUMANIZER_RU_PROMPT = `
ЧЕЛОВЕЧНОСТЬ РУССКОГО ТЕКСТА (обязательно):
- Запрещены: «в современном мире», «стоит отметить», «важно понимать», «данный/данная», «является», «играет ключевую роль», «таким образом», «подводя итог», «в связи с этим», «комплексный подход», «раскрыть потенциал», «вывести на новый уровень», «открывает новые возможности», «не просто X, а Y», «не только X, но и Y», «в условиях ...», «погрузимся».
- Без канцелярита: вместо «осуществление внедрения» - «внедряем»; вместо «в рамках/в целях/посредством/в соответствии с» - «в/чтобы/через/по».
- Без длинного тире (—), без декоративных эмодзи в начале строк, без болда ради красоты.
- Живой ритм: чередуй короткие и длинные предложения, добавляй частицы («же», «ведь», «вот»), конкретные цифры и факты вместо общих оценок.
- Пиши как человек, который делал это руками: конкретика, глаголы, обращение к читателю.
`.trim();

const RU_RE = /[а-яё]/i;

/** Есть ли в тексте русские буквы (иначе очеловечивание не применяем). */
export function isRussian(text: string): boolean {
  return RU_RE.test(text);
}

function countMatches(text: string, re: RegExp): number {
  const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let n = 0;
  while (rx.exec(text) !== null) {
    n += 1;
    if (n > 500) break;
  }
  return n;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Коэффициент вариации длин предложений. У живого текста обычно > 0.45. */
export function burstiness(text: string): number {
  const lens = sentences(text).map((s) => s.split(/\s+/).length);
  if (lens.length < 2) return 0;
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  if (!mean) return 0;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  return Math.sqrt(variance) / mean;
}

/** Аудит без правок: что именно выдаёт машину. */
export function auditRu(text: string): HumanizeReport {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hardBans: MarkerHit[] = [];
  for (const [name, re] of HARD_BANS) {
    const count = countMatches(text, re);
    if (count > 0) hardBans.push({ category: 'HARD BAN', marker: name, count });
  }

  const markers: MarkerHit[] = [];
  for (const [category, list] of Object.entries(SCANNER)) {
    for (const re of list) {
      const count = countMatches(text, re);
      if (count > 0) markers.push({ category, marker: re.source, count });
    }
  }

  const per1k = wordCount ? 1000 / Math.max(wordCount, 40) : 1;
  const hardPenalty = hardBans.reduce((a, h) => a + h.count, 0) * 6 * Math.min(per1k, 1.5);
  const softPenalty = markers.reduce((a, h) => a + h.count, 0) * 2 * Math.min(per1k, 1.5);
  const b = burstiness(text);
  const rhythmPenalty = b > 0 && b < 0.45 ? (0.45 - b) * 40 : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - hardPenalty - softPenalty - rhythmPenalty)));

  return { hardBans, markers, score, burstiness: Number(b.toFixed(2)), wordCount };
}

/**
 * Очеловечивает русский текст детерминированными заменами и возвращает аудит
 * итогового варианта. Не трогает текст без русских букв.
 */
export function humanizeRu(input: string): HumanizeResult {
  const original = typeof input === 'string' ? input : '';
  if (!original.trim() || !isRussian(original)) {
    return { text: original, applied: [], ...auditRu(original) };
  }

  let text = original;
  const applied: string[] = [];

  for (const [name, re, replacement] of REWRITES) {
    const rx = new RegExp(re.source, re.flags);
    if (rx.test(text)) {
      text = text.replace(new RegExp(re.source, re.flags), replacement);
      applied.push(name);
    }
  }

  text = text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    // Заглавная буква после удалённого зачина.
    .replace(/(^|[.!?…]\s+|\n)([а-яё])/g, (_m, p1: string, p2: string) => p1 + p2.toUpperCase())
    .trim();

  return { text, applied, ...auditRu(text) };
}

/** Короткий вариант, когда нужен только текст. */
export function humanizeText(input: string): string {
  return humanizeRu(input).text;
}

const HUMANIZABLE_KEYS = new Set([
  'title',
  'subtitle',
  'heading',
  'headline',
  'description',
  'text',
  'body',
  'content',
  'bio',
  'about',
  'caption',
  'label',
  'cta',
  'cta_text',
  'button_text',
  'buttonText',
  'answer',
  'question',
  'quote',
  'summary',
  'tagline',
  'meta_description',
  'metaDescription',
  'seo_description',
]);

/** Рекурсивно очеловечивает текстовые поля JSON-ответа модели. */
export function humanizeDeep<T>(value: T, key?: string): T {
  if (typeof value === 'string') {
    return (key && HUMANIZABLE_KEYS.has(key) ? humanizeText(value) : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => humanizeDeep(v, key)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = humanizeDeep(v, k);
    }
    return out as unknown as T;
  }
  return value;
}
