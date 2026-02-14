import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, Crown, Shield, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';

interface PricingSectionProps {
  isKZ: boolean;
  onSelectFree: () => void;
  onSelectPro: () => void;
}

export default function PricingSection({ isKZ, onSelectFree, onSelectPro }: PricingSectionProps) {
  const { t } = useTranslation();

  const freeFeatures = [
    t('landingV5.pricing.free.features.1'),
    t('landingV5.pricing.free.features.2'),
    t('landingV5.pricing.free.features.3'),
    t('landingV5.pricing.free.features.4'),
  ];

  const proFeatures = [
    t('landingV5.pricing.pro.features.1'),
    t('landingV5.pricing.pro.features.2'),
    t('landingV5.pricing.pro.features.3'),
    t('landingV5.pricing.pro.features.4'),
    t('landingV5.pricing.pro.features.5'),
    t('landingV5.pricing.pro.features.6'),
  ];

  return (
    <section className="py-12 px-5 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-8">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.pricing.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.pricing.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('landingV5.pricing.subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4">
          {/* Free Plan */}
          <Reveal delay={100} direction="left" distance={16}>
            <Card className="p-5 border border-border/50 bg-card/50 hover:border-border hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{t('landingV5.pricing.free.title')}</h3>
                  <p className="text-2xl font-black">{t('landingV5.pricing.free.price')}</p>
                </div>
                <Badge variant="secondary" className="rounded-lg">{t('landingV5.pricing.free.period')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t('landingV5.pricing.free.description')}</p>
              <ul className="space-y-2 text-sm mb-4">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full h-11 rounded-xl font-semibold",
                  "hover:scale-[1.01] active:scale-[0.99] transition-all"
                )}
                onClick={onSelectFree}
              >
                {t('landingV5.pricing.free.cta')}
              </Button>
            </Card>
          </Reveal>

          {/* Pro Plan */}
          <Reveal delay={200} direction="right" distance={16}>
            <Card className="p-5 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Shine effect */}
              <div className="absolute -inset-px bg-gradient-to-tr from-primary/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute -top-px left-4 px-3 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold rounded-b-lg flex items-center gap-1 shadow-md">
                <Star className="h-3 w-3" />
                {t('landingV5.pricing.pro.popular')}
              </div>
              
              <div className="flex items-center justify-between mb-4 pt-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {t('landingV5.pricing.pro.title')} <Crown className="h-4 w-4 text-primary" />
                  </h3>
                  <p className="text-2xl font-black">
                    {isKZ ? '3 045 ₸' : '$6'}
                    <span className="text-sm font-normal text-muted-foreground">{t('landingV5.pricing.pro.period')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isKZ ? '36 540 ₸ ' : '$71 '}{t('landingV5.pricing.year')} · {t('landingV5.pricing.bestValue')}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{t('landingV5.pricing.pro.description')}</p>
              
              <ul className="space-y-2 text-sm mb-4">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className={cn(
                      "h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0",
                      i < 2 ? "bg-primary text-primary-foreground" : "bg-primary/10"
                    )}>
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span className={i < 2 ? 'font-medium' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={cn(
                  "w-full h-11 rounded-xl font-semibold",
                  "bg-gradient-to-r from-primary to-primary/90",
                  "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                  "hover:scale-[1.01] active:scale-[0.99] transition-all"
                )}
                onClick={onSelectPro}
              >
                <Crown className="h-4 w-4 mr-2" />
                {t('landingV5.pricing.pro.cta')}
              </Button>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={400} direction="fade">
          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            {t('landingV5.pricing.guarantee')}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
