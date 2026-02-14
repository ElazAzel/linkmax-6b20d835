import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, Check, ChevronLeft } from 'lucide-react';
import type { Block } from '@/types/page';

// Lazy load all block editors for code splitting
const ProfileBlockEditor = lazy(() => import('./block-editors/ProfileBlockEditor').then(m => ({ default: m.ProfileBlockEditor })));
const TextBlockEditor = lazy(() => import('./block-editors/TextBlockEditor').then(m => ({ default: m.TextBlockEditor })));
const LinkBlockEditor = lazy(() => import('./block-editors/LinkBlockEditor').then(m => ({ default: m.LinkBlockEditor })));
const ProductBlockEditor = lazy(() => import('./block-editors/ProductBlockEditor').then(m => ({ default: m.ProductBlockEditor })));
const VideoBlockEditor = lazy(() => import('./block-editors/VideoBlockEditor').then(m => ({ default: m.VideoBlockEditor })));
const CarouselBlockEditor = lazy(() => import('./block-editors/CarouselBlockEditor').then(m => ({ default: m.CarouselBlockEditor })));
const ButtonBlockEditor = lazy(() => import('./block-editors/ButtonBlockEditor').then(m => ({ default: m.ButtonBlockEditor })));
const SocialsBlockEditor = lazy(() => import('./block-editors/SocialsBlockEditor').then(m => ({ default: m.SocialsBlockEditor })));
const ImageBlockEditor = lazy(() => import('./block-editors/ImageBlockEditor').then(m => ({ default: m.ImageBlockEditor })));
const CustomCodeBlockEditor = lazy(() => import('./block-editors/CustomCodeBlockEditor').then(m => ({ default: m.CustomCodeBlockEditor })));
const MessengerBlockEditor = lazy(() => import('./block-editors/MessengerBlockEditor').then(m => ({ default: m.MessengerBlockEditor })));
const FormBlockEditor = lazy(() => import('./block-editors/FormBlockEditor').then(m => ({ default: m.FormBlockEditor })));
const DownloadBlockEditor = lazy(() => import('./block-editors/DownloadBlockEditor').then(m => ({ default: m.DownloadBlockEditor })));
const NewsletterBlockEditor = lazy(() => import('./block-editors/NewsletterBlockEditor').then(m => ({ default: m.NewsletterBlockEditor })));
const TestimonialBlockEditor = lazy(() => import('./block-editors/TestimonialBlockEditor').then(m => ({ default: m.TestimonialBlockEditor })));
const ScratchBlockEditor = lazy(() => import('./block-editors/ScratchBlockEditor').then(m => ({ default: m.ScratchBlockEditor })));
const MapBlockEditor = lazy(() => import('./block-editors/MapBlockEditor').then(m => ({ default: m.MapBlockEditor })));
const AvatarBlockEditor = lazy(() => import('./block-editors/AvatarBlockEditor').then(m => ({ default: m.AvatarBlockEditor })));
const SeparatorBlockEditor = lazy(() => import('./block-editors/SeparatorBlockEditor').then(m => ({ default: m.SeparatorBlockEditor })));
const CatalogBlockEditor = lazy(() => import('./block-editors/CatalogBlockEditor').then(m => ({ default: m.CatalogBlockEditor })));
const BeforeAfterBlockEditor = lazy(() => import('./block-editors/BeforeAfterBlockEditor').then(m => ({ default: m.BeforeAfterBlockEditor })));
const FAQBlockEditor = lazy(() => import('./block-editors/FAQBlockEditor').then(m => ({ default: m.FAQBlockEditor })));
const CountdownBlockEditor = lazy(() => import('./block-editors/CountdownBlockEditor').then(m => ({ default: m.CountdownBlockEditor })));
const PricingBlockEditor = lazy(() => import('./block-editors/PricingBlockEditor').then(m => ({ default: m.PricingBlockEditor })));
const ShoutoutBlockEditor = lazy(() => import('./block-editors/ShoutoutBlockEditor').then(m => ({ default: m.ShoutoutBlockEditor })));
const BookingBlockEditor = lazy(() => import('./block-editors/BookingBlockEditor').then(m => ({ default: m.BookingBlockEditor })));
const CommunityBlockEditor = lazy(() => import('./block-editors/CommunityBlockEditor').then(m => ({ default: m.CommunityBlockEditor })));
const EventBlockEditor = lazy(() => import('./block-editors/EventBlockEditor').then(m => ({ default: m.EventBlockEditor })));

interface BlockEditorProps {
  block: Block | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Block>) => void;
}

export function BlockEditor({ block, isOpen, onClose, onSave }: BlockEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<any>(() => block ? { ...block } : {});

  // Update formData when block changes
  useEffect(() => {
    if (block) {
      setFormData({ ...block });
    }
  }, [block]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!block) return null;

  const renderEditor = () => {
    const commonProps = {
      formData,
      onChange: setFormData,
    };

    // Loading fallback for lazy-loaded editors - Mobile optimized
    const EditorFallback = () => (
      <div className="space-y-5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );

    switch (block.type) {
      case 'profile':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ProfileBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'text':
        return (
          <Suspense fallback={<EditorFallback />}>
            <TextBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'link':
        return (
          <Suspense fallback={<EditorFallback />}>
            <LinkBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'product':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ProductBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'video':
        return (
          <Suspense fallback={<EditorFallback />}>
            <VideoBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'carousel':
        return (
          <Suspense fallback={<EditorFallback />}>
            <CarouselBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'button':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ButtonBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'socials':
        return (
          <Suspense fallback={<EditorFallback />}>
            <SocialsBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'image':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ImageBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'custom_code':
        return (
          <Suspense fallback={<EditorFallback />}>
            <CustomCodeBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'messenger':
        return (
          <Suspense fallback={<EditorFallback />}>
            <MessengerBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'form':
        return (
          <Suspense fallback={<EditorFallback />}>
            <FormBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'download':
        return (
          <Suspense fallback={<EditorFallback />}>
            <DownloadBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'newsletter':
        return (
          <Suspense fallback={<EditorFallback />}>
            <NewsletterBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'testimonial':
        return (
          <Suspense fallback={<EditorFallback />}>
            <TestimonialBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'scratch':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ScratchBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'map':
        return (
          <Suspense fallback={<EditorFallback />}>
            <MapBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'avatar':
        return (
          <Suspense fallback={<EditorFallback />}>
            <AvatarBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'separator':
        return (
          <Suspense fallback={<EditorFallback />}>
            <SeparatorBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'catalog':
        return (
          <Suspense fallback={<EditorFallback />}>
            <CatalogBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'before_after':
        return (
          <Suspense fallback={<EditorFallback />}>
            <BeforeAfterBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'faq':
        return (
          <Suspense fallback={<EditorFallback />}>
            <FAQBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'countdown':
        return (
          <Suspense fallback={<EditorFallback />}>
            <CountdownBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'pricing':
        return (
          <Suspense fallback={<EditorFallback />}>
            <PricingBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'shoutout':
        return (
          <Suspense fallback={<EditorFallback />}>
            <ShoutoutBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'booking':
        return (
          <Suspense fallback={<EditorFallback />}>
            <BookingBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'community':
        return (
          <Suspense fallback={<EditorFallback />}>
            <CommunityBlockEditor {...commonProps} />
          </Suspense>
        );
      
      case 'event':
        return (
          <Suspense fallback={<EditorFallback />}>
            <EventBlockEditor {...commonProps} />
          </Suspense>
        );
      
      default:
        return (
          <p className="text-base text-muted-foreground p-4">
            {t('blockEditor.notAvailable')}
          </p>
        );
    }
  };

  // Mobile: Full-screen native app-like drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[96vh] max-h-[96vh] bg-background border-t-0 rounded-t-[32px]">
          <div className="flex flex-col h-full">
            {/* Handle bar for drag */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
            </div>
            
            {/* Header - App-like with back button */}
            <DrawerHeader className="flex-shrink-0 border-b border-border/10 px-5 py-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1">
                  <DrawerTitle className="text-xl font-black">
                    {t(`blockEditor.${block.type}`)}
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-muted-foreground mt-1">
                    {t('blockEditor.mobileHint', 'Отредактируйте содержимое')}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            
            {/* Scrollable Content with more padding */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 overscroll-contain">
              {renderEditor()}
            </div>
            
            {/* Fixed Footer - Large touch-friendly buttons */}
            <DrawerFooter className="flex-shrink-0 border-t border-border/10 px-5 py-5 pb-safe bg-background/98 backdrop-blur-xl">
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-16 rounded-2xl text-lg font-bold active:scale-[0.98] transition-all border-2"
                >
                  <X className="h-5 w-5 mr-2" />
                  {t('editor.cancel', 'Отмена')}
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-[2] h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25 active:scale-[0.98] transition-all"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {t('editor.save', 'Сохранить')}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog with improved styling
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t(`blockEditor.${block.type}`)}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('blockEditor.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {renderEditor()}
        </div>

        <DialogFooter className="gap-4">
          <Button variant="outline" onClick={onClose} className="rounded-2xl h-12 px-6">
            {t('editor.cancel')}
          </Button>
          <Button onClick={handleSave} className="rounded-2xl h-12 px-8 shadow-lg">
            {t('editor.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
