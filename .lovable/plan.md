

# Исправление видимых языковых ключей и непереведённых строк

## Проблема
В `ru.json` (основной язык продукта) обнаружено **~120+ строк на английском** в секции `zones`, которые пользователь видит как непереведённые. Также в `en.json` в `zones.analytics` все строки корректны, но в `ru.json` они остались на английском.

## Масштаб проблемы

### 1. `zones` в `ru.json` — английские строки вместо русских (~120 мест)
Затронутые подсекции:
- **`zones.analytics`** — почти весь блок на английском (30+ ключей)
- **`zones.contacts`** — ~20 английских строк (`"andMore"`, `"call"`, `"created"`, `"emptyFile"`, `"export"`, `"exportSuccess"`, `"import"`, `"importButton"`, `"imported"`, `"importing"`, `"noNameColumn"`, `"parseError"`, `"presets.*"`, `"requiredColumns"`, `"rows"`, `"unsupportedFormat"`, `"uploadFile"`)
- **`zones.deals`** — ~15 (`"dateTo"`, `"dateFrom"`, `"export"`, `"exportSuccess"`, `"markAsWonOrLost"`, `"newDealDescription"`, `"nextStepPlaceholder"`, `"noComments"`, `"noStages"`, `"selectContact"`, `"valueMax"`, `"valueMin"`)
- **`zones.documents`** — почти весь блок на английском (~25 ключей)
- **`zones.invites`** — весь блок на английском (8 ключей)
- **`zones.settings`** — ~30 английских строк (`"billing"`, `"currentPlan"`, `"cycle"`, `"dangerZone"`, `"general"`, `"invite"`, `"fields.*"`, `"dealFields.*"`, `"pipelines.*"` частично)
- **`zones.plans`** — 2 ключа (`"monthly"`, `"yearly"`)
- **`zones.invoices`** — несколько (`"downloadPDF"`, `"pdfSuccess"`, `"urlGenerated"`)

### 2. `kk.json` и `uz.json` — fallback на русский уже настроен
Благодаря предыдущей оптимизации, `kk` и `uz` fallback'ят в `ru`, поэтому достаточно перевести `ru.json`.

## План исправлений

### Шаг 1. Перевести все английские строки в `zones` секции `ru.json`
Полный перевод ~120 ключей на русский. Это основной объём работы.

### Шаг 2. Проверить и перевести `kk.json` и `uz.json` zones секции
`kk.json` zones скорее всего имеет аналогичные непереведённые строки. Проверить и перевести основные пользовательские строки.

### Шаг 3. Проверить другие секции на английские строки в `ru.json`
Пройти по остальным секциям и убедиться, что нет скрытых английских строк.

## Оценка объёма
- ~120 строк для перевода в `ru.json`
- ~120 строк для `kk.json` (если не покрыто fallback)
- ~120 строк для `uz.json` (если не покрыто fallback)
- Основное изменение — только JSON-файлы локалей

