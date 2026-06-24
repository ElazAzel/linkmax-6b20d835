import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { cn } from '@/lib/utils/utils';

type Cell = boolean | string;

export const ComparisonTable = () => {
    const { t } = useTranslation();

    const rows: { label: string; linkmax: Cell; linktree: Cell; bitrix: Cell }[] = [
        { label: t('landing.compare.r1', 'Р¦РµРЅР° РІС…РѕРґР°'), linkmax: t('landing.compare.r1.linkmax', '0 в‚ё + 5%'), linktree: '$0вЂ“24', bitrix: t('landing.compare.r1.bitrix', 'РѕС‚ 12 000 в‚ё') },
        { label: t('landing.compare.r2', 'Р’СЂРµРјСЏ Р·Р°РїСѓСЃРєР°'), linkmax: t('landing.compare.r2.linkmax', '15 РјРёРЅСѓС‚'), linktree: t('landing.compare.r2.linktree', '5 РјРёРЅСѓС‚'), bitrix: t('landing.compare.r2.bitrix', '2вЂ“5 РґРЅРµР№') },
        { label: t('landing.compare.r3', 'Р’РёС‚СЂРёРЅР° СѓСЃР»СѓРі Рё РѕРїР»Р°С‚Р°'), linkmax: true, linktree: false, bitrix: t('landing.compare.r3.bitrix', 'С‡РµСЂРµР· РёРЅС‚РµРіСЂР°С†РёРё') },
        { label: t('landing.compare.r4', 'Inbox Р·Р°СЏРІРѕРє РёР· РјРµСЃСЃРµРЅРґР¶РµСЂРѕРІ'), linkmax: true, linktree: false, bitrix: true },
        { label: t('landing.compare.r5', 'РћРЅР»Р°Р№РЅ-Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ'), linkmax: true, linktree: false, bitrix: t('landing.compare.r5.bitrix', 'РѕС‚РґРµР»СЊРЅРѕ') },
        { label: t('landing.compare.r6', 'РњРѕР±РёР»СЊРЅС‹Р№ CRM'), linkmax: true, linktree: false, bitrix: t('landing.compare.r6.bitrix', 'РЅРµСѓРґРѕР±РЅС‹Р№') },
        { label: t('landing.compare.r7', 'РљРѕРјР°РЅРґР° РґРѕ 10 С‡РµР»РѕРІРµРє'), linkmax: true, linktree: false, bitrix: true },
        { label: t('landing.compare.r8', 'РџР»Р°С‚РёС‚Рµ С‚РѕР»СЊРєРѕ РєРѕРіРґР° Р·Р°СЂР°Р±Р°С‚С‹РІР°РµС‚Рµ'), linkmax: true, linktree: false, bitrix: false },
    ];

    return (
        <SectionWrapper id="compare" className="bg-transparent overflow-hidden">
            <SectionHeading
                title={t('landing.compare.title', 'РџРѕС‡РµРјСѓ СѓС…РѕРґСЏС‚ РѕС‚ Linktree Рё Bitrix')}
                subtitle={t('landing.compare.subtitle', 'Linktree вЂ” СЃР»РёС€РєРѕРј РјР°Р»Рѕ. Bitrix Рё amoCRM вЂ” СЃР»РёС€РєРѕРј РјРЅРѕРіРѕ Рё РґРѕСЂРѕРіРѕ. LinkMAX вЂ” СЂРѕРІРЅРѕ С‚Рѕ, С‡С‚Рѕ РЅСѓР¶РЅРѕ СЃРµСЂРІРёСЃРЅРѕРјСѓ Р±РёР·РЅРµСЃСѓ.')}
                className="mb-12"
            />

            <div className="max-w-5xl mx-auto glass border-primary/20 rounded-[2rem] p-2 sm:p-4 overflow-x-auto shadow-glass-lg">
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="text-left">
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground"></th>
                            <th className="p-4 text-center">
                                <span className="inline-flex items-center gap-2 font-black text-primary text-base">LinkMAX</span>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mt-0.5">{t('landing.compare.us', 'Р­С‚Рѕ РјС‹')}</div>
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

