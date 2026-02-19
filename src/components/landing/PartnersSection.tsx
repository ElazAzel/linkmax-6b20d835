import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { cn } from '@/lib/utils/utils';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string | null;
}

// Placeholder partners for when database is empty or loading
const placeholderPartners: Partner[] = Array.from({ length: 10 }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    name: `Partner ${i + 1}`,
    logo_url: `https://via.placeholder.com/200x80/${['1a1a2e', '16213e', '0f3460', '533483', 'e94560'][i % 5]}/ffffff?text=Partner+${i + 1}`,
    website_url: null,
}));

export function PartnersSection() {
    const { t } = useTranslation();

    const { data: partners } = useQuery({
        queryKey: ['landing-partners'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('partners')
                .select('id, name, logo_url, website_url')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return (data || []) as Partner[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Use fetched partners or placeholders
    const displayPartners = partners?.length ? partners : placeholderPartners;

    // Double the partners for seamless loop
    const loopedPartners = [...displayPartners, ...displayPartners];

    return (
        <section className="py-8 px-5 overflow-hidden">
            <div className="max-w-xl mx-auto">
                <p className="text-center text-sm font-medium text-muted-foreground mb-6">
                    {t('landing.partners.title', 'Нам доверяют')}
                </p>
            </div>

            {/* Marquee Container */}
            <div className="relative">
                {/* Gradient fades on edges */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                {/* Marquee track */}
                <div
                    className="flex items-center gap-8 animate-marquee hover:[animation-play-state:paused]"
                    style={{
                        width: 'max-content',
                    }}
                >
                    {loopedPartners.map((partner, index) => (
                        <PartnerLogo key={`${partner.id}-${index}`} partner={partner} />
                    ))}
                </div>
            </div>

            {/* CSS for marquee animation */}
            <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
        </section>
    );
}

function PartnerLogo({ partner }: { partner: Partner }) {
    const Wrapper = partner.website_url ? 'a' : 'div';
    const wrapperProps = partner.website_url
        ? {
            href: partner.website_url,
            target: '_blank',
            rel: 'noopener noreferrer',
        }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={cn(
                "flex-shrink-0 h-12 px-4 flex items-center justify-center",
                "bg-card/50 rounded-xl border border-border/30",
                "transition-all duration-300 hover:border-border/60 hover:bg-card",
                partner.website_url && "cursor-pointer"
            )}
        >
            <img
                src={partner.logo_url}
                alt={partner.name}
                className="h-6 w-auto max-w-[120px] object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                loading="lazy"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x24?text=Logo';
                }}
            />
        </Wrapper>
    );
}
