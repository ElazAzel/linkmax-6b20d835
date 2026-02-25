'use client';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import Heart from 'lucide-react/dist/esm/icons/heart';
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
        <footer className="border-t border-border/30 py-12 pb-20 px-5 bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-4xl mx-auto">
                {/* Logo and description */}
                <div className="text-center mb-8">
                    <span className="text-2xl font-black">
                        lnk<span className="text-primary">mx</span>
                    </span>
                    <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
                        {t('landingV5.footer.description', 'The all-in-one platform for creators and micro-businesses')}
                    </p>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 text-sm">
                    {/* Product */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-bold text-foreground">{t('footer.product', 'Product')}</h4>
                        <button onClick={() => navigate('/gallery')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('landingV5.footer.examples', 'Examples')}
                        </button>
                        <button onClick={() => navigate('/pricing')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('landingV5.footer.pricing', 'Pricing')}
                        </button>
                        <button onClick={() => navigate('/alternatives')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('footer.alternatives', 'Alternatives')}
                        </button>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-bold text-foreground">{t('footer.legal', 'Legal')}</h4>
                        <TermsLink className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('landingV5.footer.terms', 'Terms of Service')}
                        </TermsLink>
                        <PrivacyLink className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('landingV5.footer.privacy', 'Privacy Policy')}
                        </PrivacyLink>
                        <button onClick={() => navigate('/payment-terms')} className="text-muted-foreground hover:text-primary transition-colors text-left">
                            {t('footer.paymentTerms', 'Payment Terms')}
                        </button>
                    </div>

                    {/* Contacts */}
                    <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
                        <h4 className="font-bold text-foreground">{t('footer.contacts', 'Contacts')}</h4>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4 shrink-0" />
                            <a href="mailto:support@lnkmx.my" className="hover:text-primary transition-colors">support@lnkmx.my</a>
                        </div>
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">
                                {t('footer.companyInfo', 'ARchitecKZ / БИН 190540008684 / Казахстан, г. Алматы')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Language switcher */}
                <div className="flex justify-center mb-6">
                    <LanguageSwitcher />
                </div>

                {/* Copyright */}
                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {t('landingV5.footer.copyright', { year: currentYear, defaultValue: `© ${currentYear} lnkmx. All rights reserved.` })}
                    <Heart className="h-3 w-3 text-primary/50" />
                </p>
            </div>
        </footer>
    );
};
