from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "promocodes" (
    "id" INT NOT NULL  PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "duration_days" INT NOT NULL  DEFAULT 30,
    "max_uses" INT NOT NULL  DEFAULT 1,
    "current_uses" INT NOT NULL  DEFAULT 0,
    "is_active" INT NOT NULL  DEFAULT 1,
    "expires_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" INT NOT NULL  PRIMARY KEY,
    "referrer_id" INT NOT NULL,
    "referred_id" INT NOT NULL UNIQUE,
    "reward_paid" INT NOT NULL  DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_referrals_referre_b5410a" ON "referrals" ("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_referre_5fede9" ON "referrals" ("referred_id");
CREATE TABLE IF NOT EXISTS "referrer_rewards" (
    "id" INT NOT NULL  PRIMARY KEY,
    "user_id" INT NOT NULL,
    "referral_id" INT NOT NULL,
    "reward_type" VARCHAR(20) NOT NULL,
    "amount" INT NOT NULL,
    "is_claimed" INT NOT NULL  DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "claimed_at" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_referrer_re_user_id_6008fb" ON "referrer_rewards" ("user_id");
CREATE TABLE IF NOT EXISTS "servers" (
    "id" INT NOT NULL  PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INT NOT NULL  DEFAULT 443,
    "sub_port" INT NOT NULL  DEFAULT 2096,
    "location" VARCHAR(100),
    "country" VARCHAR(2),
    "flag" VARCHAR(10),
    "max_clients" INT NOT NULL  DEFAULT 100,
    "current_clients" INT NOT NULL  DEFAULT 0,
    "is_active" INT NOT NULL  DEFAULT 1,
    "is_online" INT NOT NULL  DEFAULT 0,
    "inbound_id" INT NOT NULL  DEFAULT 1,
    "protocol" VARCHAR(50) NOT NULL  DEFAULT 'vless',
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" INT NOT NULL  PRIMARY KEY,
    "uuid" CHAR(36) NOT NULL UNIQUE,
    "user_id" INT NOT NULL,
    "payment_gateway" VARCHAR(50) NOT NULL,
    "external_id" VARCHAR(255),
    "amount" VARCHAR(40) NOT NULL,
    "currency" VARCHAR(3) NOT NULL  DEFAULT 'RUB',
    "devices" INT NOT NULL  DEFAULT 1,
    "duration_days" INT NOT NULL  DEFAULT 30,
    "status" VARCHAR(20) NOT NULL  DEFAULT 'pending',
    "promo_code" VARCHAR(50),
    "referral_bonus" INT NOT NULL  DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_transaction_user_id_63ed92" ON "transactions" ("user_id");
CREATE TABLE IF NOT EXISTS "users" (
    "id" INT NOT NULL  PRIMARY KEY,
    "uuid" CHAR(36) NOT NULL UNIQUE,
    "email" VARCHAR(255)  UNIQUE,
    "phone" VARCHAR(20)  UNIQUE,
    "password_hash" VARCHAR(255),
    "vpn_id" VARCHAR(36),
    "server_id" INT,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_active" INT NOT NULL  DEFAULT 1,
    "is_admin" INT NOT NULL  DEFAULT 0,
    "referral_code" VARCHAR(20)  UNIQUE,
    "referred_by" INT,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
)
