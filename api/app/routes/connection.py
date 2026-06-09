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
    sub_url = f"https://{settings.APP_DOMAIN}/api/sub/{user.uuid}"
    encoded = quote(sub_url, safe="")
    label = quote(user.email or "VPN", safe="")

    if app == "hiddify":
        deep_link = f"hiddify://import/{sub_url}#{label}"
    elif app == "happ":
        deep_link = f"happ://add/{sub_url}"
    elif app == "v2rayng":
        deep_link = f"v2rayng://install-config/?url={encoded}"
    elif app == "nekobox":
        deep_link = f"clash://install-config?url={encoded}&name={label}"
    elif app == "singbox":
        deep_link = f"sing-box://import-remote-profile?url={encoded}"
    elif app == "shadowrocket":
        deep_link = f"shadowrocket://add/sub?url={encoded}"
    elif app == "streisand":
        deep_link = f"streisand://add/sub?url={encoded}"
    elif app == "foxray":
        deep_link = f"foxray://install-config?url={encoded}"
    elif app == "v2box":
        deep_link = f"v2box://install-config?url={encoded}"
    elif app == "stash":
        deep_link = f"stash://install-config?url={encoded}&name={label}"
    elif app == "loon":
        deep_link = f"loon://import?url={encoded}"
    elif app == "clashverge":
        deep_link = f"clashverge://install-config?url={encoded}&name={label}"
    elif app == "clashmeta":
        deep_link = f"clashmeta://install-config?url={encoded}&name={label}"
    elif app == "qv2ray":
        deep_link = f"qv2ray://install-config?url={encoded}"
    elif app == "kitsunebi":
        deep_link = f"kitsunebi://install-config?url={encoded}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported app: {app}")

    return {"deep_link": deep_link, "sub_url": sub_url}


APPS_INFO = [
    {"id": "hiddify", "name": "Hiddify", "icon": "hiddify", "platform": "Android/iOS/Windows/Mac/Linux"},
    {"id": "happ", "name": "Happ", "icon": "happ", "platform": "iOS"},
    {"id": "v2rayng", "name": "v2rayNG", "icon": "v2rayng", "platform": "Android"},
    {"id": "nekobox", "name": "NekoBox", "icon": "nekobox", "platform": "Android"},
    {"id": "singbox", "name": "Sing-box", "icon": "singbox", "platform": "Android/iOS/Windows/Mac/Linux"},
    {"id": "shadowrocket", "name": "Shadowrocket", "icon": "shadowrocket", "platform": "iOS"},
    {"id": "streisand", "name": "Streisand", "icon": "streisand", "platform": "iOS"},
    {"id": "foxray", "name": "Foxray", "icon": "foxray", "platform": "iOS"},
    {"id": "v2box", "name": "V2Box", "icon": "v2box", "platform": "iOS"},
    {"id": "stash", "name": "Stash", "icon": "stash", "platform": "iOS"},
    {"id": "loon", "name": "Loon", "icon": "loon", "platform": "iOS"},
    {"id": "clashverge", "name": "Clash Verge", "icon": "clashverge", "platform": "Windows/Mac/Linux"},
    {"id": "clashmeta", "name": "Clash Meta", "icon": "clashmeta", "platform": "Android"},
    {"id": "qv2ray", "name": "Qv2ray", "icon": "qv2ray", "platform": "Windows/Mac/Linux"},
    {"id": "kitsunebi", "name": "Kitsunebi", "icon": "kitsunebi", "platform": "iOS"},
]


@router.get("/connection/apps")
async def get_supported_apps():
    return APPS_INFO
