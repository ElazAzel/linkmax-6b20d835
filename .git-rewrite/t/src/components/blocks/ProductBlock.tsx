import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { ProductBlock as ProductBlockType } from '@/types/page';

interface ProductBlockProps {
  block: ProductBlockType;
}

export const ProductBlock = memo(function ProductBlockComponent({ block }: ProductBlockProps) {
  const { i18n } = useTranslation();
  const name = getTranslatedString(block.name, i18n.language as SupportedLanguage);
  const description = getTranslatedString(block.description, i18n.language as SupportedLanguage);
  
  const handleBuy = () => {
    if (block.buyLink) {
      window.open(block.buyLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'KZT': '₸',
      'RUB': '₽',
      'BYN': 'Br',
      'AMD': '֏',
      'AZN': '₼',
      'KGS': 'с',
      'TJS': 'ЅМ',
      'TMT': 'm',
      'UZS': '',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CNY': '¥',
      'JPY': '¥',
      'CHF': '₣',
      'CAD': '$',
      'AUD': '$',
    };
    return symbols[currency] || currency;
  };

  const alignmentClass = block.alignment === 'left' ? 'mr-auto' 
    : block.alignment === 'right' ? 'ml-auto' 
    : 'mx-auto';

  return (
    <div className={`flex ${block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'}`}>
      <Card className={`${alignmentClass} max-w-sm overflow-hidden hover:shadow-lg transition-shadow`}>
        {block.image && (
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={block.image}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{name}</span>
            <span className="text-primary font-bold">
              {getCurrencySymbol(block.currency)}{block.price.toLocaleString()} {block.currency}
            </span>
          </CardTitle>
        </CardHeader>
        
        {description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        )}
        
        <CardFooter>
          <Button className="w-full gap-2" onClick={handleBuy}>
            <ShoppingCart className="h-4 w-4" />
            Buy Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
});
