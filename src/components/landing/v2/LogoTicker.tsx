import { useTranslation } from "react-i18next";
import Crown from 'lucide-react/dist/esm/icons/crown';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Hexagon from 'lucide-react/dist/esm/icons/hexagon';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Rocket from 'lucide-react/dist/esm/icons/rocket';

const companyIcons = [Crown, Zap, Palette, Rocket, Hexagon, Shield, Gem, Layers];
const companyKeys = [
    'landing.ticker.creators',
    'landing.ticker.coaches',
    'landing.ticker.designers',
    'landing.ticker.startups',
    'landing.ticker.agencies',
    'landing.ticker.clinics',
    'landing.ticker.studios',
    'landing.ticker.experts',
];

export const LogoTicker = () => {
    const { t } = useTranslation();
    const companies = companyKeys.map((key, i) => ({
        name: t(key, key.split('.').pop()!),
        Icon: companyIcons[i],
    }));

    return (
        <div className="py-10 bg-transparent border-y border-white/5 backdrop-blur-sm overflow-hidden">
            <div className="container mx-auto px-4 mb-4 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('landing.ticker.title', 'Подходит для любой ниши')}</p>
            </div>
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <div
                    className="flex gap-12 sm:gap-24 items-center pr-12 sm:pr-24 shrink-0"
                    style={{ animation: 'ticker 25s linear infinite' }}
                >
                    {[...companies, ...companies].map((company, index) => (
                        <div key={index} className="flex items-center gap-2 text-muted-foreground/50 hover:text-primary transition-colors cursor-default group">
                            <company.Icon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg hidden sm:block">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>
    );
};
