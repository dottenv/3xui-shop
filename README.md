# CWIM - VPN Subscription Shop

Система управления VPN-подписками на базе 3X-UI панели.

## Архитектура

```
cwim.ru        → Flask лендинг
app.cwim.ru    → React PWA приложение
crm.cwim.ru    → React CRM админка
api            → FastAPI бэкенд
```

## Быстрый старт

```bash
# 1. Клонирование
git clone <repo-url>
cd 3xui-shop

# 2. Настройка окружения
cp .env.example .env
# Заполните .env

# 3. Запуск
docker compose up -d
```

## Структура проекта

```
├── api/          # FastAPI бэкенд
├── site/         # Flask лендинг
├── app/          # React PWA
├── crm/          # React CRM
└── traefik/      # Reverse proxy
```

## Переменные окружения

См. `.env.example` для полного списка переменных.

## Домены

- `cwim.ru` - лендинг
- `app.cwim.ru` - PWA приложение
- `crm.cwim.ru` - CRM админка
