

# Исправление админ-панели: графики, 404-ошибки и дубли вкладок

## Обнаруженные проблемы

### 1. CartesianChart width/height = -1 (критично)
**Причина:** `AdminAnalyticsDashboard.tsx:207` использует `<Respon