import React from 'react';
import { isSafeUrl } from '@/lib/blocks/block-validators';


/**
 * Parse text with Markdown-style links [text](url) and line breaks
 * Returns React elements with clickable links
 */
export function parseRichText(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const elements: React.ReactNode[] = [];
  // Match [text](url) pattern
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      elements.push(<React.Fragment key={`text-${keyIndex++}`}>{beforeText}</React.Fragment>);
    }
    
    // Add the link
    const linkText = match[1];
    const linkUrl = match[2].trim();

    if (isSafeUrl(linkUrl)) {
      elements.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-primary hover:underline break-words"
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
        </a>
      );
    } else {
      // Unsafe scheme (javascript:, data:, …) — render as plain text
      elements.push(<React.Fragment key={`text-${keyIndex++}`}>{linkText}</React.Fragment>);
    }

    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < text.length) {
    elements.push(<React.Fragment key={`text-${keyIndex++}`}>{text.slice(lastIndex)}</React.Fragment>);
  }
  
  return elements.length > 0 ? elements : [text];
}
