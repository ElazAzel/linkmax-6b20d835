'use client';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';

export const PremiumFooter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#d8dee8] bg-white px-4 pb-28 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="text-3xl font-semibold tracking-[-0.03em] text-[#172033]">
              lnk<span className="text-[#2563eb]">mx</span>
            </span>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#6b7689]">
              {t('landingV5.footer.description', 'Платформа для мастеров и малого бизнеса. Страница + CRM + уведомления.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn title={t('footer.product', 'Product')}>
              <FooterButton onClick={() => navigate('/gallery')}>{t('landingV5.footer.examples', 'Examples')}</FooterButton>
              <FooterButton onClick={() => navigate('/customers')}>{t('footer.customers', 'Customers')}</FooterButton>
              <FooterButton onClick={() => navigate('/pricing')}>{t('landingV5.footer.pricing', 'Pricing')}</FooterButton>
              <FooterButton onClick={() => navigate('/alternatives')}>{t('footer.alternatives', 'Alternatives')}</FooterButton>
            </FooterColumn>

            <FooterColumn title={t('footer.legal', 'Legal')}>
              <TermsLink className="text-left text-sm font-medium text-[#6b7689] transition-colors hover:text-[#2563eb]">
                {t('landingV5.footer.terms', 'Terms')}
              </TermsLink>
              <PrivacyLink className="text-left text-sm font-medium text-[#6b7689] transition-colors hover:text-[#2563eb]">
                {t('landingV5.footer.privacy', 'Privacy')}
              </PrivacyLink>
              <FooterButton onClick={() => navigate('/payment-terms')}>{t('footer.paymentTerms', 'Billing')}</FooterButton>
            </FooterColumn>

            <FooterColumn title={t('footer.contacts', 'Support')} className="col-span-2 sm:col-span-1">
              <a href="mailto:support@lnkmx.my" className="flex items-center gap-2 text-sm font-medium text-[#6b7689] transition-colors hover:text-[#2563eb]">
                <Mail className="h-4 w-4" />
                support@lnkmx.my
              </a>
              <span className="flex items-center gap-2 text-sm font-medium text-[#6b7689]">
                <MapPin className="h-4 w-4" />
                {t('footer.companyInfo', 'ARchitecKZ / Almaty')}
              </span>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-[#edf1f6] pt-8 md:flex-row md:items-center md:justify-between">
          <div className="w-fit rounded-[12px] border border-[#d8dee8] bg-[#f6f7f9] px-3 py-2">
            <LanguageSwitcher />
          </div>
          <p className="text-xs font-medium text-[#6b7689]">
            {t('landingV5.footer.copyright', { year: currentYear, defaultValue: `© ${currentYear} Inkmax` })}
          </p>
        </div>
      </div>
    </footer>
  );
};

function FooterColumn({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#3b4658]">{title}</h4>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left text-sm font-medium text-[#6b7689] transition-colors hover:text-[#2563eb]">
      {children}
    </button>
  );
}
