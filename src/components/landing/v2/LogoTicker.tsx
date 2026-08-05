import { useTranslation } from 'react-i18next';
import Scissors from 'lucide-react/dist/esm/icons/scissors';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Dumbbell from 'lucide-react/dist/esm/icons/dumbbell';
import Camera from 'lucide-react/dist/esm/icons/camera';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Building2 from 'lucide-react/dist/esm/icons/building-2';

const niches = [
  { Icon: Scissors, key: 'landing.ticker.beauty', fallback: 'Бьюти-мастера' },
  { Icon: GraduationCap, key: 'landing.ticker.tutors', fallback: 'Репетиторы' },
  { Icon: Dumbbell, key: 'landing.ticker.fitness', fallback: 'Фитнес-тренеры' },
  { Icon: Camera, key: 'landing.ticker.photographers', fallback: 'Фотографы' },
  { Icon: Wrench, key: 'landing.ticker.services', fallback: 'Сервис и ремонт' },
  { Icon: Briefcase, key: 'landing.ticker.consultants', fallback: 'Консалтинг' },
  { Icon: Heart, key: 'landing.ticker.psychologists', fallback: 'Психологи' },
  { Icon: Building2, key: 'landing.ticker.agencies', fallback: 'Агентства' },
];

export const LogoTicker = () => {
  const { t } = useTranslation();

  return (
    <section className="border-y border-[#d8dee8] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            {t('landing.ticker.title_v2', 'Подходит для этих ниш и форматов услуг')}
          </p>
          <p className="max-w-md text-sm leading-6 text-[#6b7689]">
            {t('landing.v5.badge', 'Операционный контур для услуг, экспертов и небольших команд')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {niches.map((item) => (
            <div
              key={item.key}
              className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#d8dee8] bg-[#f6f7f9] p-4 transition-colors hover:border-[#2563eb]/40 hover:bg-[#eef4ff]"
            >
              <item.Icon className="h-5 w-5 text-[#2563eb]" />
              <span className="text-sm font-semibold leading-5 text-[#172033]">
                {t(item.key, item.fallback)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
