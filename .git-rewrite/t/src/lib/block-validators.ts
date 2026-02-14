/**
 * Validation functions for block editors
 * Returns error message if validation fails, null if valid
 */

import { isMultilingualString, getI18nText } from '@/lib/i18n-helpers';
import type {
  BlockFormData,
  LinkBlockData,
  ButtonBlockData,
  ProductBlockData,
  VideoBlockData,
  ImageBlockData,
  CarouselBlockData,
  SocialsBlockData,
  CustomCodeBlockData,
  MessengerBlockData,
  FormBlockData,
  EventBlockData,
  DownloadBlockData,
  NewsletterBlockData,
  TestimonialBlockData,
  ScratchBlockData,
  MapBlockData,
  AvatarBlockData,
  SeparatorBlockData,
} from '@/types/block-forms';

/**
 * Normalize value to string - handles MultilingualString objects
 */
function normalizeToString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (isMultilingualString(value)) {
    // Get any non-empty translation
    return getI18nText(value, 'en') || 
           getI18nText(value, 'ru') || 
           getI18nText(value, 'kk') || '';
  }
  return String(value);
}

export function validateUrl(url: unknown, fieldName = 'URL'): string | null {
  const urlStr = normalizeToString(url);
  if (!urlStr || urlStr.trim() === '') {
    return `${fieldName} is required`;
  }
  
  try {
    new URL(urlStr);
    return null;
  } catch {
    return `${fieldName} must be a valid URL`;
  }
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  const str = normalizeToString(value);
  if (!str || str.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateNumber(
  value: number | undefined,
  fieldName: string,
  options?: { min?: number; max?: number }
): string | null {
  if (value === undefined || isNaN(value)) {
    return `${fieldName} must be a number`;
  }
  
  if (options?.min !== undefined && value < options.min) {
    return `${fieldName} must be at least ${options.min}`;
  }
  
  if (options?.max !== undefined && value > options.max) {
    return `${fieldName} must be at most ${options.max}`;
  }
  
  return null;
}

export function validateArrayNotEmpty(arr: unknown[] | undefined, fieldName: string): string | null {
  if (!arr || arr.length === 0) {
    return `${fieldName} must have at least one item`;
  }
  return null;
}

// Block-specific validators
export function validateLinkBlock(formData: LinkBlockData): string | null {
  return validateRequired(formData.title, 'Title') || validateUrl(formData.url);
}

export function validateButtonBlock(formData: ButtonBlockData): string | null {
  return validateRequired(formData.title, 'Title') || validateUrl(formData.url);
}

export function validateProductBlock(formData: ProductBlockData): string | null {
  return (
    validateRequired(formData.name, 'Product name') ||
    validateNumber(formData.price, 'Price', { min: 0 })
  );
}

export function validateVideoBlock(formData: VideoBlockData): string | null {
  return validateUrl(formData.url, 'Video URL');
}

export function validateImageBlock(formData: ImageBlockData): string | null {
  return validateUrl(formData.url, 'Image URL') || validateRequired(formData.alt, 'Alt text');
}

export function validateCarouselBlock(formData: CarouselBlockData): string | null {
  const arrayError = validateArrayNotEmpty(formData.images, 'Images');
  if (arrayError) return arrayError;
  
  // Validate each image
  for (let i = 0; i < formData.images.length; i++) {
    const image = formData.images[i];
    const urlError = validateUrl(image.url, `Image ${i + 1} URL`);
    if (urlError) return urlError;
  }
  
  return null;
}

export function validateSocialsBlock(formData: SocialsBlockData): string | null {
  const arrayError = validateArrayNotEmpty(formData.platforms, 'Platforms');
  if (arrayError) return arrayError;
  
  // Validate each platform
  for (let i = 0; i < formData.platforms.length; i++) {
    const platform = formData.platforms[i];
    const urlError = validateUrl(platform.url, `Platform ${i + 1} URL`);
    if (urlError) return urlError;
  }
  
  return null;
}

export function validateCustomCodeBlock(formData: CustomCodeBlockData): string | null {
  return validateRequired(formData.html, 'HTML code');
}

export function validateMessengerBlock(formData: MessengerBlockData): string | null {
  const arrayError = validateArrayNotEmpty(formData.messengers, 'Messengers');
  if (arrayError) return arrayError;
  
  for (let i = 0; i < formData.messengers.length; i++) {
    const messenger = formData.messengers[i];
    const usernameError = validateRequired(messenger.username, `Messenger ${i + 1} username`);
    if (usernameError) return usernameError;
  }
  
  return null;
}

export function validateFormBlock(formData: FormBlockData): string | null {
  const titleError = validateRequired(formData.title, 'Form title');
  if (titleError) return titleError;
  
  const arrayError = validateArrayNotEmpty(formData.fields, 'Form fields');
  if (arrayError) return arrayError;
  
  for (let i = 0; i < formData.fields.length; i++) {
    const field = formData.fields[i];
    const nameError = validateRequired(field.name, `Field ${i + 1} name`);
    if (nameError) return nameError;
  }
  
  return null;
}

export function validateEventBlock(formData: EventBlockData): string | null {
  const titleError = validateRequired(formData.title, 'Event title');
  if (titleError) return titleError;

  const fields = formData.formFields || [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const nameError = validateRequired(field.label_i18n, `Field ${i + 1} label`);
    if (nameError) return nameError;
  }

  return null;
}

export function validateDownloadBlock(formData: DownloadBlockData): string | null {
  return (
    validateRequired(formData.title, 'Title') ||
    validateUrl(formData.fileUrl, 'File URL') ||
    validateRequired(formData.fileName, 'File name')
  );
}

export function validateNewsletterBlock(formData: NewsletterBlockData): string | null {
  return validateRequired(formData.title, 'Title');
}

export function validateTestimonialBlock(formData: TestimonialBlockData): string | null {
  const arrayError = validateArrayNotEmpty(formData.testimonials, 'Testimonials');
  if (arrayError) return arrayError;
  
  for (let i = 0; i < formData.testimonials.length; i++) {
    const testimonial = formData.testimonials[i];
    const nameError = validateRequired(testimonial.name, `Testimonial ${i + 1} name`);
    if (nameError) return nameError;
    const textError = validateRequired(testimonial.text, `Testimonial ${i + 1} text`);
    if (textError) return textError;
  }
  
  return null;
}

export function validateScratchBlock(formData: ScratchBlockData): string | null {
  return validateRequired(formData.revealText, 'Reveal text');
}

export function validateMapBlock(formData: MapBlockData): string | null {
  return validateRequired(formData.embedUrl, 'Embed URL');
}

export function validateAvatarBlock(formData: AvatarBlockData): string | null {
  return (
    validateUrl(formData.imageUrl, 'Image URL') ||
    validateRequired(formData.name, 'Name')
  );
}

export function validateSeparatorBlock(formData: SeparatorBlockData): string | null {
  // Separator block has no required fields
  return null;
}
