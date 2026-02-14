import { memo, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { CustomCodeBlock as CustomCodeBlockType } from '@/types/page';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface CustomCodeBlockProps {
  block: CustomCodeBlockType;
}

export const CustomCodeBlock = memo(function CustomCodeBlockComponent({ block }: CustomCodeBlockProps) {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(block.html || '', {
      ALLOWED_TAGS: ['div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 
                     'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 
                     'pre', 'code', 'figure', 'figcaption', 'video', 'audio', 'source',
                     'iframe', 'button', 'input', 'label', 'form', 'select', 'option'],
      ALLOWED_ATTR: ['class', 'id', 'style', 'href', 'src', 'alt', 'title', 'target', 
                     'rel', 'width', 'height', 'type', 'value', 'placeholder', 'name',
                     'autoplay', 'controls', 'loop', 'muted', 'poster', 'frameborder',
                     'allowfullscreen', 'allow', 'loading'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'object', 'embed', 'link', 'meta', 'base'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur',
                    'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange', 'oninput'],
    });
  }, [block.html]);

  const sanitizedCss = useMemo(() => {
    if (!block.css) return '';
    
    // Comprehensive CSS sanitization to prevent injection attacks
    let css = block.css;
    
    // Remove dangerous at-rules
    css = css.replace(/@import\b/gi, '/* blocked */');
    css = css.replace(/@charset\b/gi, '/* blocked */');
    css = css.replace(/@namespace\b/gi, '/* blocked */');
    
    // Block JavaScript execution vectors
    css = css.replace(/javascript\s*:/gi, 'blocked:');
    css = css.replace(/expression\s*\(/gi, 'blocked(');
    css = css.replace(/behavior\s*:/gi, 'blocked:');
    
    // Block url() with dangerous protocols
    css = css.replace(/url\s*\(\s*["']?\s*(javascript|data|vbscript):/gi, 'url(blocked:');
    
    // Block browser-specific dangerous properties
    css = css.replace(/-moz-binding\s*:/gi, 'blocked:');
    css = css.replace(/-webkit-binding\s*:/gi, 'blocked:');
    
    // Block content property with url() to prevent data exfiltration
    css = css.replace(/content\s*:\s*url\s*\(/gi, 'content: none; /* blocked */ url(');
    
    // Block input-based selectors to prevent CSS keylogger attacks
    css = css.replace(/input\s*\[.*value.*\]/gi, '/* blocked selector */');
    css = css.replace(/input\s*:.*-placeholder/gi, 'input');
    
    return css;
  }, [block.css]);

  useEffect(() => {
    if (!containerRef.current || !sanitizedCss) return;

    const styleId = `custom-style-${block.id}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = sanitizedCss;

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [sanitizedCss, block.id]);

  return (
    <Card className="overflow-hidden border-primary/20">
      {title && (
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{title}</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="custom-code-container"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </CardContent>
    </Card>
  );
});
