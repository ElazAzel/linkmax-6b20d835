# `.agent` — правила и команды для AI-агентов

Каталог для Antigravity и согласованной работы ассистентов с репозиторием **LinkMAX** (`inkmax`).

## С чего начать

1. **[rules/ANTIGRAVITY_CONFIG.md](rules/ANTIGRAVITY_CONFIG.md)** — краткий контекст проекта, язык ответов (русский), ссылки на команды и навыки.
2. **[rules/123role.md](rules/123role.md)** — роль Principal Engineer: безопасность, верификация, актуализация документации.
3. **[rules/rules/](rules/rules/)** — стандарты кода (`general.md`, `frontend.md`, `backend.md`, IDE-специфика: `cursor.md`, `windsurf.md`).
4. **[rules/commands/](rules/commands/)** — конкретные шаги: `dev`, `build`, `test`, `database`, `deploy` и др.
5. **[rules/agents/](rules/agents/)** — специализированные роли (планировщик, ревьюер, QA, security и т.д.).
6. **[rules/skills/](rules/skills/)** — навыки React и Supabase.

Человекочитаемая выжимка для команды также в [docs/operations/ai-agent-rules.md](../docs/operations/ai-agent-rules.md) — при расхождении приоритет у файлов в **`rules/`** этого каталога.

---

## Внешняя библиотека: [Ai-Agent-Skills](https://github.com/MoizIbnYousaf/Ai-Agent-Skills)

Курируемая коллекция Agent Skills с CLI (`npm` пакет `ai-agent-skills`, лицензия **MIT**). Протокол для автоматической настройки библиотеки: [FOR_YOUR_AGENT.md (raw)](https://raw.githubusercontent.com/MoizIbnYousaf/Ai-Agent-Skills/main/FOR_YOUR_AGENT.md).

### Важно для этого репозитория

- Флаг **`-p` / `--project`** в CLI по умолчанию ставит скиллы в **`.agents/skills/`**. Каталог **`.agents/`** в LinkMAX намеренно не используется (конфиг в **`.agent/rules/`**). **Не используйте `-p`**, если не хотите снова создать `.agents/`.
- Для **скиллов в репозитории под Cursor** используйте **`--agent cursor`**: установка идёт в **`.cursor/skills/`** (проверено `install … --agent cursor --dry-run` на CLI **4.2.0**).

### Примеры

```bash
# обзор библиотеки (в проекте: npm run skills:browse)
npx ai-agent-skills

# список скиллов
npx ai-agent-skills list

# план установки в .cursor/skills (без записи на диск)
npx ai-agent-skills install playwright --agent cursor --dry-run --yes

# установка одного скилла для Cursor в проект
npx ai-agent-skills install playwright --agent cursor --yes
```

Глобально (вне репозитория): без `-p` и без `--agent` — в `~/.claude/skills/` (см. справку `npx ai-agent-skills --help`). Диагностика: `npx ai-agent-skills doctor`.
