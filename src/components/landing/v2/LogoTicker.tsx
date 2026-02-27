import { cn } from "@/lib/utils/utils";
import { useTranslation } from "react-i18next";
import Crown from 'lucide-react/dist/esm/icons/crown';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Hexagon from 'lucide-react/dist/esm/icons/hexagon';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Shield from 'lucide-react/dist/esm/icons/shield';

const companies = [
    { name: "Acme Corp", icon: Hexagon },
    { name: "GlobalTech", icon: GlobeIcon },
    { name: "Nebula", icon: Gem },
    { name: "Crown", icon: Crown },
    { name: "ShieldSecurity", icon: Shield },
    { name: "Layers", icon: Layers },
];

function GlobeIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

export const LogoTicker = () => {
    const { t } = useTranslation();
    return (
        <div className="py-10 bg-background/50 border-y border-white/5 backdrop-blur-sm overflow-hidden">
            <div className="container mx-auto px-4 mb-4 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('landing.v2.logoTicker.title', 'Trusted by creators worldwide')}</p>
            </div>
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)]">
                <div
                    className="flex gap-12 sm:gap-24 items-center pr-12 sm:pr-24 shrink-0 animate-[ticker_20s_linear_infinite]"
                    style={{ animation: 'ticker 20s linear infinite' }}
                >
                    {[...companies, ...companies].map((company, index) => (
                        <div key={index} className="flex items-center gap-2 text-muted-foreground/50 hover:text-primary transition-colors cursor-default group">
                            <company.icon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg hidden sm:block">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>
    );
};
