import { Block } from '@/types/blocks';

export interface ExpertEngineMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'faq' | 'pricing' | 'about' | 'contact' | 'booking' | 'system';
}

export interface KnowledgeItem {
  keywords: string[];
  answer: string;
  category: ExpertEngineMessage['source'];
  score?: number;
}

/**
 * Sørensen–Dice coefficient for string similarity
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const s2 = str2.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  
  let intersection = 0;
  for (const b of bigrams1) {
    if (bigrams2.has(b)) intersection++;
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

export class ExpertEngine {
  private knowledge: KnowledgeItem[] = [];
  private ownerName: string = '';

  constructor(blocks: Block[], seo: { title: string; description: string }) {
    this.ownerName = seo.title.split('—')[0].trim() || 'эксперт';
    this.indexContent(blocks, seo);
  }

  private indexContent(blocks: Block[], seo: { title: string; description: string }) {
    // 1. Index SEO/Bio (About)
    if (seo.description) {
      this.knowledge.push({
        keywords: ['кто ты', 'о чем', 'биография', 'о себе', 'кто такой', 'чем занимаешься'],
        answer: seo.description,
        category: 'about'
      });
    }

    blocks.forEach(block => {
      const content = (block as any).content;
      if (!content) return;

      switch (block.type) {
        case 'profile':
          if (content.bio) {
            this.knowledge.push({
              keywords: ['о себе', 'био', 'кто ты', 'привет', 'описание'],
              answer: content.bio,
              category: 'about'
            });
          }
          break;

        case 'pricing':
          if (content.plans) {
            const plansInfo = content.plans.map((p: any) => `${p.title}: ${p.price} ${p.currency || '₸'}`).join('\n');
            this.knowledge.push({
              keywords: ['сколько стоит', 'цена', 'прайс', 'тарифы', 'услуги', 'стоимость'],
              answer: `Вот мои тарифы:\n${plansInfo}`,
              category: 'pricing'
            });
          }
          break;

        case 'product':
          this.knowledge.push({
            keywords: ['продукт', 'купить', content.title, 'что продаешь'],
            answer: `${content.title}: ${content.description}. Цена: ${content.price} ${content.currency || '₸'}`,
            category: 'pricing'
          });
          break;

        case 'faq':
          if (content.items) {
            content.items.forEach((item: any) => {
              this.knowledge.push({
                keywords: item.question.split(' '),
                answer: item.answer,
                category: 'faq'
              });
            });
          }
          break;

        case 'messenger':
          this.knowledge.push({
            keywords: ['связаться', 'номер', 'телефон', 'написать', 'контакты', 'whatsapp', 'telegram', 'телеграм', 'телеграмм', 'ватсап', 'вотсап', 'байланыс'],
            answer: 'Вы можете написать мне напрямую, используя кнопки мессенджеров на этой странице.',
            category: 'contact'
          });
          break;

        case 'booking':
          this.knowledge.push({
            keywords: ['записаться', 'встреча', 'консультация', 'время', 'когда свободен', 'слот'],
            answer: 'Для записи на консультацию, пожалуйста, выберите свободное время в блоке бронирования на этой странице.',
            category: 'booking'
          });
          break;
      }
    });

    // Default Greeting
    this.knowledge.push({
      keywords: ['привет', 'здравствуй', 'начать'],
      answer: `Здравствуйте! Я — цифровой ассистент ${this.ownerName}. Чем я могу вам помочь сегодня?`,
      category: 'system'
    });
  }

  public getResponse(userInput: string): { 
    message: ExpertEngineMessage; 
    hasMatch: boolean; 
    score: number;
    intent: 'commercial' | 'informational';
  } {
    if (!userInput.trim()) {
      return { 
        message: { role: 'assistant', content: 'Пожалуйста, введите ваш вопрос.', source: 'system' },
        hasMatch: false,
        score: 0,
        intent: 'informational'
      };
    }

    const cleanInput = userInput.toLowerCase().trim();
    const commercialKeywords = ['цена', 'сколько', 'купить', 'заказать', 'записаться', 'встреча', 'консультация', 'прайс', 'тариф', 'связаться', 'номер', 'телефон', 'whatsapp', 'телеграм'];
    const hasCommercialKeywords = commercialKeywords.some(kw => cleanInput.includes(kw));

    const scored = this.knowledge.map(item => {
      const keywordScores = item.keywords.map(kw => {
        const similarity = stringSimilarity(userInput, kw);
        const directInclusionBoost = cleanInput.includes(String(kw).toLowerCase()) ? 0.35 : 0;
        return Math.min(1, similarity + directInclusionBoost);
      });

      return {
        ...item,
        score: keywordScores.length > 0 ? Math.max(...keywordScores) : 0,
      };
    });

    // Sort by score
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    const bestMatch = scored[0];
    const threshold = 0.25;
    const hasMatch = !!(bestMatch && bestMatch.score && bestMatch.score > threshold);
    
    // Determine Intent
    let intent: 'commercial' | 'informational' = 'informational';
    if (hasMatch && ['pricing', 'booking', 'contact'].includes(bestMatch.category || '')) {
      intent = 'commercial';
    } else if (hasCommercialKeywords) {
      intent = 'commercial';
    }

    if (hasMatch) {
      return {
        message: {
          role: 'assistant',
          content: bestMatch.answer,
          source: bestMatch.category
        },
        hasMatch: true,
        score: bestMatch.score || 0,
        intent
      };
    }

    // Fallback
    return {
      message: {
        role: 'assistant',
        content: `К сожалению, я не совсем понял ваш вопрос. Но я могу рассказать о себе, моих услугах или о том, как со мной связаться. Попробуйте спросить "Кто ты?" или "Какие есть тарифы?".`,
        source: 'system'
      },
      hasMatch: false,
      score: bestMatch?.score || 0,
      intent
    };
  }

  public getSuggestions(): string[] {
    const defaultSuggestions = ['Чем вы занимаетесь?', 'Какие есть услуги?', 'Как записаться?'];
    const categories = new Set(this.knowledge.map(k => k.category));
    
    const suggested: string[] = [];
    if (categories.has('about')) suggested.push('Кто вы?');
    if (categories.has('pricing')) suggested.push('Сколько стоят услуги?');
    if (categories.has('booking')) suggested.push('Как записаться на встречу?');
    if (categories.has('contact')) suggested.push('Как с вами связаться?');

    return suggested.length > 0 ? suggested : defaultSuggestions;
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
