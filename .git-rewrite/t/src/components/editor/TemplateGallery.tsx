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
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createBlock as createBaseBlock } from '@/lib/block-factory';
import type { Block } from '@/types/page';

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

const TEMPLATES: Template[] = [
  // Creator
  {
    id: 'influencer',
    name: 'Инфлюенсер',
    description: 'Для блогеров и контент-мейкеров',
    category: 'Креаторы',
    preview: '👤',
    blocks: [
      { type: 'profile', overrides: { name: 'Имя блогера', bio: 'Создаю контент о lifestyle и путешествиях ✨' } },
      { type: 'link', overrides: { title: 'YouTube канал', url: 'https://youtube.com', icon: 'youtube', style: 'rounded' } },
      { type: 'link', overrides: { title: 'Instagram', url: 'https://instagram.com', icon: 'instagram', style: 'rounded' } },
      { type: 'link', overrides: { title: 'TikTok', url: 'https://tiktok.com', icon: 'globe', style: 'rounded' } },
      { type: 'socials', overrides: { title: 'Мои соцсети' } },
    ],
  },
  {
    id: 'musician',
    name: 'Музыкант',
    description: 'Для артистов и музыкантов',
    category: 'Креаторы',
    preview: '🎵',
    blocks: [
      { type: 'profile', overrides: { name: 'Artist Name', bio: '🎤 Музыкант • Автор песен' } },
      { type: 'link', overrides: { title: 'Spotify', url: 'https://spotify.com', icon: 'globe', style: 'rounded' } },
      { type: 'link', overrides: { title: 'Apple Music', url: 'https://music.apple.com', icon: 'globe', style: 'rounded' } },
      { type: 'link', overrides: { title: 'YouTube Music', url: 'https://youtube.com', icon: 'youtube', style: 'rounded' } },
      { type: 'video', overrides: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: 'Новый клип' } },
    ],
  },
  // Business
  {
    id: 'barber',
    name: 'Барбер',
    description: 'Для барберов и парикмахеров',
    category: 'Бизнес',
    preview: '💈',
    blocks: [
      { type: 'profile', overrides: { name: 'Барбершоп', bio: '✂️ Мужские стрижки • Бороды • Укладки' } },
      { type: 'text', overrides: { content: '📍 Алматы, ул. Абая 123', style: 'paragraph' } },
      { type: 'product', overrides: { name: 'Стрижка', description: 'Классическая мужская стрижка', price: 3000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Стрижка + Борода', description: 'Комплекс услуг', price: 5000, currency: 'KZT' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '' }, { platform: 'telegram', username: '' }] } },
      { type: 'map', overrides: { provider: 'google', address: 'Алматы' } },
    ],
  },
  {
    id: 'photographer',
    name: 'Фотограф',
    description: 'Портфолио и услуги',
    category: 'Бизнес',
    preview: '📷',
    blocks: [
      { type: 'profile', overrides: { name: 'Фотограф', bio: '📸 Портреты • Свадьбы • Репортажи' } },
      { type: 'carousel', overrides: { title: 'Портфолио' } },
      { type: 'product', overrides: { name: 'Портретная съемка', description: '1 час, 10 фото в обработке', price: 25000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Свадебная съемка', description: 'Полный день, 100+ фото', price: 150000, currency: 'KZT' } },
      { type: 'link', overrides: { title: 'Записаться', url: '#', icon: 'calendar', style: 'pill' } },
    ],
  },
  {
    id: 'fitness',
    name: 'Фитнес-тренер',
    description: 'Для тренеров и коучей',
    category: 'Бизнес',
    preview: '💪',
    blocks: [
      { type: 'profile', overrides: { name: 'Фитнес Тренер', bio: '🏋️ Персональные тренировки • Онлайн-программы' } },
      { type: 'product', overrides: { name: 'Персональная тренировка', description: '60 минут с тренером', price: 8000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Онлайн-программа', description: '4 недели тренировок + питание', price: 30000, currency: 'KZT' } },
      { type: 'video', overrides: { title: 'Тренировка дня' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '' }] } },
    ],
  },
  {
    id: 'psychologist',
    name: 'Психолог',
    description: 'Для психологов и коучей',
    category: 'Эксперты',
    preview: '🧠',
    blocks: [
      { type: 'profile', overrides: { name: 'Психолог', bio: '🎓 Клинический психолог • Семейная терапия' } },
      { type: 'text', overrides: { content: 'Помогаю разобраться в себе и наладить отношения', style: 'paragraph' } },
      { type: 'product', overrides: { name: 'Консультация', description: '50 минут онлайн/офлайн', price: 15000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Пакет 4 сессии', description: 'Экономия 10%', price: 54000, currency: 'KZT' } },
      { type: 'link', overrides: { title: 'Записаться на консультацию', url: '#', icon: 'calendar', style: 'pill' } },
    ],
  },
  {
    id: 'teacher',
    name: 'Репетитор',
    description: 'Для преподавателей и репетиторов',
    category: 'Эксперты',
    preview: '📚',
    blocks: [
      { type: 'profile', overrides: { name: 'Репетитор', bio: '📖 Английский язык • IELTS • Разговорный' } },
      { type: 'text', overrides: { content: 'Опыт преподавания 10+ лет', style: 'heading' } },
      { type: 'product', overrides: { name: 'Индивидуальный урок', description: '60 минут онлайн', price: 6000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Курс подготовки к IELTS', description: '12 занятий', price: 60000, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: 'Студент', text: 'Сдал IELTS на 7.5!', rating: 5 }] } },
    ],
  },
  {
    id: 'beauty',
    name: 'Салон красоты',
    description: 'Для салонов и мастеров',
    category: 'Бизнес',
    preview: '💅',
    blocks: [
      { type: 'profile', overrides: { name: 'Beauty Studio', bio: '✨ Маникюр • Педикюр • Наращивание' } },
      { type: 'carousel', overrides: { title: 'Наши работы' } },
      { type: 'product', overrides: { name: 'Маникюр с покрытием', description: 'Гель-лак', price: 5000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Комплекс руки + ноги', description: 'Маникюр + педикюр', price: 9000, currency: 'KZT' } },
      { type: 'map', overrides: { provider: 'google', address: 'Алматы' } },
    ],
  },
  {
    id: 'shop',
    name: 'Магазин',
    description: 'Мини-витрина товаров',
    category: 'Бизнес',
    preview: '🛍️',
    blocks: [
      { type: 'profile', overrides: { name: 'Shop Name', bio: '🛒 Доставка по всему Казахстану' } },
      { type: 'product', overrides: { name: 'Товар 1', description: 'Описание товара', price: 10000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Товар 2', description: 'Описание товара', price: 15000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Товар 3', description: 'Описание товара', price: 20000, currency: 'KZT' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '' }, { platform: 'telegram', username: '' }] } },
    ],
  },
  {
    id: 'marketer',
    name: 'Маркетолог',
    description: 'Для SMM и маркетологов',
    category: 'Эксперты',
    preview: '📊',
    blocks: [
      { type: 'profile', overrides: { name: 'Digital Маркетолог', bio: '📈 SMM • Таргет • Контент-стратегия' } },
      { type: 'text', overrides: { content: '100+ успешных проектов', style: 'heading' } },
      { type: 'product', overrides: { name: 'Аудит соцсетей', description: 'Анализ + рекомендации', price: 25000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Ведение Instagram', description: 'Полный пакет на месяц', price: 150000, currency: 'KZT' } },
      { type: 'link', overrides: { title: 'Кейсы', url: '#', icon: 'folder', style: 'rounded' } },
    ],
  },
  {
    id: 'designer',
    name: 'Дизайнер',
    description: 'Портфолио дизайнера',
    category: 'Креаторы',
    preview: '🎨',
    blocks: [
      { type: 'profile', overrides: { name: 'Дизайнер', bio: '🎨 UI/UX • Брендинг • Иллюстрации' } },
      { type: 'carousel', overrides: { title: 'Портфолио' } },
      { type: 'product', overrides: { name: 'Логотип', description: '3 варианта + исходники', price: 50000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Фирменный стиль', description: 'Полный брендбук', price: 200000, currency: 'KZT' } },
      { type: 'link', overrides: { title: 'Behance', url: 'https://behance.net', icon: 'globe', style: 'rounded' } },
    ],
  },
  {
    id: 'chef',
    name: 'Повар / Кондитер',
    description: 'Для кулинаров и кондитеров',
    category: 'Бизнес',
    preview: '👨‍🍳',
    blocks: [
      { type: 'profile', overrides: { name: 'Домашняя кухня', bio: '🍰 Торты на заказ • Десерты • Выпечка' } },
      { type: 'carousel', overrides: { title: 'Меню' } },
      { type: 'product', overrides: { name: 'Торт на заказ', description: 'от 2 кг', price: 8000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Капкейки', description: 'Набор 6 шт', price: 4500, currency: 'KZT' } },
      { type: 'messenger', overrides: { messengers: [{ platform: 'whatsapp', username: '' }] } },
    ],
  },
  // Premium templates
  {
    id: 'agency',
    name: 'Digital-агентство',
    description: 'Для агентств и студий',
    category: 'Премиум',
    preview: '🚀',
    isPremium: true,
    blocks: [
      { type: 'profile', overrides: { name: 'Agency Name', bio: '🚀 Digital-агентство полного цикла' } },
      { type: 'text', overrides: { content: 'Разработка • Дизайн • Маркетинг', style: 'heading' } },
      { type: 'carousel', overrides: { title: 'Кейсы' } },
      { type: 'product', overrides: { name: 'Лендинг', description: 'Под ключ за 7 дней', price: 300000, currency: 'KZT' } },
      { type: 'product', overrides: { name: 'Интернет-магазин', description: 'Полная разработка', price: 800000, currency: 'KZT' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: 'Клиент', text: 'Отличная работа!', rating: 5 }] } },
      { type: 'form', overrides: { title: 'Оставить заявку', buttonText: 'Отправить' } },
    ],
  },
  {
    id: 'portfolio-pro',
    name: 'Портфолио PRO',
    description: 'Расширенное портфолио',
    category: 'Премиум',
    preview: '💼',
    isPremium: true,
    blocks: [
      { type: 'profile', overrides: { name: 'Имя Фамилия', bio: '💼 Профессионал своего дела' } },
      { type: 'video', overrides: { title: 'Видео-визитка' } },
      { type: 'carousel', overrides: { title: 'Проекты' } },
      { type: 'testimonial', overrides: { testimonials: [{ name: 'Клиент 1', text: 'Рекомендую!', rating: 5 }] } },
      { type: 'testimonial', overrides: { testimonials: [{ name: 'Клиент 2', text: 'Супер работа!', rating: 5 }] } },
      { type: 'link', overrides: { title: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', style: 'rounded' } },
      { type: 'download', overrides: { title: 'Скачать резюме', fileName: 'resume.pdf' } },
    ],
  },
  // Blank
  {
    id: 'blank',
    name: 'Пустой',
    description: 'Начать с нуля',
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
      <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('templates.title', 'Галерея шаблонов')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('templates.description', 'Выберите готовый шаблон и скопируйте в 1 клик')}
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="px-4 sm:px-6 py-3 border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap text-xs sm:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[60vh] sm:h-[55vh]">
          <div className="p-4 sm:p-6 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`relative p-3 sm:p-4 hover:border-primary cursor-pointer transition-all hover:shadow-lg group ${
                    copiedId === template.id ? 'border-green-500 bg-green-500/10' : ''
                  }`}
                  onClick={() => handleSelect(template)}
                >
                  {template.isPremium && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]">
                      PRO
                    </Badge>
                  )}
                  
                  <div className="text-3xl sm:text-4xl mb-2 text-center group-hover:scale-110 transition-transform">
                    {copiedId === template.id ? (
                      <Check className="h-8 w-8 mx-auto text-green-500" />
                    ) : (
                      template.preview
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-xs sm:text-sm text-center mb-1 truncate">
                    {template.name}
                  </h4>
                  
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center line-clamp-2 min-h-[2.5em]">
                    {template.description}
                  </p>
                  
                  <div className="mt-2 sm:mt-3 text-center">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {template.blocks.length} {t('templates.blocks', 'блоков')}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {t('common.cancel', 'Отмена')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});