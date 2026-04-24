import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  LegalDocumentContent,
  normalizeLegalLanguage,
} from '@/components/legal/LegalDocumentContent';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  const { t, i18n } = useTranslation();
  const language = normalizeLegalLanguage(i18n.language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {t('legal.privacyPolicy', 'Политика конфиденциальности')}
          </DialogTitle>
          <DialogDescription>
            {t('legal.privacyDescription', 'Как LinkMAX обрабатывает и защищает данные')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="pr-4">
            <LegalDocumentContent kind="privacy" language={language} variant="modal" />
          </div>
        </ScrollArea>
        <div className="p-6 pt-0">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PrivacyLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function PrivacyLink({ children, className }: PrivacyLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'cursor-pointer text-primary hover:underline'}
      >
        {children}
      </button>
      <PrivacyPolicyModal open={open} onOpenChange={setOpen} />
    </>
  );
}
