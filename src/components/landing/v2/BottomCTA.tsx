import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Zap from 'lucide-react/dist/esm/icons/zap';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const BottomCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const guarantees = [
    {
      icon: Zap,
      title: t('landing.bottomCta.g1Title', '15 минут до запуска'),
      desc: t('landing.bottomCta.g1Desc', 'AI создаст все за вас'),
    },
    {
      icon: Shield,
      title: t('landing.bottomCta.g2Title', 'Без карты'),
      desc: t('landing.bottomCta.g2Desc', 'Старт абсолютно бесплатный'),
    },
    {
      icon: CheckCircle2,
      title: t('landing.bottomCta.g3Title', 'Поддержка 24/7'),
      desc: t('landing.bottomCta.g3Desc', 'Telegram-чат с командой'),
    },
  ];

  return (
    <SectionWrapper className="bg-[#f6f7f9] py-20 md:py-24">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[18px] bg-[#2563eb] p-6 text-white sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {t('landing.bottomCta.live', 'Сегодня запустили: 47 страниц')}
            </div>
            <h2 className="mt-6 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
              {t('landing.bottomCta.title', 'Готовы получать клиентов?')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
              {t(
                'landing.bottomCta.subtitle',
                'AI-страница за 15 минут. Заявки в Telegram. Первые клиенты - уже сегодня.'
              )}
            </p>
          </div>

          <div className="lg:text-right">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="h-12 w-full rounded-[12px] bg-white px-6 text-base font-semibold text-[#172033] hover:bg-[#eef4ff] sm:w-auto"
            >
              {t('landing.bottomCta.cta', 'Создать страницу бесплатно')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-xs font-medium text-white/70">
              {t('landing.bottomCta.note', 'Бесплатно · Без кода · Без банковской карты')}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {guarantees.map((item) => (
            <div key={item.title} className="rounded-[18px] border border-white/16 bg-white/10 p-4">
              <item.icon className="h-5 w-5 text-white" />
              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-5 text-white/72">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
