

# Исправление: Business tier должен иметь доступ ко всему из PRO

## Проблема

В двух местах функция `tierLevel()` не учитывает `'business'`:

1. **`PremiumFeatureGate.tsx:36-41`** — `case 'pro': return 2; default: return 1` — business попадает в default (уровень 1), поэтому PRO-функции заблокированы для business-пользователей.

2. **`PremiumFeatureGate.tsx:126-131`** (`useFeatureAccess`) — та же проблема.

3. **`User.ts:getUserLimits`** — уже корректно: `if (status.tier === 'pro' || status.isPremium) return PRO_TIER_LIMITS`.

4. **`useFreemiumLimits.ts`** — уже корректно: `BUSINESS_LIMITS = { ...PRO_LIMITS, canUseBusinessZone: true }`.

## Решение

В `PremiumFeatureGate.tsx` — обновить `tierLevel()` в обоих местах (компонент и хук):

```typescript
const tierLevel = (tier: FreeTier): number => {
  switch (tier) {
    case 'business': return 3;
    case 'pro': return 2;
    default: return 1;
  }
};
```

## Затронутые файлы
- `src/components/billing/PremiumFeatureGate.tsx` — 2 изменения (строки 36-41 и 126-131)

