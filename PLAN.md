# План разработки CWIM VPN

## 1. Подписки (Subscriptions)

### API (бэкенд)

**Новая таблица `subscriptions`** — миграция `002_subscriptions`:

```sql
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INT NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'start',       -- start | optimal | maximum
    "device_count" INT NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "auto_renew" INT NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',    -- active | expired | cancelled | trial
    "trial" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_sub_user_id" ON "subscriptions" ("user_id");
```

**Новые эндпоинты:**

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/user/subscription` | Текущая подписка + дни до истечения | user |
| POST | `/user/subscription/cancel` | Отключить auto_renew | user |
| PUT | `/admin/users/{id}/subscription` | Продлить/сменить тариф принудительно | admin |
| GET | `/admin/subscriptions` | Список всех подписок (фильтр по статусу) | admin |

**Логика:**
- После покупки (из вебхука) → создать/продлить подписку
- Ежедневная проверка (через background task или при запросе): `end_date < now` → `status = expired`
- `GET /user/subscription` возвращает: `{ plan, device_count, start_date, end_date, days_left, status, auto_renew }`
- Из `users` удалить поля `vpn_id`, `server_id` — перенести в `subscriptions`

### CRM

- **Страница /subscriptions** — таблица всех подписок (user, plan, status, end_date, auto_renew)
  - Колонки: ID, Email пользователя, Тариф, Статус (active/expired/trial/cancelled), Осталось дней, Автопродление, Дата окончания
  - Фильтры по статусу, поиск по email
  - ПКМ: редактировать (сменить тариф, продлить дни)
  - Кнопка "Продлить" в каждой строке (модалка: +N дней)

### App

- **Dashboard** — виджет подписки показывает реальные данные:
  - `plan` + `device_count` (например, "Оптимальный · 3 устройства")
  - Прогресс-бар оставшихся дней
  - Дата окончания
  - Кнопка "Продлить" (auto_renew toggle)
- **Страница /pricing** — загружает тарифы из API (`GET /payment/plans`)
  - Кнопка "Купить" → `POST /payment/create` → редирект на шлюз

---

## 2. Платёжная система (Cryptomus)

### API

**Миграция `003_payment_settings`** (если нужно хранить настройки шлюзов в БД, но пока хватит `.env`).

**Реализовать эндпоинты `/payment/*`:**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/payment/plans` | Список тарифов из plans.json (site) или из settings |
| POST | `/payment/create` | Создание платежа: `{ plan, devices, duration_days, promo_code? }` |
| GET | `/payment/status/{tx_uuid}` | Проверить статус платежа по uuid транзакции |
| POST | `/webhooks/cryptomus` | Обработчик вебхука от Cryptomus |

**Логика `POST /payment/create`:**
1. Проверить подписку пользователя (нельзя купить если уже active и не истекла)
2. Рассчитать цену: цена из plans + скидка промокода + реферальный бонус
3. Создать запись `Transaction` со статусом `pending`
4. Отправить запрос в Cryptomus API (создать инвойс)
5. Вернуть ссылку на оплату + uuid транзакции

**Логика вебхука `POST /webhooks/cryptomus`:**
1. Проверить подпись (hmac)
2. Найти `Transaction` по `external_id`
3. Если статус `paid`:
   - Создать/продлить подписку пользователю
   - Обновить `Transaction.status = completed`, `paid_at = now`
4. Если `failed`/`expired` → обновить статус транзакции

**Пакет для Cryptomus:** положить в `api/app/core/payment/cryptomus.py`:
- `create_invoice(amount, currency, order_id, user_email) → invoice_url, invoice_id`
- `verify_webhook(data, headers) → bool`

### App

- **Страница /pricing** — выбрать тариф → модалка/страница с выбором срока (1 мес / 6 мес / год) и устройств
- **Оплата** — POST `/payment/create` → редирект на Cryptomus invoice
- **После оплаты** — показывать статус через `GET /payment/status` (polling каждые 3 сек)

### CRM

- **Страница /orders** — уже есть, нужно:
  - Исправить статусы (сейчас берутся из `Transaction.status`)
  - Добавить сумму в рублях
  - ПКМ: "Отменить" (для pending)

---

## 3. 3X-UI интеграция

### API

**Модуль `api/app/core/services/xui.py`:**

```python
class XUIClient:
    # Подключение к панели по API
    # login → получаем session token
    # CRUD инбаундов / клиентов
    
    async def login(self, host, port, username, password) -> bool
    async def add_client(self, inbound_id, email, uuid, flow="xtls-rprx-vision") -> dict
    async def remove_client(self, inbound_id, client_id) -> bool
    async def get_inbounds(self) -> list
    async def get_client_traffic(self, email) -> dict
    async def get_server_stats(self) -> dict
```

**Модель данных сервера в `servers` таблице:**

| Поле | Описание |
|------|----------|
| `host` | IP панели |
| `port` | Порт панели (Web) |
| `sub_port` | Subscription port (подписки) |
| `inbound_id` | ID инбаунда на панели |
| `protocol` | vless / trojan / shadowsocks |
| `api_key` | API ключ для доступа (или логин/пароль в .env) |

**Новые эндпоинты:**

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/admin/servers` | Добавить сервер (тестовое подключение к панели) | admin (root) |
| PUT | `/admin/servers/{id}` | Редактировать сервер | admin |
| DELETE | `/admin/servers/{id}` | Удалить сервер | admin (root) |
| POST | `/admin/servers/{id}/ping` | Проверить доступность панели | admin |
| GET | `/admin/servers/{id}/clients` | Список клиентов на панели | admin |
| GET | `/user/servers` | Список серверов с нагрузкой (для app) | user |

**Логика при создании пользователя (покупка подписки):**
1. Выбрать сервер с наименьшей загрузкой (current_clients < max_clients)
2. Создать клиента на 3X-UI панели
3. Сохранить `vpn_id` и `server_id` в подписку
4. Сгенерировать конфиг (ссылка на подписку)

### CRM

- **Страница /servers** (новая, вместо удалённой /admins):
  - Таблица: сервер, хост, порт, location, статус (online/offline), загрузка, кол-во клиентов
  - Кнопка "Добавить сервер" (модалка: host, port, location, inbound_id, protocol)
  - ПКМ: редактировать, пинг (выполнить `POST /admin/servers/{id}/ping`), удалить (только root)
  - Цветовой индикатор загрузки (зелёный < 60%, жёлтый < 85%, красный > 85%)
  - Кнопка "Проверить все" — пинг всех серверов разом

### App

- **Страница /servers** — загружает список из `GET /user/servers` (реальные данные, не хардкод)
  - Флаг, название, пинг (ms), загрузка (%), онлайн/офлайн
  - Кнопка "Подключиться" — сохранить сервер в подписку (`PUT /user/subscription/server`)
  - Показывать только активные серверы (is_active + is_online)

---

## 4. Промокоды

### API

**CRUD эндпоинты:**

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/admin/promocodes` | Список промокодов | admin |
| POST | `/admin/promocodes` | Создать промокод | admin |
| PUT | `/admin/promocodes/{id}` | Редактировать | admin |
| DELETE | `/admin/promocodes/{id}` | Удалить | admin |
| POST | `/payment/validate-promo` | Проверить промокод (на фронте при покупке) | user |

**Логика `POST /payment/create`**: если `promo_code` передан — применить скидку.

### CRM

- **Страница /promocodes** (новая):
  - Таблица: код, скидка (%), макс. использований, текущих использований, истекает, статус
  - Кнопка "Создать" (модалка: код / сгенерировать, скидка в днях, макс. использований, expires_at)
  - Toggle active/inactive
  - ПКМ: редактировать, удалить

### App

- **При покупке** — поле для ввода промокода, кнопка "Применить" → `POST /payment/validate-promo`
  - Если валиден — показать скидку, обновить цену
  - Если нет — ошибка

---

## 5. Trial (пробный период)

### API

**Логика при регистрации:**
- `config.py` → `TRIAL_DAYS: int = 3`
- После `POST /auth/register` (или `/auth/login` для первого входа):
  - Проверить, был ли уже trial у пользователя (по `Subscription` с `trial = 1`)
  - Если нет → создать `Subscription` с `status = trial`, `end_date = now + 3 days`
- `TRIAL_DAYS` настраивается в `.env` + конфиг

**Защита:**
- Если подписка `trial` и `end_date < now` — блокировать доступ к VPN
- Trial даётся 1 раз на пользователя (по `email`)

### App

- **Dashboard** — показывать таймер trial (осталось N дней)
- **После логина** — если subscription = trial → показывать баннер "Пробный период, осталось N дней. Купить подписку"

### CRM

- **Страница /users** — колонка "Trial" (да/нет) или фильтр по пробным
- **Страница /subscriptions** — отображать trial подписки

---

## 6. Серверы — управление (полная схема)

Для наглядности: полный флоу управления серверами.

### CRM — админка

**Страница /servers (новая)**

```
┌──────────────────────────────────────────────────────────┐
│  [+] Добавить сервер                         [Проверить все] │
├──────┬──────────┬────────┬────────┬──────┬──────┬──────────┤
│ Name │ Host:Port │ Location │ Online │ Load │ Ping │ Actions │
├──────┼──────────┼────────┼────────┼──────┼──────┼──────────┤
│ NL-01│ x.x.x.1  │🇳🇱 Amsterdam│ ✅    │ 62%  │ 45ms│ ⋮       │
│ DE-01│ x.x.x.2  │🇩🇪 Frankfurt│ ✅    │ 78%  │ 52ms│ ⋮       │
│ US-01│ x.x.x.3  │🇺🇸 New York │ ❌    │ —    │ —   │ ⋮       │
└──────┴──────────┴────────┴────────┴──────┴──────┴──────────┘
```

**Модалка добавления:**
- Name (text)
- Host (IP или домен)
- Port (default 443)
- Sub Port (default 2096)
- Location (text)
- Country code (выбор из списка)
- Protocol (select: VLESS, Trojan, Shadowsocks)
- Inbound ID (default 1)
- Max clients (default 100)
- При сохранении: `POST /admin/servers` → тестовый запрос к панели, если не отвечает — ошибка

**ПКМ меню:**
- Редактировать
- Пинг (выполнить запрос к панели, обновить статус + is_online)
- Удалить (только root)
- Смотреть клиенты (перейти к списку клиентов на этом сервере)

### App — пользовательский интерфейс

**Страница /servers** — реальные данные с `GET /user/servers`:

```
┌────────────────────────────────────────────────┐
│ ← Серверы                                     │
│ 7 доступно · 1 на обслуживании                │
├────────────────────────────────────────────────┤
│ 🇳🇱 Netherlands  🟢                           │
│   Amsterdam · 45 ms · 124/200 клиентов       │
│   [████████████░░░░░░] 62%                    │
│                                 [Подключиться] │
├────────────────────────────────────────────────┤
│ 🇩🇪 Germany  🟢                               │
│   Frankfurt · 52 ms · 156/200 клиентов       │
│   [████████████████░░] 78%                    │
│                                 [Подключиться] │
└────────────────────────────────────────────────┘
```

- При нажатии "Подключиться" → `POST /user/subscription/server { server_id }` — сохранить выбранный сервер
- Сервер с наименьшей загрузкой рекомендуется первым в списке

---

## 7. Реферальная система

### API

**Реализовать эндпоинты:**

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/user/referral` | Код пользователя + статистика (кол-во приглашённых, бонусы) | user |
| POST | `/user/referral/claim` | Забрать накопленные бонусы | user |

**Логика:**
- При регистрации пользователя генерируется `referral_code` (если нет)
- Если при регистрации передан `ref=CODE`:
  1. Найти `referrer` по коду
  2. Создать `Referral` запись
  3. Создать `ReferrerReward` (например, +7 дней подписки)
- При успешной оплате реферала — начислить бонус рефереру

### App

- **Страница /referrals** — реальные данные:
  - Ваша ссылка: `https://app.cwim.ru/register?ref=CODE` (кнопка копировать)
  - Статистика: приглашено N, заработано N дней подписки
  - Кнопка "Забрать бонус" (если есть накопленные)

### CRM

- **Страница /referrals** (или встроить в /users):
  - Просмотр реферальной цепочки
  - Статистика по каждому пользователю (сколько привёл, сколько заработал)

---

## 8. i18n (мультиязычность)

### App

- Установить `react-i18next` + `i18next-browser-languagedetector`
- Файлы переводов: `src/locales/ru.json`, `src/locales/en.json`
- Страница `/settings/language` — выбор языка (ru/en)
- Сохранять в localStorage + navigator.language для автоопределения
- Перевести все UI строки (пока только базово, потом доработать)

---

## 9. Очередность реализации

| № | Задача | Зависит от | API | CRM | App |
|---|--------|-----------|-----|-----|-----|
| 1 | **Подписки** (таблица + эндпоинты) | — | ⚡ | 📊 | 📱 |
| 2 | **Платежи Cryptomus** | 1 | ⚡ | 📊 | 📱 |
| 3 | **Trial** (пробный период) | 1 | ⚡ | — | 📱 |
| 4 | **3X-UI клиент** | — | ⚡ | — | — |
| 5 | **Серверы CRUD** (CRM + App) | 4 | ⚡ | 📊 | 📱 |
| 6 | **Промокоды** | — | ⚡ | 📊 | 📱 |
| 7 | **Рефералы** | 1 | ⚡ | 📊 | 📱 |
| 8 | **i18n** | — | — | — | 📱 |

**Где:**
- ⚡ — изменения в `api/`
- 📊 — изменения в `crm/`
- 📱 — изменения в `app/`

---

## 10. Технические заметки

- Все новые таблицы — через миграции в `database.py` (список `MIGRATIONS`)
- Tortoise ORM модели — синхронизировать с raw SQL схемой
- После миграции — перезапуск: `docker compose build --no-cache api && docker compose up -d`
- Для 3X-UI: `pip install httpx` (асинхронный HTTP-клиент)
- Для Cryptomus: проверка подписи через HMAC-SHA256
- Для фоновых задач (проверка истекших подписок) — `asyncio.create_task` в lifespan или легковесный планировщик через Redis
