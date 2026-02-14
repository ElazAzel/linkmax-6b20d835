import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Maximize2, Minimize2 } from 'lucide-react';
import type { CustomCodeBlock as CustomCodeBlockType } from '@/types/page';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { Button } from '@/components/ui/button';

interface CustomCodeBlockProps {
  block: CustomCodeBlockType;
}

const HEIGHT_MAP = {
  auto: 'auto',
  small: '200px',
  medium: '400px',
  large: '600px',
  full: '100vh',
};

export const CustomCodeBlock = memo(function CustomCodeBlockComponent({ block }: CustomCodeBlockProps) {
  const { i18n } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<string>(HEIGHT_MAP[block.height || 'medium']);
  
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  // Build complete HTML document for iframe
  const iframeContent = useMemo(() => {
    const html = block.html || '';
    const css = block.css || '';
    const js = block.javascript || '';
    
    // Extract content from full HTML document if provided
    let bodyContent = html;
    let headContent = '';
    
    // Check if it's a full HTML document
    const hasDoctype = html.toLowerCase().includes('<!doctype');
    const hasHtmlTag = html.toLowerCase().includes('<html');
    
    if (hasDoctype || hasHtmlTag) {
      // Extract head content (styles, meta tags)
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch) {
        headContent = headMatch[1];
      }
      
      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      }
      
      // Extract inline scripts from the original HTML
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        const inlineScripts = scriptMatches
          .map(script => {
            const srcMatch = script.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
              // External script - keep as is
              return script;
            }
            // Inline script - extract content
            const contentMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            return contentMatch ? contentMatch[1] : '';
          })
          .filter(Boolean);
        
        // Add extracted scripts to js
        if (inlineScripts.length > 0 && !js) {
          bodyContent += `<script>${inlineScripts.join('\n')}</script>`;
        }
      }
    }
    
    // Build the complete document
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
    }
    ${css}
  </style>
  ${headContent}
</head>
<body>
  ${bodyContent}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
  }, [block.html, block.css, block.javascript]);

  // Create blob URL for iframe
  const iframeSrc = useMemo(() => {
    const blob = new Blob([iframeContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [iframeContent]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(iframeSrc);
    };
  }, [iframeSrc]);

  // Auto-height calculation for 'auto' mode
  useEffect(() => {
    if (block.height !== 'auto') {
      setIframeHeight(HEIGHT_MAP[block.height || 'medium']);
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const height = Math.max(
            doc.body.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement?.scrollHeight || 0,
            doc.documentElement?.offsetHeight || 0
          );
          setIframeHeight(`${Math.min(Math.max(height, 100), 800)}px`);
        }
      } catch {
        // Cross-origin error, use default height
        setIframeHeight('400px');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [block.height, iframeSrc]);

  const showHeader = title && title.trim() !== '';
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background p-4 overflow-auto'
    : '';

  return (
    <div className={containerClass}>
      <Card className="overflow-hidden border-primary/20">
        {showHeader && (
          <CardHeader className="bg-primary/5 py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={title || 'Custom Content'}
            className="w-full border-0"
            style={{ 
              height: isFullscreen ? 'calc(100vh - 120px)' : iframeHeight,
              minHeight: '100px'
            }}
            sandbox={
              block.enableInteraction !== false
                ? 'allow-scripts allow-forms allow-popups allow-modals'
                : ''
            }
            loading="lazy"
          />
        </CardContent>
      </Card>
      
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            Свернуть
          </Button>
        </div>
      )}
    </div>
  );
});
