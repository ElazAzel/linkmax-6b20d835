import LZString from 'lz-string';
import type { PageData } from '@/types/page';

export function compressPageData(data: PageData): string {
  const json = JSON.stringify(data);
  const compressed = LZString.compressToBase64(json);
  return compressed;
}

export function decompressPageData(compressed: string): PageData | null {
  try {
    const decompressed = LZString.decompressFromBase64(compressed);
    if (!decompressed) return null;
    return JSON.parse(decompressed) as PageData;
  } catch (error) {
    console.error('Failed to decompress page data:', error);
    return null;
  }
}

export function generateMagicLink(data: PageData): string {
  const compressed = compressPageData(data);
  const baseUrl = window.location.origin;
  return `${baseUrl}/p/${compressed}`;
}
