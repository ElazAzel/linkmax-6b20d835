# Block Feature Checklist

> **Статус:** Active  
> **Связано с кайдзен:** KZN-007  
> **Когда использовать:** любое добавление или изменение блока редактора, renderer, block settings, gating или analytics

---

## 1. Цель

Чек-лист фиксирует минимальный стандарт качества для block work в LinkMAX. Блок считается готовым только тогда, когда он стабильно работает в editor, public renderer, mobile layout, analytics и тарифной логике.

Главный принцип: блок не должен добавлять скорость разработки ценой расхождения между editor и публичной страницей.

---

## 2. Обязательная проверка

| Зона | Проверка | Done |
| :--- | :--- | :--- |
| Types | Тип блока и content shape описаны строго, без `any`. | Новые или измененные поля типизированы и совместимы со старым content. |
| Registry | Блок зарегистрирован во всех нужных registry/metadata слоях. | Блок доступен там, где ожидается, и скрыт там, где не должен появляться. |
| Renderer | Public renderer отображает блок без editor-only зависимостей. | Публичная страница не ломается на пустых, старых и частично заполненных данных. |
| Editor UI | Настройки блока понятны на mobile и не требуют лишних шагов. | Частые действия помещаются в 3-click rule. |
| Translations | Добавлены или проверены ключи i18n. | Нет hardcoded пользовательского текста, если рядом используется i18n. |
| Analytics | Если блок влияет на funnel, добавлен или проверен event. | Event связан с KPI или продуктовым решением, а не с шумом. |
| Gating | Premium/free поведение проверено. | Free user видит понятное состояние, Pro behavior не ломается. |
| Mobile QA | Проверены touch targets, высоты, переносы текста, preview. | Нет горизонтального overflow, клики доступны большим пальцем. |
| Backward compatibility | Старые страницы и сохраненный content открываются корректно. | Нужна миграция только если без нее нельзя сохранить поведение. |
| Performance | Core interaction не зависит от AI/token/нестабильного внешнего сервиса. | Добавление, редактирование и preview не создают заметного лага. |

---

## 3. Acceptance criteria для PR/задачи

- [ ] Описано, какой пользовательский исход поддерживает блок: publish, lead, booking, payment, revenue, safety или speed.
- [ ] Editor и public renderer проверены на одном и том же content.
- [ ] Empty/default state выглядит премиально и ведет к действию.
- [ ] Mobile layout проверен на узком viewport.
- [ ] Нет прямого Supabase-запроса из UI без сильной причины.
- [ ] Если блок пишет публичные данные, применен `RLS_PUBLIC_FLOW_CHECKLIST.md`.
- [ ] Если блок влияет на SEO/public page, проверены metadata/structured data side effects.
- [ ] Если проблема может повториться, добавлен тест, checklist item или monitoring note.

---

## 4. Быстрая карточка проверки

```text
Block:
Owner:
User outcome:
Touched layers:
Editor checked:
Renderer checked:
Mobile checked:
Translations checked:
Analytics checked:
Gating checked:
Security/RLS impact:
Known rollback:
```
