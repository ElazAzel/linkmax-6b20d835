import { Block } from '@/types/blocks';

/**
 * Page RAG: a per-page knowledge index built from the author's blocks.
 * Runs fully in the browser (BM25 + light stemming + synonyms + intents),
 * so the public chat never spends AI tokens.
 */

export type ExpertSource = 'faq' | 'pricing' | 'about' | 'contact' | 'booking' | 'product' | 'content' | 'system';

export interface ExpertEngineMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  source?: ExpertSource;
}

interface Chunk {
  text: string;          // answer text shown to the visitor
  search: string;        // text used for retrieval
  category: ExpertSource;
  blockType: string;
  title?: string;
  tokens: string[];
  tf: Map<string, number>;
}

type Intent = 'price' | 'contact' | 'booking' | 'about' | 'product' | 'greeting' | 'thanks' | 'location' | 'schedule';

const INTENT_STEMS: Record<Intent, string[]> = {
  price: ['цен', 'сколь', 'стои', 'прайс', 'тариф', 'оплат', 'деньг', 'руб', 'тенг', 'сум', 'price', 'cost', 'баға', 'қанша', 'нарх', 'qancha', 'скидк'],
  contact: ['связ', 'контакт', 'номер', 'телефон', 'позвон', 'напис', 'whatsapp', 'ватсап', 'вотсап', 'telegram', 'телеграм', 'инстаграм', 'instagram', 'почт', 'email', 'contact', 'байланыс', 'хабарлас', 'aloqa'],
  booking: ['запис', 'брон', 'встреч', 'консультац', 'слот', 'свобод', 'book', 'appoint', 'жазыл', 'yozil'],
  about: ['кто', 'себ', 'опыт', 'занима', 'чем', 'биограф', 'about', 'who', 'кім', 'тәжірибе', 'kim'],
  product: ['купи', 'товар', 'продукт', 'курс', 'заказ', 'услуг', 'buy', 'product', 'service', 'қызмет', 'xizmat'],
  greeting: ['привет', 'здравств', 'добр', 'hello', 'hi', 'сәлем', 'salom', 'салам'],
  thanks: ['спасиб', 'благодар', 'thank', 'рахмет', 'rahmat'],
  location: ['адрес', 'где', 'находит', 'город', 'карт', 'address', 'where', 'мекенжай', 'қай'],
  schedule: ['график', 'рабоча', 'часы', 'открыт', 'выходн', 'hours', 'кесте'],
};

const STOP = new Set(['и', 'в', 'во', 'на', 'с', 'со', 'по', 'а', 'но', 'или', 'ли', 'же', 'бы', 'не', 'что', 'как', 'это', 'у', 'к', 'о', 'об', 'от', 'до', 'для', 'за', 'из', 'мне', 'меня', 'вы', 'вас', 'вам', 'ты', 'я', 'мы', 'он', 'она', 'они', 'есть', 'подскажите', 'пожалуйста', 'скажите', 'можно', 'хочу', 'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'you', 'do', 'your']);

const RU_ENDINGS = ['иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ые', 'ие', 'ая', 'яя', 'ой', 'ей', 'ий', 'ый', 'ую', 'юю', 'ом', 'ем', 'ах', 'ях', 'ов', 'ев', 'ть', 'ся', 'сь', 'ешь', 'ете', 'ит', 'ат', 'ят', 'ют', 'ут', 'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'ь'];

function stem(word: string): string {
  if (/^[a-z]+$/.test(word)) return word.replace(/(ing|ed|es|s)$/, '') || word;
  for (const end of RU_ENDINGS) {
    if (word.length - end.length >= 3 && word.endsWith(end)) return word.slice(0, -end.length);
  }
  return word;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().replace(/ё/g, 'е').match(/[\p{L}\p{N}]+/gu) || [])
    .filter(w => w.length > 1 && !STOP.has(w))
    .map(stem);
}

/** Resolve plain / multilingual strings ({ru, en, kk}) to text. */
function txt(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    for (const k of ['ru', 'en', 'kk', 'uz']) if (typeof o[k] === 'string' && o[k]) return String(o[k]).trim();
    const first = Object.values(o).find(x => typeof x === 'string' && x);
    return first ? String(first).trim() : '';
  }
  return '';
}

const SKIP_KEYS = new Set(['id', 'type', 'blockStyle', 'schedule', 'style', 'icon', 'image', 'imageUrl', 'avatar', 'avatarUrl', 'color', 'background', 'variant', 'composition', 'sectionId', 'createdAt', 'updatedAt', 'position', 'animation']);

/** Collect human text from any block shape (flat or nested `content`). */
function collectText(v: unknown, depth = 0, out: string[] = []): string[] {
  if (depth > 4 || v == null) return out;
  const s = txt(v);
  if (s && (typeof v !== 'object' || !Array.isArray(v))) {
    if (typeof v === 'string' || typeof v === 'number' || (typeof v === 'object' && s)) {
      if (!/^https?:\/\/\S+$/.test(s) && !/^#?[0-9a-f]{6}$/i.test(s) && s.length > 1) out.push(s);
      if (typeof v !== 'object' || ['ru', 'en', 'kk', 'uz'].some(k => k in (v as object))) return out;
    }
  }
  if (Array.isArray(v)) v.forEach(x => collectText(x, depth + 1, out));
  else if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (SKIP_KEYS.has(k)) continue;
      collectText(val, depth + 1, out);
    }
  }
  return out;
}

const clip = (s: string, n = 420) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
const unique = <T,>(a: T[]) => Array.from(new Set(a));

const MESSENGER_URL: Record<string, (u: string) => string> = {
  whatsapp: u => `https://wa.me/${u.replace(/\D/g, '')}`,
  telegram: u => `https://t.me/${u.replace(/^@/, '')}`,
};

export class ExpertEngine {
  private chunks: Chunk[] = [];
  private df = new Map<string, number>();
  private avgLen = 1;
  private ownerName = '';
  private contacts: string[] = [];
  private hasBooking = false;
  private topics: string[] = [];

  constructor(blocks: Block[], seo: { title: string; description: string }) {
    this.ownerName = (seo?.title || '').split(/[—|-]/)[0].trim() || 'автора';
    this.index(blocks || [], seo || { title: '', description: '' });
  }

  private add(text: string, category: ExpertSource, blockType: string, title?: string, extraSearch = '') {
    const clean = text.replace(/\s+\n/g, '\n').trim();
    if (!clean) return;
    const search = `${title || ''} ${clean} ${extraSearch}`;
    const tokens = tokenize(search);
    if (!tokens.length) return;
    const tf = new Map<string, number>();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    this.chunks.push({ text: clean, search, category, blockType, title, tokens, tf });
  }

  private index(blocks: Block[], seo: { title: string; description: string }) {
    if (seo.description) this.add(seo.description, 'about', 'seo', seo.title, 'о себе кто вы чем занимаетесь');

    for (const raw of blocks) {
      const b = { ...((raw as any)?.content || {}), ...(raw as any) } as Record<string, any>;
      const type = String(b.type || '');
      const title = txt(b.title);
      if (title && !['profile', 'messenger', 'socials', 'divider', 'spacer'].includes(type)) this.topics.push(title);

      switch (type) {
        case 'profile': {
          const name = txt(b.name);
          if (name && this.ownerName === 'автора') this.ownerName = name;
          const bio = txt(b.bio) || txt(b.description);
          if (bio) this.add(name ? `${name}. ${bio}` : bio, 'about', type, name, 'о себе кто вы опыт');
          break;
        }
        case 'faq':
          (b.items || []).forEach((it: any) => {
            const q = txt(it.question), a = txt(it.answer);
            if (a) this.add(a, 'faq', type, q, `${q} ${q}`);
          });
          break;
        case 'pricing': {
          const cur = txt(b.currency) || '₸';
          const items = (b.items || b.plans || []) as any[];
          const lines = items.map(p => {
            const name = txt(p.name) || txt(p.title);
            const price = txt(p.price);
            const desc = txt(p.description);
            return `• ${name}${price ? `: ${price} ${txt(p.currency) || cur}` : ''}${desc ? ` (${clip(desc, 80)})` : ''}`;
          }).filter(l => l.length > 2);
          if (lines.length) this.add(`${title ? title + ':\n' : 'Цены:\n'}${lines.join('\n')}`, 'pricing', type, title, 'цена стоимость прайс тариф сколько стоит услуги');
          break;
        }
        case 'product':
        case 'catalog':
        case 'digital_product': {
          const items = (b.items || b.products || [b]) as any[];
          items.forEach(p => {
            const name = txt(p.name) || txt(p.title);
            if (!name) return;
            const price = txt(p.price);
            const desc = txt(p.description);
            this.add(`${name}${desc ? `: ${clip(desc, 200)}` : ''}${price ? `\nЦена: ${price} ${txt(p.currency) || txt(b.currency) || '₸'}` : ''}`, 'product', type, name, 'купить товар продукт цена');
          });
          break;
        }
        case 'messenger':
          (b.messengers || []).forEach((m: any) => {
            const u = txt(m.username);
            if (!u) return;
            const url = MESSENGER_URL[m.platform]?.(u);
            this.contacts.push(`${m.platform === 'whatsapp' ? 'WhatsApp' : m.platform === 'telegram' ? 'Telegram' : m.platform}: ${url || u}`);
          });
          if (!(b.messengers || []).length) this.contacts.push('кнопки мессенджеров на этой странице');
          break;
        case 'socials':
          (b.platforms || b.links || []).forEach((s: any) => {
            const u = txt(s.url);
            if (u) this.contacts.push(`${txt(s.name) || txt(s.platform) || 'Ссылка'}: ${u}`);
          });
          break;
        case 'booking':
          this.hasBooking = true;
          this.add(`${title ? title + '. ' : ''}Записаться можно прямо здесь: выберите удобное время в блоке записи на этой странице.${txt(b.description) ? ' ' + txt(b.description) : ''}`, 'booking', type, title, 'записаться запись встреча консультация время слот');
          break;
        case 'link':
        case 'button': {
          const url = txt(b.url);
          if (title) this.add(`${title}${url ? `: ${url}` : ''}`, 'content', type, title);
          break;
        }
        case 'map': {
          const addr = txt(b.address) || txt(b.query);
          if (addr) this.add(`Адрес: ${addr}`, 'contact', type, title, 'адрес где находитесь карта город');
          break;
        }
        default: {
          const texts = unique(collectText(b)).filter(s => s !== title);
          if (!texts.length) break;
          const category: ExpertSource = /testimonial|review/.test(type) ? 'about' : /service|feature/.test(type) ? 'product' : 'content';
          // split long content into passages so retrieval stays precise
          let buf = '';
          for (const s of texts) {
            if ((buf + ' ' + s).length > 500 && buf) { this.add(buf, category, type, title); buf = ''; }
            buf = buf ? `${buf}\n${s}` : s;
          }
          if (buf) this.add(buf, category, type, title);
        }
      }
    }

    this.contacts = unique(this.contacts);
    this.topics = unique(this.topics).slice(0, 8);
    this.chunks.forEach(c => new Set(c.tokens).forEach(t => this.df.set(t, (this.df.get(t) || 0) + 1)));
    this.avgLen = this.chunks.reduce((s, c) => s + c.tokens.length, 0) / Math.max(1, this.chunks.length) || 1;
  }

  private detectIntents(tokens: string[], raw: string): Set<Intent> {
    const found = new Set<Intent>();
    const low = raw.toLowerCase();
    (Object.keys(INTENT_STEMS) as Intent[]).forEach(intent => {
      if (INTENT_STEMS[intent].some(s => tokens.some(t => t.startsWith(s)) || low.includes(s))) found.add(intent);
    });
    return found;
  }

  private bm25(query: string[]): { chunk: Chunk; score: number }[] {
    const N = this.chunks.length, k1 = 1.4, b = 0.75;
    return this.chunks.map(chunk => {
      let score = 0;
      for (const q of unique(query)) {
        // exact stem or prefix match (handles remaining morphology)
        let f = chunk.tf.get(q) || 0;
        if (!f && q.length >= 4) for (const [t, n] of chunk.tf) if (t.startsWith(q) || q.startsWith(t) && t.length >= 4) { f += n * 0.7; }
        if (!f) continue;
        const df = this.df.get(q) || 1;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * chunk.tokens.length / this.avgLen));
      }
      return { chunk, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  }

  private contactAnswer(): string {
    if (!this.contacts.length) return '';
    return `Связаться с ${this.ownerName} можно так:\n${this.contacts.map(c => `• ${c}`).join('\n')}`;
  }

  public getResponse(userInput: string): {
    message: ExpertEngineMessage;
    hasMatch: boolean;
    score: number;
    intent: 'commercial' | 'informational';
  } {
    const input = userInput.trim();
    if (!input) {
      return { message: { role: 'assistant', content: 'Напишите ваш вопрос.', source: 'system' }, hasMatch: false, score: 0, intent: 'informational' };
    }

    const tokens = tokenize(input);
    const intents = this.detectIntents(tokens, input);
    const commercial = ['price', 'contact', 'booking', 'product'].some(i => intents.has(i as Intent));
    const intent: 'commercial' | 'informational' = commercial ? 'commercial' : 'informational';
    const reply = (content: string, source: ExpertSource, score: number, hasMatch = true) =>
      ({ message: { role: 'assistant' as const, content, source }, hasMatch, score, intent });

    // Small talk
    if (tokens.length <= 3 && intents.has('thanks')) return reply('Пожалуйста! Если появятся вопросы, пишите.', 'system', 1);
    if (tokens.length <= 3 && intents.has('greeting') && intents.size === 1) {
      return reply(`Здравствуйте! Я помощник ${this.ownerName}. Могу рассказать об услугах, ценах и о том, как записаться или связаться.`, 'system', 1);
    }

    const ranked = this.bm25(tokens);
    // Intent boost: prefer chunks of the matching category
    const boost: Partial<Record<ExpertSource, number>> = {};
    if (intents.has('price')) { boost.pricing = 3; boost.product = 1.5; }
    if (intents.has('booking')) boost.booking = 3;
    if (intents.has('about')) boost.about = 2;
    if (intents.has('product')) { boost.product = 2; boost.pricing = 1; }
    if (intents.has('location')) boost.contact = 3;
    const withIntent = this.chunks
      .map(chunk => ({ chunk, score: (ranked.find(r => r.chunk === chunk)?.score || 0) + (boost[chunk.category] || 0) }))
      .filter(r => r.score > 0.4)
      .sort((a, b) => b.score - a.score);

    // Contact questions answered from real contact data
    if (intents.has('contact') && this.contacts.length && !(withIntent[0]?.chunk.category === 'faq' && withIntent[0].score > 4)) {
      const extra = this.hasBooking ? '\n\nА записаться можно прямо на этой странице в блоке записи.' : '';
      return reply(this.contactAnswer() + extra, 'contact', 2);
    }

    if (withIntent.length) {
      const top = withIntent[0];
      const parts = [clip(top.chunk.text)];
      const second = withIntent[1];
      if (second && second.score >= top.score * 0.7 && second.chunk.text !== top.chunk.text && parts[0].length < 300) parts.push(clip(second.chunk.text, 250));
      let content = parts.join('\n\n');
      if ((top.chunk.category === 'pricing' || top.chunk.category === 'product') && (this.hasBooking || this.contacts.length)) {
        content += this.hasBooking ? '\n\nЗаписаться можно в блоке записи на этой странице.' : '\n\nЧтобы заказать, напишите в мессенджер, контакты есть на странице.';
      }
      const source = top.chunk.category === 'content' ? 'faq' : top.chunk.category;
      return reply(content, source, Math.min(1, top.score / 6));
    }

    if (intents.has('booking') && !this.hasBooking && this.contacts.length) {
      return reply(`Онлайн-записи на странице нет, но договориться о времени можно напрямую.\n${this.contactAnswer()}`, 'booking', 0.5);
    }

    const topicHint = this.topics.length ? `\n\nНа странице есть: ${this.topics.slice(0, 5).join(', ')}.` : '';
    const contactHint = this.contacts.length ? `\n\n${this.contactAnswer()}` : '';
    return reply(`Точного ответа на странице я не нашёл. Лучше спросить ${this.ownerName} напрямую.${topicHint}${contactHint}`, 'system', 0, false);
  }

  public getSuggestions(): string[] {
    const cats = new Set(this.chunks.map(c => c.category));
    const out: string[] = [];
    if (cats.has('about')) out.push('Чем вы занимаетесь?');
    if (cats.has('pricing') || cats.has('product')) out.push('Сколько стоят услуги?');
    if (this.hasBooking) out.push('Как записаться?');
    if (this.contacts.length) out.push('Как с вами связаться?');
    const faq = this.chunks.find(c => c.category === 'faq' && c.title);
    if (faq?.title && out.length < 4) out.push(faq.title);
    return out.length ? out : ['Чем вы занимаетесь?', 'Как с вами связаться?'];
  }
}

/**
 * Детерминированный алгоритм для генерации смарт-ответов эксперта.
 * Использует интент, ключевые слова из истории и данные лида.
 */
export function generateSmartDraft(leadName: string, intent: string, lastQuery: string, conversation: ExpertEngineMessage[] = []): string {
  const greeting = leadName ? `Здравствуйте, ${leadName}! ` : 'Здравствуйте! ';
  let body = '';

  if (intent === 'commercial') {
    body = `Спасибо за вашу заявку. Я изучил ваш вопрос${lastQuery ? ` по поводу «${lastQuery}»` : ''} и готов обсудить детали. Подскажите, когда вам будет удобно созвониться или списаться для консультации?`;
  } else {
    body = `Спасибо за интерес! Вы общались с моим цифровым ассистентом${lastQuery ? ` и спрашивали про «${lastQuery}»` : ''}. Буду рад рассказать подробнее и ответить на любые оставшиеся вопросы лично.`;
  }

  // Расширенный анализ контекста на основе ключевых слов в истории
  const allText = conversation.map(m => m.content.toLowerCase()).join(' ');
  
  const hasPricing = ['цен', 'скидк', 'стоимост', 'прайс', 'тариф', 'плат'].some(k => allText.includes(k));
  const hasBooking = ['запис', 'встреч', 'консультаци', 'время', 'когда', 'свобод'].some(k => allText.includes(k));
  const hasProduct = ['купить', 'товар', 'заказ', 'доставк'].some(k => allText.includes(k));

  if (hasPricing) {
    body += '\n\nЧто касается стоимости: мы можем подобрать оптимальный вариант и тариф специально под ваши задачи.';
  } else if (hasBooking) {
    body += '\n\nДавайте подберем удобное для вас время. У меня есть пара свободных слотов на ближайшие дни.';
  } else if (hasProduct) {
    body += '\n\nЯ могу проконсультировать вас по наличию и деталям заказа.';
  }

  return greeting + body; // Without "С уважением" as it will be used in chats like Telegram where it's less formal.
}
