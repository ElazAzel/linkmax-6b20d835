import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { cn } from '@/lib/utils/utils';

type Cell = boolean | string;

export const ComparisonTable = () => {
  const { t } = useTranslation();

  const rows: { label: string; linkmax: Cell; linktree: Cell; bitrix: Cell }[] = [
    { label: t('landing.compare.r1', 'Цена входа'), linkmax: t('landing.compare.r1.linkmax', '0 тг + 5%'), linktree: '$0-24', bitrix: t('landing.compare.r1.bitrix', 'от 12 000 тг') },
    { label: t('landing.compare.r2', 'Время запуска'), linkmax: t('landing.compare.r2.linkmax', '15 минут'), linktree: t('landing.compare.r2.linktree', '5 минут'), bitrix: t('landing.compare.r2.bitrix', '2-5 дней') },
    { label: t('landing.compare.r3', 'Витрина услуг и оплата'), linkmax: true, linktree: false, bitrix: t('landing.compare.r3.bitrix', 'через интеграции') },
    { label: t('landing.compare.r4', 'Inbox заявок из мессенджеров'), linkmax: true, linktree: false, bitrix: true },
    { label: t('landing.compare.r5', 'Онлайн-бронирование'), linkmax: true, linktree: false, bitrix: t('landing.compare.r5.bitrix', 'отдельно') },
    { label: t('landing.compare.r6', 'Мобильный CRM'), linkmax: true, linktree: false, bitrix: t('landing.compare.r6.bitrix', 'неудобный') },
    { label: t('landing.compare.r7', 'Команда до 10 человек'), linkmax: true, linktree: false, bitrix: true },
    { label: t('landing.compare.r8', 'Платите только когда зарабатываете'), linkmax: true, linktree: false, bitrix: false },
  ];

  return (
    <SectionWrapper id="compare" className="bg-[#f6f7f9] py-20 md:py-24">
      <SectionHeading
        title={t('landing.compare.title', 'Почему уходят от Linktree и Bitrix')}
        subtitle={t(
          'landing.compare.subtitle',
          'Linktree - слишком мало. Bitrix и amoCRM - слишком много и дорого. LinkMAX - ровно то, что нужно сервисному бизнесу.'
        )}
        className="mb-12"
        titleClassName="text-[#172033]"
      />

      <div className="mx-auto max-w-[1040px]">
        <div className="hidden overflow-hidden rounded-[18px] border border-[#d8dee8] bg-white shadow-[0_16px_40px_rgba(23,32,51,0.10)] sm:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#edf1f6] bg-[#f6f7f9] text-left">
                <th className="p-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7689]">
                  {t('landing.compare.feature', 'Критерий')}
                </th>
                <th className="p-4 text-center">
                  <span className="text-base font-semibold text-[#2563eb]">LinkMAX</span>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]/70">
                    {t('landing.compare.us', 'Это мы')}
                  </div>
                </th>
                <th className="p-4 text-center font-semibold text-[#6b7689]">Linktree</th>
                <th className="p-4 text-center font-semibold text-[#6b7689]">amoCRM / Bitrix</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.label} className={cn('border-b border-[#edf1f6] last:border-b-0', index % 2 === 0 && 'bg-[#fbfcfd]')}>
                  <td className="p-4 font-semibold text-[#172033]">{row.label}</td>
                  <ComparisonCell value={row.linkmax} highlight />
                  <ComparisonCell value={row.linktree} />
                  <ComparisonCell value={row.bitrix} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[18px] border border-[#d8dee8] bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-[#172033]">{row.label}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MobileCell label="LinkMAX" value={row.linkmax} highlight />
                <MobileCell label="Linktree" value={row.linktree} />
                <MobileCell label="amoCRM" value={row.bitrix} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

function ComparisonCell({ value, highlight }: { value: Cell; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return (
      <td className="p-4 text-center">
        {value ? (
          <Check className={cn('inline h-5 w-5', highlight ? 'text-[#2563eb]' : 'text-emerald-600')} />
        ) : (
          <X className="inline h-5 w-5 text-[#9aa4b2]" />
        )}
      </td>
    );
  }

  return (
    <td className={cn('p-4 text-center text-sm font-semibold tabular-nums', highlight ? 'text-[#2563eb]' : 'text-[#6b7689]')}>
      {value}
    </td>
  );
}

function MobileCell({ label, value, highlight }: { label: string; value: Cell; highlight?: boolean }) {
  const rendered =
    typeof value === 'boolean' ? (
      value ? (
        <Check className={cn('inline h-4 w-4', highlight ? 'text-[#2563eb]' : 'text-emerald-600')} />
      ) : (
        <X className="inline h-4 w-4 text-[#9aa4b2]" />
      )
    ) : (
      <span className={cn('text-xs font-semibold', highlight ? 'text-[#2563eb]' : 'text-[#6b7689]')}>{value}</span>
    );

  return (
    <div className="min-w-0 rounded-[12px] bg-[#f6f7f9] p-2">
      <div className={cn('truncate text-[10px] font-semibold uppercase tracking-[0.12em]', highlight ? 'text-[#2563eb]' : 'text-[#6b7689]')}>
        {label}
      </div>
      <div className="mt-2 flex min-h-[24px] items-center justify-center">{rendered}</div>
    </div>
  );
}
