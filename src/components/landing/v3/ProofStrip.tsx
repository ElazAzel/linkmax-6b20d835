import { useTranslation } from 'react-i18next';

/**
 * Compact proof strip on the ink band — reads as a spec sheet, not a badge wall.
 */
export function ProofStrip() {
  const { t } = useTranslation();

  const items = [
    {
      id: 'setup',
      value: t('landing.short.proof.setupValue', '5 мин'),
      label: t('landing.short.proof.setupLabel', 'от адреса до готовой страницы'),
    },
    {
      id: 'blocks',
      value: t('landing.short.proof.blocksValue', '28'),
      label: t('landing.short.proof.blocksLabel', 'блоков: услуги, запись, оплата, отзывы'),
    },
    {
      id: 'langs',
      value: t('landing.short.proof.langsValue', '4'),
      label: t('landing.short.proof.langsLabel', 'языка интерфейса и страниц'),
    },
    {
      id: 'price',
      value: t('landing.short.proof.priceValue', '0 ₸'),
      label: t('landing.short.proof.priceLabel', 'старт без карты и подписки'),
    },
  ];

  return (
    <section className="border-b border-brand-ink/15 bg-brand-ink px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="border-t border-white/20 pt-4">
            <p className="font-metric text-3xl font-bold leading-none text-white">{item.value}</p>
            <p className="mt-2 text-sm leading-5 text-white/65">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
