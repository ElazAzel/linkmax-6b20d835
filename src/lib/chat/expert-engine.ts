import { Block } from '@/types/blocks';

export interface ExpertEngineMessage {
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
  const s1 = str1.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
  
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
            keywords: ['связаться', 'номер', 'телефон', 'написать', 'контакты', 'whatsapp', 'telegram'],
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

  public getResponse(userInput: string): ExpertEngineMessage {
    if (!userInput.trim()) return { role: 'assistant', content: 'Пожалуйста, введите ваш вопрос.', source: 'system' };

    const scored = this.knowledge.map(item => ({
      ...item,
      score: Math.max(...item.keywords.map(kw => stringSimilarity(userInput, kw)))
    }));

    // Sort by score
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    const bestMatch = scored[0];
    
    if (bestMatch && bestMatch.score && bestMatch.score > 0.25) {
      return {
        role: 'assistant',
        content: bestMatch.answer,
        source: bestMatch.category
      };
    }

    // Fallback
    return {
      role: 'assistant',
      content: `К сожалению, я не совсем понял ваш вопрос. Но я могу рассказать о себе, моих услугах или о том, как со мной связаться. Попробуйте спросить "Кто ты?" или "Какие есть тарифы?".`,
      source: 'system'
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
