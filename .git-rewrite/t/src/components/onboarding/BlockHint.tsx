import { useEffect, useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlockHintProps {
  blockType: string;
  blockId: string;
  onDismiss: () => void;
}

const BLOCK_HINTS: Record<string, { title: string; description: string; tips: string[] }> = {
  link: {
    title: '🔗 Блок ссылки',
    description: 'Добавьте важные ссылки на ваши ресурсы',
    tips: [
      'Используйте AI для генерации привлекательных заголовков',
      'Добавьте иконки для лучшей визуализации',
      'Настройте стиль: градиенты, тени, эффекты свечения'
    ]
  },
  button: {
    title: '🔘 Кнопка',
    description: 'Создайте призыв к действию',
    tips: [
      'Выделите главное действие ярким цветом',
      'Используйте короткий и понятный текст',
      'Добавьте hover-эффекты для интерактивности'
    ]
  },
  product: {
    title: '🛍️ Товар',
    description: 'Витрина для ваших продуктов',
    tips: [
      'AI создаст продающее описание автоматически',
      'Выберите валюту из списка или введите свою',
      'Добавьте качественное изображение товара'
    ]
  },
  text: {
    title: '📝 Текстовый блок',
    description: 'Добавьте заголовки и описания',
    tips: [
      'Используйте для описания услуг',
      'Настройте размер и выравнивание текста',
      'Разделяйте контент на читаемые блоки'
    ]
  },
  video: {
    title: '🎬 Видео',
    description: 'Встраивайте видео с YouTube и Vimeo',
    tips: [
      'Поддерживаются YouTube и Vimeo',
      'Видео воспроизводятся прямо на странице',
      'Premium функция'
    ]
  },
  carousel: {
    title: '📸 Карусель',
    description: 'Галерея изображений с автопрокруткой',
    tips: [
      'Добавляйте несколько изображений',
      'Настройте автоматическую прокрутку',
      'Отлично для портфолио и каталогов'
    ]
  },
  image: {
    title: '🖼️ Изображение',
    description: 'Добавьте одно изображение',
    tips: [
      'Поддерживаются PNG, JPG, GIF',
      'Настройте закругление углов',
      'Добавьте ссылку для перехода при клике'
    ]
  },
  socials: {
    title: '👥 Социальные сети',
    description: 'Ссылки на ваши соцсети',
    tips: [
      'Добавьте Instagram, TikTok, YouTube и другие',
      'Иконки подставляются автоматически',
      'Выберите стиль отображения'
    ]
  },
  custom_code: {
    title: '💻 Свой код',
    description: 'Вставьте HTML/CSS код',
    tips: [
      'Встраивайте виджеты и формы',
      'Добавляйте произвольный HTML',
      '⚠️ Используйте только проверенный код'
    ]
  },
  form: {
    title: '📋 Форма',
    description: 'Форма обратной связи',
    tips: [
      'Соберите контакты клиентов',
      'Настройте поля формы',
      'Подключите email-уведомления'
    ]
  },
  newsletter: {
    title: '✉️ Подписка',
    description: 'Email-рассылка для подписчиков',
    tips: [
      'Соберите базу подписчиков',
      'Интеграция с email-сервисами',
      'Настройте welcome-сообщение'
    ]
  },
  messenger: {
    title: '💬 Мессенджеры',
    description: 'Кнопки связи в мессенджерах',
    tips: [
      'WhatsApp, Telegram, Viber',
      'Посетители пишут вам напрямую',
      'Укажите номер или username'
    ]
  },
  testimonial: {
    title: '⭐ Отзывы',
    description: 'Отзывы ваших клиентов',
    tips: [
      'Добавьте фото и имя клиента',
      'Карусель отзывов',
      'Повышает доверие к вам'
    ]
  },
  download: {
    title: '📥 Скачивание',
    description: 'Файлы для скачивания',
    tips: [
      'Прайс-листы, каталоги, резюме',
      'Отслеживайте количество загрузок',
      'Поддерживаются PDF, DOC, ZIP'
    ]
  },
  scratch: {
    title: '🎁 Стирашка',
    description: 'Интерактивная игра-сюрприз',
    tips: [
      'Скрытый промокод или сообщение',
      'Посетитель "стирает" слой',
      'Отличный engagement инструмент'
    ]
  },
  search: {
    title: '🔍 AI Поиск',
    description: 'Умный поиск по интернету',
    tips: [
      'Посетители задают вопросы',
      'AI ищет ответы в реальном времени',
      'Источники ссылок включены'
    ]
  }
};

export function BlockHint({ blockType, blockId, onDismiss }: BlockHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hint = BLOCK_HINTS[blockType];

  useEffect(() => {
    // Показываем подсказку с небольшой задержкой для плавности
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!hint) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Ждем окончания анимации
  };

  return (
    <div
      className={cn(
        "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 w-[90vw] max-w-sm transition-all duration-300",
        isVisible ? "animate-scale-in opacity-100" : "opacity-0 scale-95"
      )}
    >
      <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">{hint.title}</h4>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3">
          {hint.description}
        </p>

        {/* Tips */}
        <div className="space-y-1.5 mb-3">
          {hint.tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-primary mt-0.5">•</span>
              <span className="text-muted-foreground flex-1">{tip}</span>
            </div>
          ))}
        </div>

        {/* Action */}
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={handleDismiss}
        >
          Понятно, спасибо!
        </Button>
      </Card>

      {/* Arrow pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l-2 border-t-2 border-primary/20 rotate-45" />
    </div>
  );
}
