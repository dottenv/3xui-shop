from fastapi import APIRouter
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
