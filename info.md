# XUI-TGShop — Полная документация проекта

## Обзор

Система управления VPN-серверами на базе **3X-UI панели**. Архитектура: **React сайт + React приложение (Telegram Mini App) + CRM админ-панель**, всё через единый API-бэкенд на Python (FastAPI).

---

## Архитектура

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Website   │    │  React App  │    │     CRM     │
│  (React)    │    │  (Mini App) │    │   (React)   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Traefik │ ← Автоматический SSL
                    │  (proxy)  │
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼─────┐ ┌──▼────┐ ┌────▼────┐
        │    API    │ │  CRM  │ │   Web   │
        │  (FastAPI)│ │(port) │ │ (port)  │
        └─────┬─────┘ └───────┘ └─────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐
│ Redis │ │SQLite│ │3X-UI   │
│       │ │  DB  │ │Panels  │
└───────┘ └──────┘ └────────┘
```

### Контейнеры (Docker Compose)

| Сервис | Порт | Назначение |
|--------|------|------------|
| `traefik` | 80, 443 | Reverse proxy + автоматический SSL |
| `redis` | 6379 | FSM-хранилище, кэш, auth-коды |
| `app` | 8081 | API + статика React сайта/приложения |
| `crm` | 8082 | CRM админ-панель |
| `bot` | 8080 | Telegram бот (можно удалить) |

---

## Автоматический выпуск SSL

### Как работает

SSL выдаётся **Traefik** через **Let's Encrypt** используя **ACME HTTP-01 challenge**.

### Процесс

1. Traefik слушает порт **80** (HTTP) и **443** (HTTPS)
2. При первом запросе к домену Traefik автоматически:
   - Получает сертификат от Let's Encrypt через ACME HTTP-01 challenge
   - Сохраняет сертификат в Docker-том `letsencrypt_data` (файл `/letsencrypt/acme.json`)
   - Редиректит HTTP → HTTPS
3. Сертификат обновляется автоматически за 30 дней до истечения

### Конфигурация

Переменные окружения в `.env`:

```bash
# Email для Let's Encrypt (обязательно)
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Домены
BOT_DOMAIN=bot.yourdomain.com
APP_DOMAIN=app.yourdomain.com
CRM_DOMAIN=crm.yourdomain.com
```

### Docker Compose labels для Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.app.rule=Host(`app.yourdomain.com`)"
  - "traefik.http.routers.app.entrypoints=websecure"
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
  - "traefik.http.services.app.loadbalancer.server.port=8081"
```

### Важные замечания

- Для работы HTTP-01 challenge порт **80** должен быть доступен извне
- Traefik автоматически создаёт entrypoint `web` (порт 80) и `websecure` (порт 443)
- Сертификаты хранятся в Docker-томе — пересоздание контейнера не удаляет их
- Wildcard-сертификаты требуют DNS-01 challenge (требует дополнительной настройки)

---

## Работа с Traefik

### Назначение

Traefik используется как:
1. **Reverse proxy** — маршрутизация трафика между сервисами
2. **SSL-терминатор** — автоматический выпуск и обновление сертификатов
3. **Load balancer** — балансировка (при масштабировании)

### Маршрутизация

```
bot.yourdomain.com    → traefik → bot:8080    (Telegram бот + вебхуки)
app.yourdomain.com    → traefik → app:8081    (API + React SPA)
crm.yourdomain.com    → traefik → crm:8082    (CRM админ-панель)
```

### Базовая конфигурация (docker-compose.yml)

```yaml
services:
  traefik:
    image: traefik:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt_data:/letsencrypt/acme.json
    environment:
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}

  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`${APP_DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=8081"

  crm:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.crm.rule=Host(`${CRM_DOMAIN}`)"
      - "traefik.http.routers.crm.entrypoints=websecure"
      - "traefik.http.routers.crm.tls.certresolver=letsencrypt"
      - "traefik.http.services.crm.loadbalancer.server.port=8082"
```

### Принцип работы

1. Traefik читает labels контейнеров через Docker socket
2. Для каждого контейнента с `traefik.enable=true` создаёт маршруты
3. `Host()` rule определяет какой домен идёт на какой сервис
4. `certresolver=letsencrypt` привязывает автоматический SSL
5. Traefik автоматически обнаруживает новые/удалённые контейнеры

### Добавление нового сервиса

1. Добавить сервис в `docker-compose.yml`
2. Добавить Traefik labels:
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.newservice.rule=Host(`new.yourdomain.com`)"
     - "traefik.http.routers.newservice.entrypoints=websecure"
     - "traefik.http.routers.newservice.tls.certresolver=letsencrypt"
     - "traefik.http.services.newservice.loadbalancer.server.port=XXXX"
   ```
3. Добавить домен в DNS (A-запись на IP сервера)
4. `docker compose up -d`

---

## Работа с оплатами

### Архитектура платёжной системы

Используется **паттерн Strategy** через `GatewayFactory`:

```
PaymentGateway (абстракция)
    ├── TelegramStars    (XTR — Telegram Stars)
    ├── Cryptomus        (USD — криптовалюта)
    ├── Heleket          (USD — криптовалюта)
    ├── YooKassa         (RUB — банковские карты)
    └── YooMoney         (RUB — электронный кошелёк)
```

### Шлюзы оплаты

| Шлюз | Валюта | Тип | Webhook путь | Проверка |
|------|--------|-----|--------------|----------|
| **Telegram Stars** | XTR | Inline invoice | Нет (inline) | Pre-checkout query |
| **Cryptomus** | USD | Крипто | `/cryptomus` | HMAC MD5 + IP whitelist |
| **Heleket** | USD | Крипто | `/heleket` | HMAC MD5 + IP whitelist |
| **YooKassa** | RUB | Карты | `/yookassa` | SDK IP verification |
| **YooMoney** | RUB | Кошелёк | `/yoomoney` | SHA1 notification hash |

### Общий Flow оплаты

```
1. Пользователь выбирает количество устройств → срок → способ оплаты
2. gateway.create_payment(data) → создаёт платёжную ссылку/инвойс
3. Пользователь оплачивает (редирект или inline)
4. Webhook callback → FastAPI endpoint
5. Шлюз верифицирует callback
6. handle_payment_succeeded(payment_id):
   ├── Транзакция → COMPLETED
   ├── Начисление реферального бонуса (если есть)
   ├── Уведомление пользователю
   ├── Создание/обновление/продление VPN-клиента через py3xui
   └── Редирект на главную
```

### Реализация шлюзов

#### Telegram Stars (app/core/payment/telegram_stars.py)

```python
# Создание инвойса через Telegram Bot API
invoice_link = await bot.create_invoice_link(
    title="VPN Subscription",
    description=f"Subscription for {days} days",
    prices=[LabeledPrice(label="VPN", amount=stars_price)],
    currency="XTR"
)
```

#### Cryptomus (app/core/payment/cryptomus.py)

```python
# API calls:
POST https://api.cryptomus.com/v1/payment
  - uuid, amount, currency, callback_url, order_id

# Webhook verification:
- HMAC MD5 signature из заголовков
- IP whitelist: 91.227.144.54
```

#### Heleket (app/core/payment/heleket.py)

```python
# API calls:
POST https://api.heleket.com/v1/payment
  - uuid, amount, currency, callback_url, order_id

# Webhook verification:
- HMAC MD5 signature из заголовков
- IP whitelist: 31.133.220.8
```

#### YooKassa (app/core/payment/yookassa.py)

```python
# Python SDK:
from yookassa import Payment, Configuration
Configuration.account_id = shop_id
Configuration.secret_key = secret_key

payment = Payment.create({
    "amount": {"value": amount, "currency": "RUB"},
    "confirmation": {"type": "redirect", "return_url": ...},
    "capture": True
})
```

#### YooMoney (app/core/payment/yoomoney.py)

```python
# QuickPay URL redirect:
https://yoomoney.ru/quickpay/perform?...
  - receiver, sum, label, successURL, ...

# Webhook verification:
- SHA1 notification hash проверка
```

### Переменные окружения для оплат

```bash
# Telegram Stars
BOT_TOKEN=...

# Cryptomus
CRYPTOMUS_API_KEY=...
CRYPTOMUS_MERCHANT_UUID=...
CRYPTOMUS_WEBHOOK_SECRET=...

# Heleket
HELEKET_API_KEY=...
HELEKET_MERCHANT_UUID=...
HELEKET_WEBHOOK_SECRET=...

# YooKassa
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...

# Yoomoney
YOOMONEY_SHOP_ID=...
YOOMONEY_SECRET_KEY=...
```

### Реестр шлюзов (app/core/payment/gateway_factory.py)

```python
class GatewayFactory:
    def __init__(self):
        self._gateways: dict[str, PaymentGateway] = {}

    def register(self, name: str, gateway: PaymentGateway):
        self._gateways[name] = gateway

    def get(self, name: str) -> PaymentGateway:
        return self._gateways[name]

# Регистрация при старте:
if TELEGRAM_STARS_ENABLED:
    factory.register("telegram_stars", TelegramStarsGateway(...))
if CRYPTOMUS_ENABLED:
    factory.register("cryptomus", CryptomusGateway(...))
# и т.д.
```

---

## Работа с 3X-UI API

### Библиотека

Используется **py3xui** (`AsyncApi`) — асинхронный Python-клиент для API 3X-UI панели.

### Подключение к панели

```python
from py3xui import AsyncApi, Client

# Создание подключения
api = AsyncApi(
    host="https://panel.example.com",
    username="admin",
    password="password"
)

# Авторизация
await api.login()
```

### Основные операции (VPNService — app/core/services/vpn.py)

#### Создание клиента

```python
await api.client.add(
    settings={
        "id": vpn_id,              # UUID клиента
        "email": str(tg_id),       # Email = Telegram ID
        "expiry": expiry_timestamp, # Время окончания (unix)
        "limit_ip": device_limit,  # Лимит устройств
    }
)
```

#### Обновление клиента

```python
await api.client.update(
    id=vpn_id,
    settings={
        "expiry": new_expiry,
        "limit_ip": new_device_limit,
    }
)
```

#### Получение данных клиента

```python
client_data = await api.client.get(client_id=vpn_id)
# traffic_up, traffic_down, expiry, limit_ip
```

#### Получение инбаундов (inbounds)

```python
inbounds = await api.inbound.get()
# Первый инбаунд используется для добавления клиентов
```

### Управление серверами (ServerPoolService — app/core/services/server_pool.py)

#### Архитектура пула серверов

```
ServerPoolService
    └── connections: dict[server_id, Connection]
        └── Connection
            ├── server: Server (DB model)
            └── api: AsyncApi (py3xui)
```

#### Инициализация при старте

```python
# 1. Загрузка серверов из БД
servers = await db.get_all(Server)

# 2. Подключение к каждому серверу
for server in servers:
    api = AsyncApi(
        host=f"https://{server.host}",
        username=XUI_USERNAME,
        password=XUI_PASSWORD,
        token=XUI_TOKEN  # опционально
    )
    await api.login()
    pool.connections[server.id] = Connection(server=server, api=api)
```

#### Назначение сервера пользователю (load balancing)

```python
async def assign_server_to_user(self) -> Server:
    """Выбирает сервер с наибольшим количеством свободных слотов"""
    best_server = None
    max_free = -1

    for server_id, conn in self.connections.items():
        free_slots = server.max_clients - current_clients
        if free_slots > max_free:
            max_free = free_slots
            best_server = server

    return best_server
```

### VPN-операции

| Операция | Метод | Описание |
|----------|-------|----------|
| Создание подписки | `create_subscription()` | Создаёт клиента, если не существует |
| Продление | `extend_subscription()` | Добавляет дни, заменяет лимит устройств |
| Изменение | `change_subscription()` | Заменяет дни и лимит устройств |
| Бонусные дни | `process_bonus_days()` | Пробный период, рефералы, промокоды |
| Активация промокода | `activate_promocode()` | Активирует промокод, добавляет дни |
| Данные клиента | `get_client_data()` | Трафик, дата окончания, лимит |
| Получение ключа | `get_key()` | Генерирует URL подписки |
| Лимит устройств | `get_limit_ip()` | Получает лимит из настроек инбаунда |

### Генерация VPN-ключа

```python
def get_key(self, server: Server, vpn_id: str) -> str:
    return f"{server.host}:{server.sub_port}/user/{vpn_id}"
```

### Требования к 3X-UI панели

1. SSL-сертификат настроен на панели
2. Первый inbound используется для добавления клиентов
3. Subscription service включён на порту `2096`, путь `/user/`
4. Сертификат указан для subscription service
5. Шифрование конфигурации рекомендуется **отключить**

### Переменные окружения для 3X-UI

```bash
# Учётные данные для подключения к панелям
XUI_USERNAME=admin
XUI_PASSWORD=password
XUI_TOKEN=optional_token
```

---

## API Endpoints

### API контейнер (port 8081)

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| `POST` | `/api/auth` | Авторизация Telegram Mini App (HMAC) | Нет |
| `POST` | `/api/auth/code` | Авторизация по 6-значному коду | Нет |
| `GET` | `/api/plans` | Получение тарифных планов | Нет |
| `GET` | `/api/servers` | Серверы пользователя | JWT |
| `GET` | `/api/profile` | Профиль пользователя | JWT |
| `GET` | `/{path}` | Статика React SPA | Нет |

### Webhook endpoints (port 8080 — bot, можно перенести)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/cryptomus` | Webhook Cryptomus |
| `POST` | `/heleket` | Webhook Heleket |
| `POST` | `/yookassa` | Webhook YooKassa |
| `POST` | `/yoomoney` | Webhook YooMoney |
| `GET` | `/connection` | Редирект VPN-подключения |

### CRM контейнер (port 8082)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health` | Health check |
| `GET` | `/*` | Статика CRM |

---

## База данных

### Модели

| Таблица | Ключевые поля | Назначение |
|---------|--------------|------------|
| `users` | tg_id, vpn_id, server_id, first_name, language_code | Пользователи |
| `servers` | name, host, max_clients, location, online | VPN-серверы |
| `transactions` | tg_id, payment_id, subscription, status | История платежей |
| `promocodes` | code, duration, is_activated, activated_by | Промокоды |
| `referrals` | referrer_tg_id, referred_tg_id | Реферальные связи |
| `referrer_rewards` | user_tg_id, reward_type, amount, payment_id | Реферальные награды |
| `invites` | name, hash_code, clicks, is_active | Инвайт-ссылки |

### Стек

- **SQLAlchemy 2.0** (async) — ORM
- **aiosqlite** — драйвер SQLite (по умолчанию)
- **Alembic** — миграции

---

## Планы тарифов (plans.json)

```json
[
  {
    "devices": 1,
    "prices": {
      "USD": { "30": 2.5, "60": 4.0, "180": 8.0, "365": 12.0 },
      "RUB": { "30": 250, "60": 400, "180": 800, "365": 1200 }
    }
  },
  {
    "devices": 3,
    "prices": {
      "USD": { "30": 5.0, "60": 8.0, "180": 16.0, "365": 24.0 },
      "RUB": { "30": 500, "60": 800, "180": 1600, "365": 2400 }
    }
  }
]
```

---

## Переменные окружения (.env)

```bash
# === Основные ===
BOT_TOKEN=your_bot_token
BOT_DEV_ID=123456789
BOT_ADMINS=987654321

# === Домены ===
BOT_DOMAIN=bot.yourdomain.com
APP_DOMAIN=app.yourdomain.com
CRM_DOMAIN=crm.yourdomain.com

# === SSL ===
LETSENCRYPT_EMAIL=admin@yourdomain.com

# === База данных ===
DATABASE_URL=sqlite+aiosqlite:///data/database.db

# === Redis ===
REDIS_URL=redis://redis:6379/0

# === 3X-UI панели ===
XUI_USERNAME=admin
XUI_PASSWORD=password

# === Telegram Stars ===
TELEGRAM_STARS_ENABLED=true

# === Cryptomus ===
CRYPTOMUS_ENABLED=true
CRYPTOMUS_API_KEY=...
CRYPTOMUS_MERCHANT_UUID=...
CRYPTOMUS_WEBHOOK_SECRET=...

# === Heleket ===
HELEKET_ENABLED=true
HELEKET_API_KEY=...
HELEKET_MERCHANT_UUID=...
HELEKET_WEBHOOK_SECRET=...

# === YooKassa ===
YOOKASSA_ENABLED=true
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...

# === YooMoney ===
YOOMONEY_ENABLED=true
YOOMONEY_SHOP_ID=...
YOOMONEY_SECRET_KEY=...
```

---

## Деплой

### Установка

```bash
# Клонирование
git clone https://github.com/snoups/XUI-TGShop.git
cd XUI-TGShop

# Настройка окружения
cp .env.example .env
nano .env  # заполнить все переменные

# Настройка серверов
cp plans.example.json plans.json
nano plans.json  # добавить серверы в БД через админку

# Запуск
docker compose up -d
```

### Обновление

```bash
docker compose down
git pull
docker compose build --no-cache
docker compose up -d
```

### Структура сервера

```
/opt/xui-tgshop/
├── docker-compose.yml
├── .env
├── plans.json
├── app/
│   └── data/
│       └── database.db    # SQLite (том)
└── traefik/
    └── letsencrypt_data/  # SSL сертификаты (том)
```

---

## Полезные ссылки

- **3X-UI**: https://github.com/MHSanaei/3x-ui
- **py3xui**: https://github.com/kutovooy/py3xui
- **Traefik**: https://doc.traefik.io/traefik/
- **Let's Encrypt**: https://letsencrypt.org/
- **Cryptomus API**: https://doc.cryptomus.com/
- **YooKassa API**: https://yookassa.ru/developers
