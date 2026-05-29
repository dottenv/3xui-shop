from tortoise import Tortoise
from app.core.config import settings


TORTOISE_ORM = {
    "connections": {"default": settings.DATABASE_URL},
    "apps": {
        "models": {
            "models": ["app.core.models", "aerich.models"],
            "default_connection": "default",
        },
    },
}


async def init_db():
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.core.models"]},
    )
    await Tortoise.generate_schemas()


async def close_db():
    await Tortoise.close_connections()
