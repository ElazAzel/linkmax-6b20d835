import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Crown, ChevronUp, ChevronDown } from 'lucide-react';
import type { Block } from '@/types/page';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { useTranslation } from 'react-i18next';

interface DraggableBlockListProps {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

interface SortableBlockItemProps {
  block: Block;
  index: number;
  totalCount: number;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function SortableBlockItem({ block, index, totalCount, onDelete, onEdit, onMoveUp, onMoveDown }: SortableBlockItemProps) {
  const { i18n } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockTitle = (block: Block): string => {
    const currentLang = i18n.language as 'ru' | 'en' | 'kk';
    
    switch (block.type) {
      case 'profile':
        return `Профиль: ${getTranslatedString(block.name, currentLang)}`;
      case 'link':
        return `Ссылка: ${getTranslatedString(block.title, currentLang)}`;
      case 'button':
        return `Кнопка: ${getTranslatedString(block.title, currentLang)}`;
      case 'socials':
        return `Соцсети: ${block.title || 'Социальные сети'}`;
      case 'product':
        return `Товар: ${getTranslatedString(block.name, currentLang)}`;
      case 'text':
        const content = getTranslatedString(block.content, currentLang);
        return `Текст: ${content.slice(0, 30)}...`;
      case 'image':
        return `Изображение: ${block.alt || 'Без описания'}`;
      case 'video':
        return `Видео: ${block.title || 'Без названия'}`;
      case 'carousel':
        return `Галерея: ${block.title || `${block.images?.length || 0} фото`}`;
      case 'search':
        return `Поиск: ${block.title || 'Поиск'}`;
      case 'custom_code':
        return `HTML код: ${block.title || 'Без названия'}`;
      case 'messenger':
        return `Мессенджеры: ${block.title || 'Связь'}`;
      case 'form':
        return `Форма: ${block.title}`;
      case 'download':
        return `Файл: ${block.title}`;
      case 'newsletter':
        return `Подписка: ${block.title}`;
      case 'testimonial':
        return `Отзывы: ${block.title || 'Отзывы'}`;
      case 'scratch':
        return `Скретч: ${block.title || 'Сюрприз'}`;
      case 'map':
        return `Карта: ${block.title || 'Местоположение'}`;
      case 'avatar':
        return `Аватар: ${getTranslatedString(block.name, currentLang)}`;
      case 'separator':
        return `Разделитель`;
      case 'catalog':
        return `Каталог: ${block.title ? getTranslatedString(block.title, currentLang) : `${block.items?.length || 0} позиций`}`;
      case 'before_after':
        return `До/После: ${block.title ? getTranslatedString(block.title, currentLang) : 'Сравнение'}`;
      case 'faq':
        return `FAQ: ${block.title ? getTranslatedString(block.title, currentLang) : `${block.items?.length || 0} вопросов`}`;
      case 'countdown':
        return `Таймер: ${block.title ? getTranslatedString(block.title, currentLang) : 'Обратный отсчёт'}`;
      case 'pricing':
        return `Прайс: ${block.title ? getTranslatedString(block.title, currentLang) : `${block.items?.length || 0} услуг`}`;
      case 'shoutout':
        return `Шаут-аут: ${(block as any).displayName || 'Рекомендация'}`;
      default:
        return 'Неизвестный блок';
    }
  };

  const isPremiumBlock = block.type === 'video' || block.type === 'carousel' || block.type === 'custom_code' || block.type === 'form' || block.type === 'newsletter' || block.type === 'testimonial' || block.type === 'scratch' || block.type === 'search' || block.type === 'catalog' || block.type === 'countdown';

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Position indicator */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{index + 1}</span>
        </div>

        {/* Drag handle */}
        <button
          className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 hidden sm:block"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {getBlockTitle(block)}
            </span>
            {isPremiumBlock && (
              <Crown className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground capitalize">
            {block.type.replace('_', ' ')}
          </span>
        </div>

        {/* Arrow controls */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-6 p-0 hover:bg-primary/10"
            onClick={() => onMoveUp(block.id)}
            disabled={isFirst}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-6 p-0 hover:bg-primary/10"
            onClick={() => onMoveDown(block.id)}
            disabled={isLast}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {onEdit && block.type !== 'profile' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 text-xs"
              onClick={() => onEdit(block.id)}
            >
              Edit
            </Button>
          )}
          {block.type !== 'profile' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              onClick={() => onDelete(block.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DraggableBlockList({
  blocks,
  onReorder,
  onDelete,
  onEdit,
}: DraggableBlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);
      onReorder(reorderedBlocks);
    }
  };

  const handleMoveUp = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    if (index > 0) {
      const reorderedBlocks = arrayMove(blocks, index, index - 1);
      onReorder(reorderedBlocks);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    if (index < blocks.length - 1) {
      const reorderedBlocks = arrayMove(blocks, index, index + 1);
      onReorder(reorderedBlocks);
    }
  };

  const sortableBlocks = blocks.filter(b => b.type !== 'profile');

  if (sortableBlocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-lg font-medium">Блоки отсутствуют</p>
          <p className="text-sm">Добавьте блоки для начала работы</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableBlocks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 p-1">
          <div className="text-xs text-muted-foreground mb-3 px-1">
            Всего блоков: {sortableBlocks.length}
          </div>
          {sortableBlocks.map((block, index) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              index={index}
              totalCount={sortableBlocks.length}
              onDelete={onDelete}
              onEdit={onEdit}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
