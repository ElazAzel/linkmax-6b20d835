/**
 * Embed URL for a YouTube or Vimeo link, or null when the link is not one we
 * can embed. Accepts watch, youtu.be, embed, shorts and live links.
 */
export function getVideoEmbedUrl(url: unknown, platform?: string): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const value = url.trim();
  const youtube = value.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|e\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (youtube && platform !== 'vimeo') return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo && platform !== 'youtube') return `https://player.vimeo.com/video/${vimeo[1]}`;
  // The platform field can lag behind the link the owner pasted.
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Shorts are vertical; a 16:9 frame letterboxes them into a thin strip. */
export function isVerticalVideo(url: unknown): boolean {
  return typeof url === 'string' && /youtube\.com\/shorts\//.test(url);
}
