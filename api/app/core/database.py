from tortoise import Tortoise
from app.core.config import settings

# Tortoise ORM 0.21 generates INT PRIMARY KEY for SQLite,
# but SQLite requires INTEGER PRIMARY KEY for auto-increment.
# Using raw SQL guarantees correct schema.

INIT_SQL = """
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" CHAR(36) NOT NULL UNIQUE,
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(20) UNIQUE,
    "password_hash" VARCHAR(255),
    "vpn_id" VARCHAR(36),
    "server_id" INT,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_active" INT NOT NULL DEFAULT 1,
    "is_admin" INT NOT NULL DEFAULT 0,
    "referral_code" VARCHAR(20) UNIQUE,
    "referred_by" INT,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "servers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" VARCHAR(100) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INT NOT NULL DEFAULT 443,
    "sub_port" INT NOT NULL DEFAULT 2096,
    "location" VARCHAR(100),
    "country" VARCHAR(2),
    "flag" VARCHAR(10),
    "max_clients" INT NOT NULL DEFAULT 100,
    "current_clients" INT NOT NULL DEFAULT 0,
    "is_active" INT NOT NULL DEFAULT 1,
    "is_online" INT NOT NULL DEFAULT 0,
    "inbound_id" INT NOT NULL DEFAULT 1,
    "protocol" VARCHAR(50) NOT NULL DEFAULT 'vless',
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" CHAR(36) NOT NULL UNIQUE,
    "user_id" INT NOT NULL,
    "payment_gateway" VARCHAR(50) NOT NULL,
    "external_id" VARCHAR(255),
    "amount" VARCHAR(40) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'RUB',
    "devices" INT NOT NULL DEFAULT 1,
    "duration_days" INT NOT NULL DEFAULT 30,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "promo_code" VARCHAR(50),
    "referral_bonus" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_transaction_user_id" ON "transactions" ("user_id");

CREATE TABLE IF NOT EXISTS "promocodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "duration_days" INT NOT NULL DEFAULT 30,
    "max_uses" INT NOT NULL DEFAULT 1,
    "current_uses" INT NOT NULL DEFAULT 0,
    "is_active" INT NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "referrals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referrer_id" INT NOT NULL,
    "referred_id" INT NOT NULL UNIQUE,
    "reward_paid" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_referrals_referrer" ON "referrals" ("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_referred" ON "referrals" ("referred_id");

CREATE TABLE IF NOT EXISTS "referrer_rewards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INT NOT NULL,
    "referral_id" INT NOT NULL,
    "reward_type" VARCHAR(20) NOT NULL,
    "amount" INT NOT NULL,
    "is_claimed" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "claimed_at" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_referrer_rewards_user" ON "referrer_rewards" ("user_id");
"""


async def init_db():
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.core.models"]},
    )
    conn = Tortoise.get_connection("default")
    await conn.execute_script(INIT_SQL)


async def close_db():
    await Tortoise.close_connections()
