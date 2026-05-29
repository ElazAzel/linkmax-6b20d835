import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Coins from 'lucide-react/dist/esm/icons/coins';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getLocale } from '@/lib/utils/format';
import type { ProductBlock as ProductBlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { useAuth } from '@/hooks/user/useAuth';
import { useTokens } from '@/hooks/user/useTokens';
import { redirectToTokenPurchase } from '@/lib/token-purchase-helper';
import { toast } from 'sonner';
import { trackPurchase } from '@/lib/analytics';
import { handleKeyboardActivation } from '@/lib/utils/a11y';

interface ProductBlockProps {
  block: ProductBlockType;
  onClick?: () => void;
}


export const ProductBlock = memo(function ProductBlockComponent({ block, onClick }: ProductBlockProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { user } = useAuth();
  const tokens = useTokens();

  const name = getI18nText(block.name, i18n.language as SupportedLanguage);
  const description = getI18nText(block.description, i18n.language as SupportedLanguage);
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage);

  // Check if this product uses token payment (price in KZT = tokens)
  const tokenPrice = block.currency === 'KZT' ? block.price : null;
  const hasEnoughTokens = tokenPrice ? (tokens.balance?.balance || 0) >= tokenPrice : true;

  const handleBuy = async () => {
    // If product has a direct buy link, use it
    if (block.buyLink) {
      if (block.price) {
        trackPurchase(block.price, block.currency);
      }
      window.open(block.buyLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Token-based purchase (KZT = Linkkon tokens)
    if (tokenPrice) {
      if (!user) {
        toast.error(t('product.authRequired', 'Необходима авторизация для покупки'));
        return;
      }

      if (!hasEnoughTokens) {
        const deficit = tokenPrice - (tokens.balance?.balance || 0);
        toast.info(t('product.notEnoughTokens', { count: Math.ceil(deficit), defaultValue: `Недостаточно токенов. Нужно еще ${Math.ceil(deficit)} Linkkon.` }));
        redirectToTokenPurchase(deficit, name);
        return;
      }

      // Process token purchase
      setIsPurchasing(true);
      try {
        const success = await tokens.purchaseMarketplaceItem(
          block.id ? block.id.split('-')[0] : null, // seller id from block owner
          'product',
          block.id || `product-${Date.now()}`,
          tokenPrice,
          t('product.purchaseDescription', 'Покупка товара: {{name}}', { name })
        );

        if (success) {
          toast.success(t('product.purchaseSuccess', '🎉 Вы успешно приобрели "{{name}}"!', { name }));

          // Track purchase event
          if (tokenPrice) {
            trackPurchase(tokenPrice, 'KZT'); // Assuming 1 token = 1 KZT roughly for tracking, or just track tokens
          }

          tokens.refresh();
          setIsDetailOpen(false);
        }
      } finally {
        setIsPurchasing(false);
      }
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

  const formatPrice = (price: number) => {
    return price.toLocaleString(getLocale(i18n.language));
  };

  const ProductDetailContent = () => (
    <div className="space-y-4">
      {/* Product Image - Large */}
      {block.image && (
        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-muted">
          <img
            src={block.image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-foreground leading-tight">{name}</h3>
          <span className="text-xl font-bold text-primary whitespace-nowrap">
            {formatPrice(block.price)} {getCurrencySymbol(block.currency)}
          </span>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        )}
      </div>

      {/* Buy Button */}
      {(block.buyLink || tokenPrice) && (
        <Button
          onClick={handleBuy}
          disabled={isPurchasing}
          className={cn(
            "w-full h-14 rounded-2xl text-base font-bold gap-2 shadow-soft hover:shadow-lift transition-all",
            !hasEnoughTokens && tokenPrice && "bg-primary shadow-primary/20",
            "active:scale-[0.98]"
          )}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('product.purchasing', 'Покупка...')}
            </>
          ) : !hasEnoughTokens && tokenPrice ? (
            <>
              <MessageCircle className="h-5 w-5" />
              {t('actions.buyTokens', 'Купить токены')}
            </>
          ) : tokenPrice ? (
            <>
              <Coins className="h-5 w-5" />
              {t('actions.buyForTokens', 'Купить за')} {tokenPrice} Linkkon
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {buttonText || t('actions.buy', 'Купить')}
              <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
            </>
          )}
        </Button>
      )}
    </div>
  );

  // Compact mobile-optimized card layout
  const openProductDetail = () => {
    if (onClick) onClick();
    setIsDetailOpen(true);
  };

  const ProductCard = () => (
    <div
      className={cn(
        "w-full rounded-2xl overflow-hidden cursor-pointer",
        "qb-card",
        "shadow-soft hover:shadow-lift border-hairline transition-all duration-300",
        "active:scale-[0.98]"
      )}
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
      onClick={openProductDetail}
      onKeyDown={(event) => handleKeyboardActivation(event, openProductDetail)}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-3 p-4">
        {/* Compact image */}
        {block.image && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
            <img
              src={block.image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {name}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Price and action hint */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-primary font-bold text-base whitespace-nowrap">
              {formatPrice(block.price)} {getCurrencySymbol(block.currency)}
            </span>

            <span className="text-xs text-muted-foreground">
              {t('actions.tapToView', 'Подробнее →')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ProductCard />

      {/* Product Detail Modal/Drawer */}
      {isMobile ? (
        <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left pb-2 flex items-center justify-between">
              <DrawerTitle className="text-lg font-bold">{name}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-safe overflow-y-auto">
              <ProductDetailContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{name}</DialogTitle>
              <DialogDescription className="sr-only">
                {description || name}
              </DialogDescription>
            </DialogHeader>
            <ProductDetailContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});
