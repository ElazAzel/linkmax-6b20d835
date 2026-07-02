import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Heart from 'lucide-react/dist/esm/icons/heart';
import { MagneticButton } from './MagneticButton';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const BottomCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const guarantees = [
    {
      icon: Zap,
      title: t('landing.bottomCta.g1Title', '15 минут до запуска'),
      desc: t('landing.bottomCta.g1Desc', 'AI создаст всё за вас'),
    },
    {
      icon: Shield,
      title: t('landing.bottomCta.g2Title', 'Без карты'),
      desc: t('landing.bottomCta.g2Desc', 'Старт абсолютно бесплатный'),
    },
    {
      icon: Heart,
      title: t('landing.bottomCta.g3Title', 'Поддержка 24/7'),
      desc: t('landing.bottomCta.g3Desc', 'Telegram-чат с командой'),
    },
  ];

  return (
    <SectionWrapper className="overflow-hidden z-10 bg-transparent">
      <div className="container px-4 mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          {/* Live activity badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/15 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
              {t('landing.bottomCta.live', 'Сегодня запустили: 47 страниц')}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[1.05]">
            {t('landing.bottomCta.title', 'Готовы получать клиентов?')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground/80 max-w-md mx-auto font-semibold">
            {t(
              'landing.bottomCta.subtitle',
              'AI-страница за 15 минут. Заявки в Telegram. Первые клиенты — уже сегодня.'
            )}
          </p>

          <MagneticButton
            onClick={() => navigate('/auth')}
            size="lg"
            className="h-14 sm:h-16 px-6 sm:px-14 rounded-2xl text-sm sm:text-lg font-black bg-primary text-white shadow-glass-hover hover:scale-[1.03] active:scale-95 transition-all group overflow-hidden relative border-none w-full max-w-md sm:max-w-none sm:w-auto whitespace-normal"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            <span className="relative z-10 inline-flex items-center justify-center gap-2 sm:gap-3 sm:uppercase sm:tracking-[0.1em] text-center leading-tight">
              {t('landing.bottomCta.cta', 'Создать страницу бесплатно')}
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 group-hover:translate-x-2 transition-transform duration-500" />
            </span>
          </MagneticButton>

          <p className="text-xs text-muted-foreground/60 font-semibold">
            {t('landing.bottomCta.note', 'Бесплатно · Без кода · Без банковской карты')}
          </p>

          {/* Guarantees grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto">
            {guarantees.map((g, i) => {
              const Icon = g.icon;
              return (
                <div
                  key={i}
                  className="glass rounded-2xl p-5 border border-border/20 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-black mb-1">{g.title}</h3>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
