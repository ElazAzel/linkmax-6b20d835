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
    const items = niches.map(n => ({ ...n, name: t(n.key, n.fallback) }));

    return (
        <div className="py-10 bg-transparent border-y border-white/5 backdrop-blur-sm overflow-hidden">
            <div className="container mx-auto px-4 mb-4 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {t('landing.ticker.title_v2', 'Подходит для этих ниш и форматов услуг')}
                </p>
            </div>
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <div
                    className="flex gap-12 sm:gap-24 items-center pr-12 sm:pr-24 shrink-0"
                    style={{ animation: 'ticker 30s linear infinite' }}
                >
                    {[...items, ...items].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-muted-foreground/60 hover:text-primary transition-colors cursor-default group">
                            <item.Icon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-base sm:text-lg whitespace-nowrap">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>
    );
};
