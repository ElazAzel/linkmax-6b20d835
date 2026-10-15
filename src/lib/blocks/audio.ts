export const AUDIO_MAX_BYTES = 50 * 1024 * 1024;
export function validateAudioUpload(file: { name: string; type: string; size: number }): string | null {
  if (file.size <= 0) return 'audioBlock.emptyFile';
  if (file.size > AUDIO_MAX_BYTES) return 'audioBlock.tooLarge';
  if (!/\.(mp3|wav)$/i.test(file.name) || !['', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave'].includes(file.type.toLowerCase())) {
    return 'audioBlock.invalidFormat';
  }
  return null;
}
export function getSafeAudioUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}
