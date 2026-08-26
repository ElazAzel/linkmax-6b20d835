import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor, readableTextColor } from '@/lib/design/contrast';
import { analyzeDesignHealth } from '@/lib/design/design-health';
import type { Block } from '@/types/blocks';

describe('contrast utils', () => {
  it('parses hex, rgb and hsl', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('rgb(0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('hsl(0 0% 100%)')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('computes the WCAG extremes', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  });

  it('picks a readable text color', () => {
    expect(readableTextColor('#ffffff')).toBe('#111111');
    expect(readableTextColor('#101010')).toBe('#ffffff');
  });
});

describe('design health contrast check', () => {
  const blocks = [
    { id: '1', type: 'text', content: { text: 'Hello there friend' } },
    { id: '2', type: 'button', content: { label: 'Call' } },
  ] as unknown as Block[];

  it('flags unreadable text on the background', () => {
    const report = analyzeDesignHealth(blocks, {
      theme: { backgroundColor: '#ffffff', textColor: '#f2f2f2' },
    });
    const issue = report.issues.find((i) => i.id === 'low-contrast');
    expect(issue).toBeDefined();
    expect(issue?.themeFix?.textColor).toBe('#111111');
  });

  it('stays quiet when contrast is fine', () => {
    const report = analyzeDesignHealth(blocks, {
      theme: { backgroundColor: '#ffffff', textColor: '#111111' },
    });
    expect(report.issues.find((i) => i.id === 'low-contrast')).toBeUndefined();
  });
});
