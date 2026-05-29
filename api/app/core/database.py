from tortoise import Tortoise
from app.core.config import settings

SCHEMA_MIGRATIONS_TABLE = "_migrations"

BASE_SCHEMA = """
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
    "registration_ip" VARCHAR(45),
    "registration_user_agent" TEXT,
    "last_ip" VARCHAR(45),
    "last_login" TIMESTAMP,
    "last_user_agent" TEXT,
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
    "xui_url" VARCHAR(255) NOT NULL DEFAULT '',
    "xui_username" VARCHAR(100) NOT NULL DEFAULT '',
    "xui_password" VARCHAR(255) NOT NULL DEFAULT '',
    "is_dedicated" INT NOT NULL DEFAULT 0,
    "ssh_host" VARCHAR(255) NOT NULL DEFAULT '',
    "ssh_port" INT NOT NULL DEFAULT 22,
    "ssh_username" VARCHAR(100) NOT NULL DEFAULT '',
    "ssh_password" VARCHAR(255) NOT NULL DEFAULT '',
    "ssh_key" TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS "admins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "is_active" INT NOT NULL DEFAULT 1,
    "created_by" INT,
    "created_at" TIMESTAMP NOT NULL
);
"""

# Add new migrations here as tuples: (name, sql)
MIGRATIONS: list[tuple[str, str]] = [
    ("001_admins", """
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INT NOT NULL,
    "plan_id" VARCHAR(50) NOT NULL,
    "server_id" INT NOT NULL,
    "client_uuid" VARCHAR(36) NOT NULL UNIQUE,
    "devices" INT NOT NULL DEFAULT 1,
    "duration_days" INT NOT NULL DEFAULT 30,
    "traffic_up" BIGINT NOT NULL DEFAULT 0,
    "traffic_down" BIGINT NOT NULL DEFAULT 0,
    "traffic_limit" BIGINT NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "is_active" INT NOT NULL DEFAULT 1,
    "auto_renew" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_sub_user" ON "subscriptions" ("user_id");

CREATE TABLE IF NOT EXISTS "admins" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "email" VARCHAR(255) NOT NULL UNIQUE,
            "password_hash" VARCHAR(255) NOT NULL,
            "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
            "is_active" INT NOT NULL DEFAULT 1,
            "created_by" INT,
            "created_at" TIMESTAMP NOT NULL
        );
    """),
    ("002_settings", """
        CREATE TABLE IF NOT EXISTS "settings" (
            "key"   VARCHAR(100) NOT NULL PRIMARY KEY,
            "value" TEXT NOT NULL,
            "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO "settings" ("key", "value") VALUES ('maintenance_site', '0');
        INSERT OR IGNORE INTO "settings" ("key", "value") VALUES ('maintenance_app', '0');
        INSERT OR IGNORE INTO "settings" ("key", "value") VALUES ('lang', 'ru');
    """),
    ("003_ip_whitelist", """
        CREATE TABLE IF NOT EXISTS "ip_whitelist" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "ip_address" VARCHAR(45) NOT NULL,
            "comment" VARCHAR(255),
            "is_active" INT NOT NULL DEFAULT 1,
            "created_by" INT,
            "created_at" TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "idx_ip_whitelist_ip" ON "ip_whitelist" ("ip_address");
    """),
    ("005_subscriptions", """
        CREATE TABLE IF NOT EXISTS "subscriptions" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "user_id" INT NOT NULL,
            "plan_id" VARCHAR(50) NOT NULL,
            "server_id" INT NOT NULL,
            "client_uuid" VARCHAR(36) NOT NULL UNIQUE,
            "devices" INT NOT NULL DEFAULT 1,
            "duration_days" INT NOT NULL DEFAULT 30,
            "traffic_up" BIGINT NOT NULL DEFAULT 0,
            "traffic_down" BIGINT NOT NULL DEFAULT 0,
            "traffic_limit" BIGINT NOT NULL DEFAULT 0,
            "starts_at" TIMESTAMP NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "is_active" INT NOT NULL DEFAULT 1,
            "auto_renew" INT NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "idx_sub_user" ON "subscriptions" ("user_id");
    """),
]


async def run_migrations():
    conn = Tortoise.get_connection("default")

    # Ensure migrations tracking table exists
    await conn.execute_script(f"""
        CREATE TABLE IF NOT EXISTS "{SCHEMA_MIGRATIONS_TABLE}" (
            "name" TEXT NOT NULL PRIMARY KEY,
            "applied_at" TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)

    # Get applied migrations
    rows = await conn.execute_query(f'SELECT "name" FROM "{SCHEMA_MIGRATIONS_TABLE}"')
    applied = {row["name"] for row in rows[1]}

    for name, sql in MIGRATIONS:
        if name in applied:
            continue
        await conn.execute_script(sql)
        await conn.execute_query(f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)', [name])
        print(f"[db] Applied migration: {name}")

    # Migration 004 — user IP tracking (columns may already exist on fresh DB)
    if "004_user_tracking" not in applied:
        col_info = await conn.execute_query("PRAGMA table_info('users')")
        col_names = {r["name"] for r in col_info[1]}
        track_cols = [
            ("registration_ip", "VARCHAR(45)"),
            ("registration_user_agent", "TEXT"),
            ("last_ip", "VARCHAR(45)"),
            ("last_login", "TIMESTAMP"),
            ("last_user_agent", "TEXT"),
        ]
        added = False
        for col, col_type in track_cols:
            if col not in col_names:
                await conn.execute_query(f'ALTER TABLE "users" ADD COLUMN "{col}" {col_type}')
                added = True
        if added:
            await conn.execute_query(f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)', ["004_user_tracking"])
            print("[db] Applied migration: 004_user_tracking")
        else:
            # Still mark applied so we don't check PRAGMA every boot
            await conn.execute_query(f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)', ["004_user_tracking"])
            print("[db] Migration 004_user_tracking: columns already present, skipped")

    # Migration 006 — server XUI connection fields
    if "006_servers_xui" not in applied:
        col_info = await conn.execute_query("PRAGMA table_info('servers')")
        col_names = {r["name"] for r in col_info[1]}
        xui_cols = [
            ("xui_url", "VARCHAR(255) NOT NULL DEFAULT ''"),
            ("xui_username", "VARCHAR(100) NOT NULL DEFAULT ''"),
            ("xui_password", "VARCHAR(255) NOT NULL DEFAULT ''"),
        ]
        added = False
        for col, col_type in xui_cols:
            if col not in col_names:
                await conn.execute_query(f'ALTER TABLE "servers" ADD COLUMN "{col}" {col_type}')
                added = True
        if not added:
            await conn.execute_query(
                f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)',
                ["006_servers_xui"],
            )
            print("[db] Migration 006_servers_xui: columns already present, skipped")
        else:
            await conn.execute_query(
                f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)',
                ["006_servers_xui"],
            )
            print("[db] Applied migration: 006_servers_xui")

    # Migration 007 — server SSH + dedicated fields
    if "007_servers_ssh_dedicated" not in applied:
        col_info = await conn.execute_query("PRAGMA table_info('servers')")
        col_names = {r["name"] for r in col_info[1]}
        sr_cols = [
            ("is_dedicated", "INT NOT NULL DEFAULT 0"),
            ("ssh_host", "VARCHAR(255) NOT NULL DEFAULT ''"),
            ("ssh_port", "INT NOT NULL DEFAULT 22"),
            ("ssh_username", "VARCHAR(100) NOT NULL DEFAULT ''"),
            ("ssh_password", "VARCHAR(255) NOT NULL DEFAULT ''"),
            ("ssh_key", "TEXT NOT NULL DEFAULT ''"),
        ]
        added = False
        for col, col_type in sr_cols:
            if col not in col_names:
                await conn.execute_query(f'ALTER TABLE "servers" ADD COLUMN "{col}" {col_type}')
                added = True
        if not added:
            await conn.execute_query(
                f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)',
                ["007_servers_ssh_dedicated"],
            )
            print("[db] Migration 007_servers_ssh_dedicated: columns already present, skipped")
        else:
            await conn.execute_query(
                f'INSERT INTO "{SCHEMA_MIGRATIONS_TABLE}" ("name") VALUES (?)',
                ["007_servers_ssh_dedicated"],
            )
            print("[db] Applied migration: 007_servers_ssh_dedicated")

    print("[db] Schema up to date.")


async def init_db():
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.core.models"]},
    )
    conn = Tortoise.get_connection("default")

    # Check if any of our tables already exist (fresh DB or existing)
    existing = await conn.execute_query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','servers','transactions')"
    )
    if not existing[1]:
        print("[db] Fresh database — creating schema...")
        await conn.execute_script(BASE_SCHEMA)
    else:
        print("[db] Database exists — checking schema version...")

    await run_migrations()
    print("[db] Schema up to date.")


async def close_db():
    await Tortoise.close_connections()
