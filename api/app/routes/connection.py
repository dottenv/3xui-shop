from fastapi import APIRouter, HTTPException, Depends, Query
from urllib.parse import quote

from app.core.config import settings
from app.core.models import User
from app.core.deps import get_current_user

router = APIRouter()

DEEP_LINKS = {
    "hiddify": "hiddify://import/subscription?url={sub_url}",
    "v2rayng": "v2rayng://subscribe/?server={sub_url}",
    "nekobox": "nekobox://subscribe?url={sub_url}",
    "singbox": "sing-box://import-remote-profile?url={sub_url}",
    "shadowrocket": "shadowrocket://add/sub?url={sub_url}",
}


@router.get("/connection")
async def get_connection(
    app: str = Query("hiddify", description="VPN client app"),
    user: User = Depends(get_current_user),
):
    sub_url = f"https://{settings.APP_DOMAIN}/sub/{user.uuid}"
    encoded = quote(sub_url, safe="")

    template = DEEP_LINKS.get(app)
    if not template:
        raise HTTPException(status_code=400, detail=f"Неподдерживаемое приложение: {app}")

    deep_link = template.format(sub_url=encoded)
    return {"deep_link": deep_link, "sub_url": sub_url}


APPS_INFO = [
    {"id": "hiddify", "name": "Hiddify", "icon": "hiddify"},
    {"id": "v2rayng", "name": "v2rayNG", "icon": "v2rayng"},
    {"id": "nekobox", "name": "NekoBox", "icon": "nekobox"},
    {"id": "singbox", "name": "Sing-box", "icon": "singbox"},
    {"id": "shadowrocket", "name": "Shadowrocket", "icon": "shadowrocket"},
]


@router.get("/connection/apps")
async def get_supported_apps():
    return APPS_INFO
