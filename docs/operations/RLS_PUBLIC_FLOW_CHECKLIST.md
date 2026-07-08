# RLS и Public Flow Checklist

> **Статус:** Active
> **Связано с кайдзен:** KZN-018
> **Когда использовать:** любые изменения в leads, bookings, analytics, events, payments, invoices, public pages, workspace data или auth/roles

---

## 1. Цель

Этот чек-лист защищает главное правило LinkMAX: данные пользователя и workspace должны оставаться изолированными через Supabase RLS и явные role boundaries. Public flows могут принимать данные от посетителя, но не должны раскрывать приватные данные владельца, других страниц или других workspace.

---

## 2. Классификация изменения

Перед реализацией определить тип потока:

| Тип | Примеры | Требование |
| :--- | :--- | :--- |
| Public insert | lead form, booking submit, event registration, analytics event. | Разрешена только минимальная запись, без доступа к чужим данным. |
| Public read | public page, public service/event page, SEO/bot render. | Отдаются только опубликованные и публичные поля. |
| Private workspace read | CRM, bookings panel, analytics dashboard, contacts. | Доступ только владельцу, участнику workspace или роли с правом. |
| Private mutation | lead status, booking status, invoice, task, contact. | Проверяется owner/workspace boundary и допустимый переход статуса. |
| Payment/invoice flow | invoice create/update, wallet, payment confirmation. | Нужна transactional integrity и проверка terminal states. |
| Admin/system flow | moderation, admin dashboard, migrations, service-role logic. | Никакой service-role логики на клиенте, строгая серверная граница. |

---

## 3. Обязательная проверка

- [ ] UI не вызывает Supabase напрямую, если есть сервис/репозиторий/хук для этого потока.
- [ ] Для новой записи public insert принимается только минимальный payload.
- [ ] Public read не возвращает private поля, workspace data, owner-only analytics или service metadata.
- [ ] Private read фильтруется по `user_id`, `owner_id`, `workspace_id`, `organization_id` или эквивалентному RLS-safe ключу.
- [ ] Private mutation проверяет владельца и допустимый status transition.
- [ ] Payment/invoice mutation не может создать расхождение между payment, invoice, wallet и UI status.
- [ ] Analytics event не раскрывает PII без необходимости и согласия.
- [ ] Ошибки не раскрывают service-role, SQL, токены, emails других пользователей или внутренние IDs сверх нужного.
- [ ] Если добавлен новый public route, проверены SEO/bot rendering и privacy boundaries.
- [ ] Если меняется policy или migration, есть rollback note.

---

## 4. Проверка RLS-поведения

Минимальные сценарии:

| Сценарий | Ожидаемый результат |
| :--- | :--- |
| Anonymous visitor submits public lead/booking. | Запись создается только для целевой страницы/владельца, лишние поля игнорируются. |
| Anonymous visitor reads public page. | Видны только опубликованные public данные. |
| User A открывает CRM User B. | Доступ запрещен или возвращается пустой результат. |
| Workspace member without permission mutates payment/invoice. | Mutation запрещена. |
| Owner changes lead/booking status. | Mutation разрешена и audit/analytics не раскрывают лишнее. |
| Bot/crawler renders public route. | SSR/metadata работают без private data leakage. |

---

## 5. Done для data/security changes

- [ ] Классификация потока указана в задаче или PR.
- [ ] RLS boundary описана явно.
- [ ] Public/private поля перечислены или проверены через существующий контракт.
- [ ] Ошибочные и чужие tenant/workspace сценарии проверены.
- [ ] Payment/invoice terminal states проверены, если поток финансовый.
- [ ] Rollback/fallback описан для рискованного изменения.
- [ ] Если риск повторяемый, добавлена проверка, тест, SQL verification или doc rule.
