from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "CWIM API"
    DATABASE_URL: str = "sqlite:///data/database.db"
    REDIS_URL: str = "redis://redis:6379/0"
    API_SECRET_KEY: str = "change-me-in-production"

    CORS_ORIGINS: List[str] = [
        "https://app.cwim.ru",
        "https://crm.cwim.ru",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    XUI_USERNAME: str = "admin"
    XUI_PASSWORD: str = "password"
    XUI_TOKEN: str = ""

    CRYPTOMUS_ENABLED: bool = False
    CRYPTOMUS_API_KEY: str = ""
    CRYPTOMUS_MERCHANT_UUID: str = ""
    CRYPTOMUS_WEBHOOK_SECRET: str = ""

    HELEKET_ENABLED: bool = False
    HELEKET_API_KEY: str = ""
    HELEKET_MERCHANT_UUID: str = ""
    HELEKET_WEBHOOK_SECRET: str = ""

    YOOKASSA_ENABLED: bool = False
    YOOKASSA_SHOP_ID: str = ""
    YOOKASSA_SECRET_KEY: str = ""

    YOOMONEY_ENABLED: bool = False
    YOOMONEY_SHOP_ID: str = ""
    YOOMONEY_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
