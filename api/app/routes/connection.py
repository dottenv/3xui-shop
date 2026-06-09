from fastapi import APIRouter, HTTPException, Depends, Query
from urllib.parse import quote

from app.core.config import settings
from app.core.models import User
from app.core.deps import get_current_user

router = APIRouter()


@router.get("/connection")
async def get_connection(
    app: str = Query("hiddify", description="VPN client app"),
    user: User = Depends(get_current_user),
):
    sub_url = f"https://{settings.APP_DOMAIN}/sub/{user.uuid}"
    encoded = quote(sub_url, safe="")
    label = quote(user.email or "VPN", safe="")

    if app == "hiddify":
        deep_link = f"hiddify://import/{sub_url}#{label}"
    elif app == "v2rayng":
        deep_link = f"v2rayng://install-config/?url={encoded}"
    elif app == "nekobox":
        deep_link = f"clash://install-config?url={encoded}&name={label}"
    elif app == "singbox":
        deep_link = f"sing-box://import-remote-profile?url={encoded}"
    elif app == "shadowrocket":
        deep_link = f"shadowrocket://add/sub?url={encoded}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported app: {app}")

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
