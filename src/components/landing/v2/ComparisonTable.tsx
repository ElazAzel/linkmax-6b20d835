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
        { label: t('landing.compare.r1', 'Цена входа'), linkmax: t('landing.compare.r1.linkmax', '0 ₸ + 5%'), linktree: '$0–24', bitrix: t('landing.compare.r1.bitrix', 'от 12 000 ₸') },
        { label: t('landing.compare.r2', 'Время запуска'), linkmax: t('landing.compare.r2.linkmax', '15 минут'), linktree: t('landing.compare.r2.linktree', '5 минут'), bitrix: t('landing.compare.r2.bitrix', '2–5 дней') },
        { label: t('landing.compare.r3', 'Витрина услуг и оплата'), linkmax: true, linktree: false, bitrix: t('landing.compare.r3.bitrix', 'через интеграции') },
        { label: t('landing.compare.r4', 'Inbox заявок из мессенджеров'), linkmax: true, linktree: false, bitrix: true },
        { label: t('landing.compare.r5', 'Онлайн-бронирование'), linkmax: true, linktree: false, bitrix: t('landing.compare.r5.bitrix', 'отдельно') },
        { label: t('landing.compare.r6', 'Мобильный CRM'), linkmax: true, linktree: false, bitrix: t('landing.compare.r6.bitrix', 'неудобный') },
        { label: t('landing.compare.r7', 'Команда до 10 человек'), linkmax: true, linktree: false, bitrix: true },
        { label: t('landing.compare.r8', 'Платите только когда зарабатываете'), linkmax: true, linktree: false, bitrix: false },
    ];

    return (
        <SectionWrapper id="compare" className="bg-transparent overflow-hidden">
            <SectionHeading
                title={t('landing.compare.title', 'Почему уходят от Linktree и Bitrix')}
                subtitle={t('landing.compare.subtitle', 'Linktree — слишком мало. Bitrix и amoCRM — слишком много и дорого. LinkMAX — ровно то, что нужно сервисному бизнесу.')}
                className="mb-12"
            />

            {/* Mobile: stacked cards */}
            <div className="sm:hidden max-w-md mx-auto space-y-3 px-2">
                {rows.map((row, i) => (
                    <div key={i} className="glass border-primary/20 rounded-2xl p-4 shadow-glass-lg">
                        <div className="text-sm font-semibold text-foreground/90 mb-3">{row.label}</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <MobileCell label="LinkMAX" value={row.linkmax} highlight />
                            <MobileCell label="Linktree" value={row.linktree} />
                            <MobileCell label="amoCRM" value={row.bitrix} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ≥sm: full table (with fallback horizontal scroll) */}
            <div className="hidden sm:block max-w-5xl mx-auto glass border-primary/20 rounded-[2rem] p-2 sm:p-4 overflow-x-auto shadow-glass-lg">
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="text-left">
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground"></th>
                            <th className="p-4 text-center">
                                <span className="inline-flex items-center gap-2 font-black text-primary text-base">LinkMAX</span>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mt-0.5">{t('landing.compare.us', 'Это мы')}</div>
                            </th>
                            <th className="p-4 text-center font-black text-muted-foreground/80">Linktree</th>
                            <th className="p-4 text-center font-black text-muted-foreground/80">amoCRM / Bitrix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 && 'bg-background/20')}>
                                <td className="p-4 font-semibold text-foreground/90">{row.label}</td>
                                <ComparisonCell value={row.linkmax} highlight />
                                <ComparisonCell value={row.linktree} />
                                <ComparisonCell value={row.bitrix} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionWrapper>
    );
};

function ComparisonCell({ value, highlight }: { value: Cell; highlight?: boolean }) {
    if (typeof value === 'boolean') {
        return (
            <td className="p-4 text-center">
                {value ? (
                    <Check className={cn('inline w-5 h-5', highlight ? 'text-primary' : 'text-emerald-500/70')} />
                ) : (
                    <X className="inline w-5 h-5 text-muted-foreground/40" />
                )}
            </td>
        );
    }
    return (
        <td className={cn('p-4 text-center text-sm font-semibold tabular-nums', highlight ? 'text-primary' : 'text-muted-foreground')}>
            {value}
        </td>
    );
}

function MobileCell({ label, value, highlight }: { label: string; value: Cell; highlight?: boolean }) {
    const renderValue = () => {
        if (typeof value === 'boolean') {
            return value ? (
                <Check className={cn('inline w-4 h-4', highlight ? 'text-primary' : 'text-emerald-500/70')} />
            ) : (
                <X className="inline w-4 h-4 text-muted-foreground/40" />
            );
        }
        return (
            <span className={cn('text-xs font-bold break-words', highlight ? 'text-primary' : 'text-muted-foreground')}>
                {value}
            </span>
        );
    };
    return (
        <div className="flex flex-col items-center gap-1 min-w-0">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide truncate max-w-full', highlight ? 'text-primary/80' : 'text-muted-foreground/60')}>
                {label}
            </span>
            <div className="flex items-center justify-center min-h-[24px]">
                {renderValue()}
            </div>
        </div>
    );
}
