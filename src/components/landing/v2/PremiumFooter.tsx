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
        <footer className="border-t border-white/5 py-16 pb-24 px-6 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
            
            <div className="max-w-6xl mx-auto relative z-10">
                {/* Logo and description */}
                <div className="text-center mb-16 flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tighter mb-4">
                        lnk<span className="text-primary italic">mx.</span>
                    </span>
                    <p className="text-base text-muted-foreground/60 max-w-sm mx-auto font-medium leading-relaxed">
                        {t('landingV5.footer.description', 'The all-in-one platform for creators and micro-businesses. Built for the future.')}
                    </p>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="hidden md:flex flex-col gap-5">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">{t('footer.brand', 'Platform')}</h4>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">Home</button>
                            <button onClick={() => navigate('/auth')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">Dashboard</button>
                            <button onClick={() => navigate('/docs')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">Docs</button>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">{t('footer.product', 'Product')}</h4>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/gallery')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('landingV5.footer.examples', 'Examples')}</button>
                            <button onClick={() => navigate('/pricing')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('landingV5.footer.pricing', 'Pricing')}</button>
                            <button onClick={() => navigate('/alternatives')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('footer.alternatives', 'Alternatives')}</button>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">{t('footer.legal', 'Legal')}</h4>
                        <div className="flex flex-col gap-3">
                            <TermsLink className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('landingV5.footer.terms', 'Terms')}</TermsLink>
                            <PrivacyLink className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('landingV5.footer.privacy', 'Privacy')}</PrivacyLink>
                            <button onClick={() => navigate('/payment-terms')} className="text-sm font-bold text-muted-foreground/80 hover:text-primary transition-all text-left truncate">{t('footer.paymentTerms', 'Billing')}</button>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="flex flex-col gap-5 col-span-2 md:col-span-1">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">{t('footer.contacts', 'Support')}</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-muted-foreground/80">
                                <Mail className="w-5 h-5 opacity-40 shrink-0" />
                                <a href="mailto:support@lnkmx.my" className="text-sm font-bold hover:text-primary transition-all">support@lnkmx.my</a>
                            </div>
                            <div className="flex items-start gap-3 text-muted-foreground/80">
                                <MapPin className="w-5 h-5 opacity-40 shrink-0 mt-0.5" />
                                <span className="text-xs font-bold leading-relaxed">
                                    {t('footer.companyInfo', 'ARchitecKZ / Almaty, Kazakstan')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <LanguageSwitcher />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            {t('landingV5.footer.copyright', { year: currentYear, defaultValue: `© ${currentYear} Inkmax` })}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                        Built with <Heart className="h-4 w-4 text-primary animate-pulse" /> in Almaty
                    </div>
                </div>
            </div>
        </footer>
    );
};
