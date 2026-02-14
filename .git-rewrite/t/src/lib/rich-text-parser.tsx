import React from 'react';

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
    const linkUrl = match[2];
    elements.push(
      <a
        key={`link-${keyIndex++}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < text.length) {
    elements.push(<React.Fragment key={`text-${keyIndex++}`}>{text.slice(lastIndex)}</React.Fragment>);
  }
  
  return elements.length > 0 ? elements : [text];
}
