import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
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
import { trackPurchase } from '@/lib/analytics';
import { handleKeyboardActivation } from '@/lib/utils/a11y';
import { getSafeHref, openExternal } from '@/lib/blocks/safe-href';
import { contactMessageHref, usePageContacts } from '@/lib/blocks/page-contacts';

interface ProductBlockProps {
  block: ProductBlockType;
  onClick?: () => void;
}


export const ProductBlock = memo(function ProductBlockComponent({ block, onClick }: ProductBlockProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const contacts = usePageContacts();

  const name = getI18nText(block.name, i18n.language as SupportedLanguage);
  const description = getI18nText(block.description, i18n.language as SupportedLanguage);
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage);

  // Visitors buy through the owner's own link, or write to the owner to order.
  // The old fallback sold the item for Linkkon tokens, which asked anonymous
  // visitors to sign in to LinkMAX and showed "Купить токены" on every KZT price.
  const buyHref = getSafeHref(block.buyLink);
  const chat = contacts.find((c) => c.platform !== 'phone') ?? contacts[0];
  const orderHref = !buyHref && chat
    ? contactMessageHref(chat, t('product.orderMessage', { name, defaultValue: 'Здравствуйте! Хочу заказать «{{name}}»' }))
    : undefined;

  const handleBuy = () => {
    if (block.price) trackPurchase(block.price, block.currency);
    openExternal(buyHref ?? orderHref);
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
        {/* The name is already the drawer/dialog title */}
        <p className="text-xl font-bold text-foreground tabular-nums">
          {formatPrice(block.price)} {getCurrencySymbol(block.currency)}
        </p>

        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        )}
      </div>

      {/* Buy Button */}
      {(buyHref || orderHref) && (
        <Button
          onClick={handleBuy}
          className="w-full h-14 rounded-2xl text-base font-bold gap-2 shadow-soft hover:shadow-lift transition-all active:scale-[0.98]"
        >
          {buyHref ? <ShoppingCart className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          {buttonText || (buyHref ? t('actions.buy', 'Купить') : t('product.order', 'Заказать'))}
          <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
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
            <h3 className="font-semibold text-foreground text-sm leading-tight break-words hyphens-auto">
              {name}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words hyphens-auto">
                {description}
              </p>
            )}
          </div>

          {/* Price and action hint */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-primary font-bold text-base break-words">
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
