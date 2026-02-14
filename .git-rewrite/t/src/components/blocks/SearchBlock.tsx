import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SearchBlock as SearchBlockType } from '@/types/page';
import { supabase } from '@/integrations/supabase/client';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface SearchBlockProps {
  block: SearchBlockType;
}

export const SearchBlock = memo(function SearchBlockComponent({ block }: SearchBlockProps) {
  const { i18n, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources?: string[] } | null>(null);

  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const placeholder = getTranslatedString(block.placeholder, i18n.language as SupportedLanguage) || t('search.placeholder', 'Ask a question...');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: { 
          type: 'search',
          prompt: query 
        }
      });

      if (error) throw error;
      
      if (data?.content) {
        setResult({ answer: data.content, sources: data.sources });
      } else {
        setResult({ answer: t('search.noResult', 'Could not get an answer. Try a different query.') });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResult({ answer: t('search.error', 'An error occurred while searching. Please try again.') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="pr-12 h-14 rounded-2xl bg-card border-border shadow-sm focus:border-primary transition-colors"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          size="icon"
          className="absolute right-2 top-2 h-10 w-10 rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>

      {result && (
        <Card className="p-6 bg-card border-border shadow-sm rounded-2xl">
          <p className="text-foreground whitespace-pre-wrap">{result.answer}</p>
          {result.sources && result.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('search.sources', 'Sources')}:</p>
              <ul className="space-y-1">
                {result.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
});
