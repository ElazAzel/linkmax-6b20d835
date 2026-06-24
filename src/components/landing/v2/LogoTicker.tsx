import { useTranslation } from 'react-i18next';
import { Scissors, GraduationCap, Dumbbell, Camera, Wrench, Briefcase, Heart, Building2 } from 'lucide-react';

const niches = [
    { Icon: Scissors, key: 'landing.ticker.beauty', fallback: 'Р‘СЊСЋС‚Рё-РјР°СЃС‚РµСЂР°' },
    { Icon: GraduationCap, key: 'landing.ticker.tutors', fallback: 'Р РµРїРµС‚РёС‚РѕСЂС‹' },
    { Icon: Dumbbell, key: 'landing.ticker.fitness', fallback: 'Р¤РёС‚РЅРµСЃ-С‚СЂРµРЅРµСЂС‹' },
    { Icon: Camera, key: 'landing.ticker.photographers', fallback: 'Р¤РѕС‚РѕРіСЂР°С„С‹' },
    { Icon: Wrench, key: 'landing.ticker.services', fallback: 'РЎРµСЂРІРёСЃ Рё СЂРµРјРѕРЅС‚' },
    { Icon: Briefcase, key: 'landing.ticker.consultants', fallback: 'РљРѕРЅСЃР°Р»С‚РёРЅРі' },
    { Icon: Heart, key: 'landing.ticker.psychologists', fallback: 'РџСЃРёС…РѕР»РѕРіРё' },
    { Icon: Building2, key: 'landing.ticker.agencies', fallback: 'РђРіРµРЅС‚СЃС‚РІР°' },
];

export const LogoTicker = () => {
    const { t } = useTranslation();
    const items = niches.map(n => ({ ...n, name: t(n.key, n.fallback) }));

    return (
        <div className="py-10 bg-transparent border-y border-white/5 backdrop-blur-sm overflow-hidden">
            <div className="container mx-auto px-4 mb-4 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {t('landing.ticker.title_v2', 'РСЃРїРѕР»СЊР·СѓСЋС‚ 1 200+ РјР°СЃС‚РµСЂРѕРІ Рё РєРѕРјР°РЅРґ РІ СЌС‚РёС… РЅРёС€Р°С…')}
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

