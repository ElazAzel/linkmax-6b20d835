/**
 * Type definitions for block validation
 * Provides safe, type-checked interfaces for all block form data
 */

// Base interfaces for all block types
export interface BlockFormData {
  [key: string]: unknown;
}

export interface ValidationOptions {
  min?: number;
  max?: number;
}

// Specific block data types
export interface LinkBlockData extends BlockFormData {
  title: string;
  url: string;
}

export interface ButtonBlockData extends BlockFormData {
  title: string;
  url: string;
}

export interface ProductBlockData extends BlockFormData {
  name: string;
  price: number;
}

export interface VideoBlockData extends BlockFormData {
  url: string;
}

export interface ImageBlockData extends BlockFormData {
  url: string;
  alt: string;
}

export interface CarouselImageItem {
  url: string;
  alt?: string;
}

export interface CarouselBlockData extends BlockFormData {
  images: CarouselImageItem[];
}

export interface SocialPlatformItem {
  url: string;
  [key: string]: unknown;
}

export interface SocialsBlockData extends BlockFormData {
  platforms: SocialPlatformItem[];
}

export interface CustomCodeBlockData extends BlockFormData {
  html: string;
}

export interface MessengerItem {
  username: string;
  [key: string]: unknown;
}

export interface MessengerBlockData extends BlockFormData {
  messengers: MessengerItem[];
}

export interface FormFieldItem {
  name: string;
  [key: string]: unknown;
}

export interface FormBlockData extends BlockFormData {
  title: string;
  fields: FormFieldItem[];
}

export interface EventBlockData extends BlockFormData {
  title: string;
  formFields: FormFieldItem[];
}

export interface DownloadBlockData extends BlockFormData {
  title: string;
  fileUrl: string;
  fileName: string;
}

export interface NewsletterBlockData extends BlockFormData {
  title: string;
}

export interface TestimonialItem {
  name: string;
  text: string;
  [key: string]: unknown;
}

export interface TestimonialBlockData extends BlockFormData {
  testimonials: TestimonialItem[];
}

export interface ScratchBlockData extends BlockFormData {
  revealText: string;
}

export interface MapBlockData extends BlockFormData {
  embedUrl: string;
}

export interface AvatarBlockData extends BlockFormData {
  imageUrl: string;
  name: string;
}

export interface SeparatorBlockData extends BlockFormData {
  [key: string]: unknown;
}

// Type guard helpers
export const isArrayItem = (item: unknown): item is { [key: string]: unknown } => {
  return typeof item === 'object' && item !== null;
};
