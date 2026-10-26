# Переезд LinkMAX на свой сервер

Файлы: `deploy/self-hosted/` (docker-compose, Caddyfile, .env.example, export/import скрипты).

## 0. Что нужно
- VPS: Ubuntu 24.04, 4+ vCPU, 8+ GB RAM, 80+ GB NVMe.
- Домен и доступ к DNS.
- Выгруженный код (GitHub).
- Доступ к старой базе (строка подключения) — для Lovable Cloud её нужно запросить: пароль базы в интерфейсе недоступен. Альтернатива: CSV-экспорт таблиц из раздела Cloud → Database.
- Ключи: Robokassa, Telegram бот, Resend.

## 1. Сервер
```bash
curl -fsSL https://get.docker.com | sh
apt install -y postgresql-client git
ufw allow 22,80,443/tcp && ufw enable
git clone <repo> /opt/linkmax && cd /opt/linkmax
docker network create linkmax
```

## 2. Бэкенд (официальный Supabase stack)
```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase-src
cp -r /opt/supabase-src/docker /opt/supabase && cd /opt/supabase
cp .env.example .env
```
В `.env` задать: `POSTGRES_PASSWORD`, `JWT_SECRET` (40+ символов), сгенерировать `ANON_KEY`/`SERVICE_ROLE_KEY` из этого секрета, `SITE_URL=https://lnkmx.my`, `API_EXTERNAL_URL=https://api.lnkmx.my`, SMTP (Resend).
В `docker-compose.yml` Supabase добавить сеть `linkmax` (external) к сервису `kong`. Запуск: `docker compose up -d`.

Функции: `cp -r /opt/linkmax/supabase/functions/* /opt/supabase/volumes/functions/`, секреты функций — в `.env` Supabase, затем `docker compose restart functions`.

## 3. Данные
```bash
cd /opt/linkmax/deploy/self-hosted
SOURCE_DB_URL=... ./export-data.sh ./dump
TARGET_DB_URL=postgres://postgres:<pass>@localhost:5432/postgres ./import-data.sh ./dump
```
Файлы: скачать содержимое бакетов (аватары, обложки, товары) и загрузить в новое Storage с теми же путями (`supabase` CLI `storage cp` или rclone по S3).

## 4. Сайт
```bash
cd /opt/linkmax/deploy/self-hosted
cp .env.example .env   # заполнить
docker compose up -d --build
```

## 5. Проверка до смены DNS
Через `/etc/hosts` открыть сайт и проверить: вход, редактор, загрузку фото, заявку в Telegram, тестовый платёж Robokassa.
В Robokassa поменять Result/Success URL на `https://api.lnkmx.my/functions/v1/...`. В Telegram — `setWebhook` на новый адрес.

## 6. Переключение
- DNS `A` для `lnkmx.my`, `www`, `api` → IP сервера (Cloudflare: DNS Only).
- Бэкап: cron `pg_dump -Fc` ежедневно на внешнее хранилище.
- Перед финальным переключением повторить экспорт/импорт, чтобы забрать свежие данные.
