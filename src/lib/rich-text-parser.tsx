import React from 'react';
import { getSafeHref } from '@/lib/blocks/safe-href';

// [text](url) | **bold** | __bold__ | *italic* | _italic_
const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|__(.+?)__|(?<![\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])|(?<![\w_])_(?!\s)([^_\n]+?)_(?![\w_])/g;

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${index++}`;
    if (match[1] !== undefined) {
      const href = getSafeHref(match[2]);
      out.push(href ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      ) : match[1]);
    } else if (match[3] !== undefined || match[4] !== undefined) {
      out.push(<strong key={key} className="font-semibold">{parseInline(match[3] ?? match[4], key)}</strong>);
    } else {
      out.push(<em key={key}>{match[5] ?? match[6]}</em>);
    }
    last = start + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * The small Markdown subset owners type into text, bio and FAQ answers:
 * links, **bold**, *italic*, "## heading" lines and "- item" lists. Output
 * stays inline (strong/em/a and text with newlines) so it can sit inside a
 * <p> with `white-space: pre-line` without breaking HTML nesting.
 */
export function parseRichText(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push('\n');
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d{1,3})[.)]\s+(.*)$/);
    if (heading) {
      out.push(<strong key={`h-${i}`} className="font-semibold text-[1.05em]">{parseInline(heading[1], `h-${i}`)}</strong>);
    } else if (bullet) {
      out.push(<React.Fragment key={`li-${i}`}>{'• '}{parseInline(bullet[1], `li-${i}`)}</React.Fragment>);
    } else if (numbered) {
      out.push(<React.Fragment key={`ol-${i}`}>{`${numbered[1]}. `}{parseInline(numbered[2], `ol-${i}`)}</React.Fragment>);
    } else {
      out.push(<React.Fragment key={`p-${i}`}>{parseInline(line, `p-${i}`)}</React.Fragment>);
    }
  });
  return out;
}
