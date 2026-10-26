import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";
import { FIXED_PRICES_KZT } from "@/hooks/useCurrencyRate";
import i18n from '@/i18n/config';

const PRICING_URL = "https://lnkmx.my/pricing";

function pricingJsonLd() {
  const proPrices = Object.values(FIXED_PRICES_KZT);
  const offer = (name: string, price: number, description: string) => ({
    "@type": "Offer",
    name,
    description,
    price,
    priceCurrency: "KZT",
    availability: "https://schema.org/InStock",
    url: PRICING_URL,
  });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "LinkMAX",
    description:
      "Конструктор страницы-ссылки для специалистов: запись, заявки, CRM и аналитика.",
    brand: { "@type": "Brand", name: "LinkMAX" },
    url: PRICING_URL,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "KZT",
      lowPrice: 0,
      highPrice: Math.max(...proPrices),
      offerCount: 3,
      offers: [
        offer("Identity", 0, "Бесплатная страница-визитка"),
        offer("Starter", 0, "Бесплатный старт с заявками"),
        {
          ...offer("Pro", Math.min(...proPrices), "AI, CRM, аналитика и свой домен, цена за месяц при оплате за 12 месяцев"),
          priceSpecification: Object.entries(FIXED_PRICES_KZT).map(([months, price]) => ({
            "@type": "UnitPriceSpecification",
            price,
            priceCurrency: "KZT",
            unitCode: "MON",
            description: `Оплата за ${months} мес.`,
          })),
        },
      ],
    },
  };
}

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: `${i18n.t('pricing.title')} ${i18n.t('pricing.titleHighlight')} · LinkMAX` },
      { name: 'description', content: i18n.t('pricing.subtitle') },
      { property: 'og:title', content: `${i18n.t('pricing.title')} ${i18n.t('pricing.titleHighlight')} · LinkMAX` },
      { property: 'og:description', content: i18n.t('pricing.subtitle') },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(pricingJsonLd()) }],
  }),
  component: Pricing,
});
