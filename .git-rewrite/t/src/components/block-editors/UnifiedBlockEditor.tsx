/**
 * UnifiedBlockEditor - New mobile-first block editor with single scrollable page
 * Replaces old tab-based BlockEditor with better UX
 */
import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChevronLeft, 
  Check, 
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icon-utils';
import type { Block } from '@/types/page';

// Lazy load editors
const ProfileEditorWizard = lazy(() => import('./ProfileEditorWizard').then(m => ({ default: m.ProfileEditorWizard })));
const TextBlockEditor = lazy(() => import('./TextBlockEditor').then(m => ({ default: m.TextBlockEditor })));
const LinkBlockEditor = lazy(() => import('./LinkBlockEditor').then(m => ({ default: m.LinkBlockEditor })));
const ProductBlockEditor = lazy(() => import('./ProductBlockEditor').then(m => ({ default: m.ProductBlockEditor })));
const VideoBlockEditor = lazy(() => import('./VideoBlockEditor').then(m => ({ default: m.VideoBlockEditor })));
const CarouselBlockEditor = lazy(() => import('./CarouselBlockEditor').then(m => ({ default: m.CarouselBlockEditor })));
const ButtonBlockEditor = lazy(() => import('./ButtonBlockEditor').then(m => ({ default: m.ButtonBlockEditor })));
const SocialsBlockEditor = lazy(() => import('./SocialsBlockEditor').then(m => ({ default: m.SocialsBlockEditor })));
const ImageBlockEditor = lazy(() => import('./ImageBlockEditor').then(m => ({ default: m.ImageBlockEditor })));
const CustomCodeBlockEditor = lazy(() => import('./CustomCodeBlockEditor').then(m => ({ default: m.CustomCodeBlockEditor })));
const MessengerBlockEditor = lazy(() => import('./MessengerBlockEditor').then(m => ({ default: m.MessengerBlockEditor })));
const FormBlockEditor = lazy(() => import('./FormBlockEditor').then(m => ({ default: m.FormBlockEditor })));
const DownloadBlockEditor = lazy(() => import('./DownloadBlockEditor').then(m => ({ default: m.DownloadBlockEditor })));
const NewsletterBlockEditor = lazy(() => import('./NewsletterBlockEditor').then(m => ({ default: m.NewsletterBlockEditor })));
const TestimonialBlockEditor = lazy(() => import('./TestimonialBlockEditor').then(m => ({ default: m.TestimonialBlockEditor })));
const ScratchBlockEditor = lazy(() => import('./ScratchBlockEditor').then(m => ({ default: m.ScratchBlockEditor })));
const MapBlockEditor = lazy(() => import('./MapBlockEditor').then(m => ({ default: m.MapBlockEditor })));
const AvatarBlockEditor = lazy(() => import('./AvatarBlockEditor').then(m => ({ default: m.AvatarBlockEditor })));
const SeparatorBlockEditor = lazy(() => import('./SeparatorBlockEditor').then(m => ({ default: m.SeparatorBlockEditor })));
const CatalogBlockEditor = lazy(() => import('./CatalogBlockEditor').then(m => ({ default: m.CatalogBlockEditor })));
const BeforeAfterBlockEditor = lazy(() => import('./BeforeAfterBlockEditor').then(m => ({ default: m.BeforeAfterBlockEditor })));
const FAQBlockEditor = lazy(() => import('./FAQBlockEditor').then(m => ({ default: m.FAQBlockEditor })));
const CountdownBlockEditor = lazy(() => import('./CountdownBlockEditor').then(m => ({ default: m.CountdownBlockEditor })));
const PricingBlockEditor = lazy(() => import('./PricingBlockEditor').then(m => ({ default: m.PricingBlockEditor })));
const ShoutoutBlockEditor = lazy(() => import('./ShoutoutBlockEditor').then(m => ({ default: m.ShoutoutBlockEditor })));
const BookingBlockEditor = lazy(() => import('./BookingBlockEditor').then(m => ({ default: m.BookingBlockEditor })));
const CommunityBlockEditor = lazy(() => import('./CommunityBlockEditor').then(m => ({ default: m.CommunityBlockEditor })));
const EventBlockEditor = lazy(() => import('./EventBlockEditor').then(m => ({ default: m.EventBlockEditor })));

// Block type icons
const BLOCK_ICONS: Record<string, string> = {
  profile: 'User',
  link: 'Link',
  button: 'MousePointer2',
  text: 'Type',
  image: 'Image',
  video: 'Video',
  carousel: 'Images',
  product: 'ShoppingBag',
  form: 'FileText',
  messenger: 'MessageCircle',
  socials: 'Share2',
  separator: 'Minus',
  avatar: 'UserCircle',
  catalog: 'Grid3X3',
  booking: 'Calendar',
  faq: 'HelpCircle',
  pricing: 'CreditCard',
  testimonial: 'Quote',
  countdown: 'Clock',
  map: 'MapPin',
  download: 'Download',
  newsletter: 'Mail',
  custom_code: 'Code',
  before_after: 'ArrowLeftRight',
  community: 'Users',
  shoutout: 'Megaphone',
  scratch: 'Gift',
  event: 'CalendarDays',
};

interface UnifiedBlockEditorProps {
  block: Block | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Block>) => void;
}

// Loading skeleton
const EditorSkeleton = () => (
  <div className="space-y-5 p-5">
    <Skeleton className="h-14 w-full rounded-2xl" />
    <Skeleton className="h-14 w-full rounded-2xl" />
    <Skeleton className="h-32 w-full rounded-2xl" />
    <Skeleton className="h-14 w-3/4 rounded-2xl" />
  </div>
);

export const UnifiedBlockEditor = memo(function UnifiedBlockEditor({ 
  block, 
  isOpen, 
  onClose, 
  onSave 
}: UnifiedBlockEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<any>(() => block ? { ...block } : {});

  // Sync formData when block changes
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

  const BlockIcon = getLucideIcon(BLOCK_ICONS[block.type] || 'Box');
  const isProfileBlock = block.type === 'profile';

  // Render the appropriate editor
  const renderEditor = () => {
    const commonProps = {
      formData,
      onChange: setFormData,
    };

    // Profile uses wizard
    if (isProfileBlock) {
      return (
        <Suspense fallback={<EditorSkeleton />}>
          <ProfileEditorWizard
            {...commonProps}
            onComplete={handleSave}
          />
        </Suspense>
      );
    }

    // Other blocks use standard editors wrapped in scroll area
    const getEditor = () => {
      switch (block.type) {
        case 'text':
          return <TextBlockEditor {...commonProps} />;
        case 'link':
          return <LinkBlockEditor {...commonProps} />;
        case 'product':
          return <ProductBlockEditor {...commonProps} />;
        case 'video':
          return <VideoBlockEditor {...commonProps} />;
        case 'carousel':
          return <CarouselBlockEditor {...commonProps} />;
        case 'button':
          return <ButtonBlockEditor {...commonProps} />;
        case 'socials':
          return <SocialsBlockEditor {...commonProps} />;
        case 'image':
          return <ImageBlockEditor {...commonProps} />;
        case 'custom_code':
          return <CustomCodeBlockEditor {...commonProps} />;
        case 'messenger':
          return <MessengerBlockEditor {...commonProps} />;
        case 'form':
          return <FormBlockEditor {...commonProps} />;
        case 'download':
          return <DownloadBlockEditor {...commonProps} />;
        case 'newsletter':
          return <NewsletterBlockEditor {...commonProps} />;
        case 'testimonial':
          return <TestimonialBlockEditor {...commonProps} />;
        case 'scratch':
          return <ScratchBlockEditor {...commonProps} />;
        case 'map':
          return <MapBlockEditor {...commonProps} />;
        case 'avatar':
          return <AvatarBlockEditor {...commonProps} />;
        case 'separator':
          return <SeparatorBlockEditor {...commonProps} />;
        case 'catalog':
          return <CatalogBlockEditor {...commonProps} />;
        case 'before_after':
          return <BeforeAfterBlockEditor {...commonProps} />;
        case 'faq':
          return <FAQBlockEditor {...commonProps} />;
        case 'countdown':
          return <CountdownBlockEditor {...commonProps} />;
        case 'pricing':
          return <PricingBlockEditor {...commonProps} />;
        case 'shoutout':
          return <ShoutoutBlockEditor {...commonProps} />;
        case 'booking':
          return <BookingBlockEditor {...commonProps} />;
        case 'community':
          return <CommunityBlockEditor {...commonProps} />;
        case 'event':
          return <EventBlockEditor {...commonProps} />;
        default:
          return (
            <div className="p-6 text-center text-muted-foreground">
              <p>{t('blockEditor.notAvailable', 'Editor not available for this block type')}</p>
            </div>
          );
      }
    };

    return (
      <Suspense fallback={<EditorSkeleton />}>
        {getEditor()}
      </Suspense>
    );
  };

  // Mobile: Full-screen drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[96vh] max-h-[96vh] bg-background border-t-0 rounded-t-[32px] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>
          
          {/* Profile wizard has its own layout */}
          {isProfileBlock ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {renderEditor()}
            </div>
          ) : (
            <>
              {/* Header */}
              <DrawerHeader className="shrink-0 border-b border-border/10 px-5 py-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BlockIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle className="text-xl font-black">
                      {t(`blocks.${block.type}`, block.type)}
                    </DrawerTitle>
                    <DrawerDescription className="text-sm text-muted-foreground">
                      {t('blockEditor.editHint', 'Настройте содержимое блока')}
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>
              
              {/* Scrollable Content */}
              <ScrollArea className="flex-1">
                <div className="px-5 py-6 space-y-5">
                  {renderEditor()}
                </div>
              </ScrollArea>
              
              {/* Footer Actions */}
              <div className="shrink-0 border-t border-border/10 px-5 py-5 pb-safe bg-background/98 backdrop-blur-xl">
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    className="flex-1 h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-all border-2"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {t('editor.cancel', 'Отмена')}
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    className="flex-[2] h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 active:scale-[0.98] transition-all"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {t('editor.save', 'Сохранить')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "max-h-[90vh] flex flex-col",
        "bg-card/98 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-3xl",
        isProfileBlock ? "max-w-lg p-0" : "max-w-2xl"
      )}>
        {isProfileBlock ? (
          <div className="flex flex-col h-[80vh] overflow-hidden">
            {renderEditor()}
          </div>
        ) : (
          <>
            <DialogHeader className="pb-4 border-b border-border/10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BlockIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {t(`blocks.${block.type}`, block.type)}
                  </DialogTitle>
                  <DialogDescription>
                    {t('blockEditor.editHint', 'Настройте содержимое блока')}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="py-6 space-y-5 pr-2">
                {renderEditor()}
              </div>
            </div>

            <div className="pt-4 border-t border-border/10 flex gap-4 shrink-0">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-12">
                {t('editor.cancel', 'Отмена')}
              </Button>
              <Button onClick={handleSave} className="flex-[2] rounded-2xl h-12 shadow-lg">
                <Check className="h-5 w-5 mr-2" />
                {t('editor.save', 'Сохранить')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default UnifiedBlockEditor;
