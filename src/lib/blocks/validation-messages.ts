/**
 * Block validators return short English sentences ("URL is required").
 * This turns them into the owner's language without changing every validator.
 */
import type { TFunction } from 'i18next';

const FIELD_FALLBACKS: Record<string, string> = {
  'Title': 'Заголовок',
  'URL': 'Ссылка',
  'Video URL': 'Ссылка на видео',
  'Image URL': 'Изображение',
  'File URL': 'Файл',
  'File name': 'Название файла',
  'Alt text': 'Описание изображения',
  'Embed URL': 'Ссылка для встраивания',
  'Event title': 'Название события',
  'Form title': 'Название формы',
  'HTML code': 'HTML-код',
  'Name': 'Название',
  'Price': 'Цена',
  'Product name': 'Название товара',
  'Reveal text': 'Скрытый текст',
};

function fieldLabel(field: string, t: TFunction): string {
  const key = field.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return t(`validation.field.${key}`, FIELD_FALLBACKS[field] ?? field);
}

export function localizeValidationMessage(message: string, t: TFunction): string {
  let m = message.match(/^(.+) is required$/i);
  if (m) return t('validation.fieldRequired', '{{field}}: заполните поле', { field: fieldLabel(m[1], t) });
  m = message.match(/^(.+) must be a valid URL$/i);
  if (m) return t('validation.fieldUrl', '{{field}}: нужна ссылка, начиная с https://', { field: fieldLabel(m[1], t) });
  m = message.match(/^(.+) must be a number$/i);
  if (m) return t('validation.fieldNumber', '{{field}}: введите число', { field: fieldLabel(m[1], t) });
  m = message.match(/^(.+) must be at least (.+)$/i);
  if (m) return t('validation.fieldMin', '{{field}}: не меньше {{min}}', { field: fieldLabel(m[1], t), min: m[2] });
  m = message.match(/^(.+) must be at most (.+)$/i);
  if (m) return t('validation.fieldMax', '{{field}}: не больше {{max}}', { field: fieldLabel(m[1], t), max: m[2] });
  m = message.match(/^(.+) must have at least one item$/i);
  if (m) return t('validation.fieldItems', '{{field}}: добавьте хотя бы один элемент', { field: fieldLabel(m[1], t) });
  return t(message, message);
}
