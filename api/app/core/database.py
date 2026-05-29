from tortoise import Tortoise
from app.core.config import settings


async def init_db():
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.core.models"]},
    )
    await Tortoise.generate_schemas()


async def close_db():
    await Tortoise.close_connections()
