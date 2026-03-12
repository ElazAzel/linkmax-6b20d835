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
        <footer className="border-t border-white/5 py-24 pb-32 px-6 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Logo and description */}
                <div className="text-center mb-24 flex flex-col items-center">
                    <span className="text-5xl font-black tracking-[-0.05em] mb-6 drop-shadow-sm">
                        lnk<span className="text-primary italic">mx.</span>
                    </span>
                    <p className="text-lg text-muted-foreground/40 max-w-md mx-auto font-semibold leading-relaxed tracking-tight">
                        {t('landingV5.footer.description', 'The all-in-one platform for creators and micro-businesses. Built for the future.')}
                    </p>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24">
                    {/* Brand */}
                    <div className="hidden md:flex flex-col gap-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">{t('footer.brand', 'Platform')}</h4>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => navigate('/')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">Home</button>
                            <button onClick={() => navigate('/auth')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">Dashboard</button>
                            <button onClick={() => navigate('/docs')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">Docs</button>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">{t('footer.product', 'Product')}</h4>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => navigate('/gallery')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('landingV5.footer.examples', 'Examples')}</button>
                            <button onClick={() => navigate('/pricing')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('landingV5.footer.pricing', 'Pricing')}</button>
                            <button onClick={() => navigate('/alternatives')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('footer.alternatives', 'Alternatives')}</button>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">{t('footer.legal', 'Legal')}</h4>
                        <div className="flex flex-col gap-4">
                            <TermsLink className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('landingV5.footer.terms', 'Terms')}</TermsLink>
                            <PrivacyLink className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('landingV5.footer.privacy', 'Privacy')}</PrivacyLink>
                            <button onClick={() => navigate('/payment-terms')} className="text-sm font-black text-muted-foreground/60 hover:text-primary transition-all text-left uppercase tracking-widest">{t('footer.paymentTerms', 'Billing')}</button>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="flex flex-col gap-6 col-span-2 md:col-span-1">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">{t('footer.contacts', 'Support')}</h4>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-4 text-muted-foreground/60 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl glass border-white/5 flex items-center justify-center group-hover:border-primary/30 transition-all">
                                    <Mail className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </div>
                                <a href="mailto:support@lnkmx.my" className="text-sm font-black group-hover:text-primary transition-all tracking-tight">support@lnkmx.my</a>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground/60">
                                <div className="w-10 h-10 rounded-xl glass border-white/5 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 opacity-50" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    {t('footer.companyInfo', 'ARchitecKZ / Almaty')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="glass px-4 py-2 rounded-xl border-white/5 shadow-glass-sm scale-90">
                            <LanguageSwitcher />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                            {t('landingV5.footer.copyright', { year: currentYear, defaultValue: `© ${currentYear} Inkmax` })}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">
                        Built with <Heart className="h-4 w-4 text-primary opacity-50 animate-pulse" /> in Almaty
                    </div>
                </div>
            </div>
        </footer>
    );
};
