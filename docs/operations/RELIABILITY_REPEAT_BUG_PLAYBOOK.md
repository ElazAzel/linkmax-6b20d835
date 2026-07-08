# Reliability Repeat Bug Playbook

> **Статус:** Active
> **Связано с кайдзен:** KZN-017
> **Когда использовать:** bug, Sentry issue, regression или support case повторился второй раз

---

## 1. Цель

Повторяющийся дефект нельзя закрывать только hotfix. Каждый повтор должен оставить после себя предотвращающий механизм: тест, checklist, мониторинг, архитектурное правило или явный fallback.

---

## 2. Классификация дефекта

| Категория | Примеры | Обязательный выход |
| :--- | :--- | :--- |
| Onboarding/activation | wizard drop-off, page not generated, publish failed. | Funnel event check, regression test or onboarding checklist update. |
| Editor/blocks | editor != renderer, block crashes, invalid content. | Block checklist update plus renderer/editor test where possible. |
| CRM/booking | lead missing, booking status wrong, no fast action. | Status contract note, hook/service test or RLS check. |
| Payments/invoices | invoice mismatch, payment status drift, wallet inconsistency. | Terminal state verification and rollback/fallback note. |
| SEO/public page | metadata lost, SSR broken, JSON-LD invalid, slow public route. | SEO checklist update and performance verification. |
| Security/privacy | cross-tenant data risk, unsafe public flow, leaked metadata. | RLS/public flow checklist update and verification scenario. |
| Release/process | regression escaped, missing review, unstable dependency. | Release gate or CI/checklist update. |

---

## 3. Root cause template

```text
Issue:
First seen:
Repeated on:
Affected flow:
User impact:
Root cause:
Why existing checks missed it:
Preventing mechanism:
Owner:
Verification date:
```

---

## 4. Done criteria

- [ ] Defect связан с продуктовым потоком.
- [ ] Есть root cause, а не только симптом.
- [ ] Есть предотвращающий механизм.
- [ ] Если механизм - checklist, указано где он обновлен.
- [ ] Если механизм - тест, указано какой сценарий он покрывает.
- [ ] Если механизм - мониторинг, указано событие или alert condition.
- [ ] Если дефект security/data, применен `RLS_PUBLIC_FLOW_CHECKLIST.md`.
- [ ] Если дефект block/editor, применен `BLOCK_FEATURE_CHECKLIST.md`.

---

## 5. Weekly review вопрос

На weekly kaizen review для каждого повторного дефекта отвечать одним предложением:

```text
Что теперь не даст этой ошибке повториться?
```

Если ответа нет, дефект не считается закрытым.
