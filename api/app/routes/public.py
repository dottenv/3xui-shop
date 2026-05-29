from fastapi import APIRouter, Query
from app.core.config_loader import load_config, load_plans, get_available_langs
from app.core.models import Setting

router = APIRouter()


@router.get("/maintenance")
async def get_maintenance_status():
    site = await Setting.get_or_none(key="maintenance_site")
    app = await Setting.get_or_none(key="maintenance_app")
    return {
        "site": site.value == "1" if site else False,
        "app": app.value == "1" if app else False,
    }


@router.get("/config")
async def get_config(lang: str = Query("ru", description="Language code")):
    return load_config(lang)


@router.get("/plans")
async def get_plans(lang: str = Query("ru", description="Language code")):
    return load_plans(lang)


@router.get("/langs")
async def get_languages():
    return get_available_langs()
