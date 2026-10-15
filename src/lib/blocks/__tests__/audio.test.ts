import { describe, expect, it } from 'vitest';
import { AUDIO_MAX_BYTES, getSafeAudioUrl, validateAudioUpload } from '../audio';
import { createBlock } from '../block-factory';
import { BLOCK_MANIFEST } from '../block-manifest';

describe('audio upload', () => {
  it.each([['voice.mp3', 'audio/mpeg'], ['voice.WAV', 'audio/wav'], ['voice.wav', 'audio/x-wav'], ['voice.mp3', '']])('accepts supported file %s at the limit', (name, type) => {
    expect(validateAudioUpload({ name, type, size: AUDIO_MAX_BYTES })).toBeNull();
  });
  it('rejects an oversized file before upload', () => {
    expect(validateAudioUpload({ name: 'voice.mp3', type: 'audio/mpeg', size: AUDIO_MAX_BYTES + 1 })).toBe('audioBlock.tooLarge');
  });
  it.each([['voice.ogg', 'audio/ogg'], ['voice.mp3.exe', 'audio/mpeg'], ['voice.mp3', 'image/png']])('rejects unsupported file %s (%s)', (name, type) => {
    expect(validateAudioUpload({ name, type, size: 1024 })).toBe('audioBlock.invalidFormat');
  });
  it('rejects empty files', () => {
    expect(validateAudioUpload({ name: 'empty.mp3', type: 'audio/mpeg', size: 0 })).toBe('audioBlock.emptyFile');
  });
});
describe('audio URLs', () => {
  it('keeps signed media URL query parameters', () => {
    expect(getSafeAudioUrl('https://media.example/podcast.mp3?token=abc')).toBe('https://media.example/podcast.mp3?token=abc');
  });
  it.each(['javascript:alert(1)', 'data:audio/mpeg;base64,aaa', 'https://user:password@example.com/song', '', null])('rejects unsafe URL %s', value => {
    expect(getSafeAudioUrl(value)).toBeUndefined();
  });
});
describe('audio registration', () => {
  it('creates an editable block and includes it in the same manifest as existing blocks', () => {
    const block = createBlock('audio');
    expect(block).toMatchObject({ type: 'audio', sourceType: 'file', fileUrl: '' });
    expect(BLOCK_MANIFEST).toHaveProperty('audio.renderer');
    expect(BLOCK_MANIFEST).toHaveProperty('audio.editor');
  });
});
