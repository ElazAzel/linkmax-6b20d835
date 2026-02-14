/**
 * Centralized AI generation helpers
 * Handles all AI-powered content generation
 */

import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { logger } from './logger';

export interface MagicTitleInput {
  url: string;
}

export interface SalesCopyInput {
  productName: string;
  price: string | number;
  currency?: string;
}

export interface SEOInput {
  name: string;
  bio?: string;
  links?: string[];
}

export interface AIBuilderInput {
  description: string;
}

type AIGenerationType = 'magic-title' | 'sales-copy' | 'seo' | 'ai-builder';

/**
 * Generic AI content generator
 */
async function generateAIContent<T>(
  type: AIGenerationType,
  input: T
): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-content-generator', {
      body: { type, input },
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    logger.error(`AI ${type} generation error`, error, { context: 'ai-helpers', data: { type } });
    throw error;
  }
}

/**
 * Generate a catchy title from URL
 */
export async function generateMagicTitle(url: string): Promise<string> {
  if (!url) {
    toast.error('Please enter a URL first');
    throw new Error('URL is required');
  }

  try {
    const result = await generateAIContent<MagicTitleInput>('magic-title', { url });
    toast.success('Title generated!');
    return result;
  } catch (error) {
    toast.error('Failed to generate title');
    throw error;
  }
}

/**
 * Generate product description
 */
export async function generateSalesCopy(input: SalesCopyInput): Promise<string> {
  if (!input.productName || !input.price) {
    toast.error('Please enter product name and price first');
    throw new Error('Product name and price are required');
  }

  try {
    const result = await generateAIContent<SalesCopyInput>('sales-copy', {
      productName: input.productName,
      price: input.price,
      currency: input.currency || 'KZT',
    });
    toast.success('Description generated!');
    return result;
  } catch (error) {
    toast.error('Failed to generate description');
    throw error;
  }
}

/**
 * Generate SEO meta tags
 */
export async function generateSEO(input: SEOInput): Promise<any> {
  try {
    const result = await generateAIContent<SEOInput>('seo', input);
    toast.success('SEO meta tags generated!');
    return result;
  } catch (error) {
    toast.error('Failed to generate SEO tags');
    throw error;
  }
}

/**
 * Generate complete page layout
 */
export async function generatePageLayout(description: string): Promise<any> {
  if (!description) {
    toast.error('Please describe your page');
    throw new Error('Description is required');
  }

  try {
    const result = await generateAIContent<AIBuilderInput>('ai-builder', { description });
    toast.success('Page layout generated!');
    return result;
  } catch (error) {
    toast.error('Failed to generate page layout');
    throw error;
  }
}
