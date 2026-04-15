import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { MagneticButton } from './MagneticButton';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const BottomCTA = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <SectionWrapper className="overflow-hidden z-10 bg-transparent">
            <div className="container px-4 mx-auto text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-[1.05]">
                        {t('landing.bottomCta.title', 'Готовы получать клиентов?')}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground/70 max-w-md mx-auto font-semibold">
                        {t('landing.bottomCta.subtitle', 'Создайте AI-страницу бесплатно за 2 минуты. Первые клиенты — уже сегодня.')}
                    </p>
                    <MagneticButton
                        onClick={() => navigate('/auth')}
                        size="lg"
                        className="h-14 sm:h-16 px-10 sm:px-14 rounded-2xl text-base sm:text-lg font-black bg-primary text-white shadow-glass-hover hover:scale-[1.05] active:scale-95 transition-all group overflow-hidden relative border-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                        <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.1em]">
                            {t('landing.bottomCta.cta', 'Создать страницу')}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                        </span>
                    </MagneticButton>
                    <p className="text-xs text-muted-foreground/40 font-semibold">
                        {t('landing.bottomCta.note', 'Бесплатно · Без кода · Без банковской карты')}
                    </p>
                </div>
            </div>
        </SectionWrapper>
    );
};