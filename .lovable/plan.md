

# План: Улучшение Onboarding и Activation

## Текущее состояние

| Компонент | Статус | Проблема |
|-----------|--------|----------|
| **QuickStartFlow** | Дублирует AIBuilderWizard | Две разные точки входа для одного и того же |
| **NicheOnboarding** | Дублирует AIBuilderWizard | Третий вариант того же flow |
| **AIBuilderWizard** | ✅ Самый полный (5 шагов + шаблоны) | Единственный, кто работает с DB-шаблонами |
| **OnboardingTour** | Hardcoded Russian | Не локализован, не использует `t()` |
| **HomeScreen** | Статичный tip | Всегда один и тот же совет, нет прогресса |
| **Activation Checklist** | ❌ Не существует | Пользователь не знает, что делать дальше |

## Ключевые проблемы

1. **Нет Activation Checklist** — после onboarding пользователь попадает на HomeScreen без guidance
2. **3 дублирующих onboarding flow** — QuickStartFlow, NicheOnboarding, AIBuilderWizard
3. **OnboardingTour не локализован** — hardcoded строки на русском
4. **Статичный совет** — HomeScreen всегда показывает "добавьте блок с ценами"

## План реализации

### Task 1: Создать ActivationChecklist компонент

**Создать:** `src/components/onboarding/ActivationChecklist.tsx`

Виджет с чеклистом первых шагов на HomeScreen:
- ✅ Зарегистрироваться (всегда выполнено)
- ☐ Добавить аватар
- ☐ Добавить первый блок (кроме profile)
- ☐ Опубликовать страницу
- ☐ Поделиться ссылкой

Прогресс-бар сверху, анимация при выполнении шага. Сворачивается после 100%.

**Создать:** `src/hooks/onboarding/useActivationChecklist.ts`

Хук вычисляет статус каждого шага из текущих данных:
```typescript
interface ActivationStep {
  id: string;
  completed: boolean;
  action: () => void;
}
```

### Task 2: Локализовать OnboardingTour

Заменить hardcoded строки в `OnboardingTour.tsx` на `t()` вызовы. Добавить ключи `onboardingTour.*` в ru/en/kk.

### Task 3: Динамические tips на HomeScreen

Заменить статичный "Совет" на контекстный:
- Нет аватара → "Добавьте фото профиля"
- 1 блок → "Добавьте блок со ссылками"
- Не опубликовано → "Опубликуйте страницу"
- Мало просмотров → "Поделитесь ссылкой в соцсетях"
- Всё ок → рандомные growth tips

### Task 4: Консолидировать onboarding entry point

В `DashboardV2.tsx` и `useDashboardOnboarding`:
- Убрать `showQuickStart` / `QuickStartFlow` — использовать только `AIBuilderWizard`
- `NicheOnboarding` пометить как deprecated (оставить для обратной совместимости)

### Task 5: Добавить ActivationChecklist в HomeScreen

Интегрировать чеклист между page card и quick actions. Показывать только пока не все шаги выполнены.

---

## Файлы

| Файл | Действие |
|------|----------|
| `src/components/onboarding/ActivationChecklist.tsx` | **Создать** |
| `src/hooks/onboarding/useActivationChecklist.ts` | **Создать** |
| `src/components/onboarding/OnboardingTour.tsx` | Локализовать |
| `src/components/dashboard-v2/screens/HomeScreen.tsx` | Добавить чеклист + динамические tips |
| `src/pages/DashboardV2.tsx` | Консолидировать onboarding entry |
| `src/i18n/locales/ru.json` | Добавить ключи activation/tour |
| `src/i18n/locales/en.json` | Добавить ключи activation/tour |
| `src/i18n/locales/kk.json` | Добавить ключи activation/tour |

## Результат

- Пользователь видит прогресс активации после onboarding
- Контекстные советы вместо статики
- Один onboarding flow вместо трёх
- Полная локализация tour

