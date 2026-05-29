from fastapi import APIRouter, Query, Request
from app.core.config_loader import load_config, load_plans, get_available_langs
from app.core.security import decode_token
from app.core.models import Setting, IpWhitelist, Admin, User

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    client = request.client
    return client.host if client else "unknown"


@router.get("/maintenance")
async def get_maintenance_status(request: Request):
    maintenance_app_setting = await Setting.get_or_none(key="maintenance_app")
    maintenance_app = maintenance_app_setting.value == "1" if maintenance_app_setting else False

    if not maintenance_app:
        return {"app": False, "can_bypass": False}

    ip = _client_ip(request)
    whitelisted = await IpWhitelist.filter(ip_address=ip, is_active=True).exists()
    if whitelisted:
        return {"app": True, "can_bypass": True}

    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        payload = decode_token(auth[7:])
        if payload:
            try:
                uid = int(payload["sub"])
                if payload.get("type") == "admin_access":
                    admin = await Admin.get_or_none(id=uid)
                    if admin and admin.is_active:
                        return {"app": True, "can_bypass": True}
                elif payload.get("type") == "access":
                    user = await User.get_or_none(id=uid)
                    if user and user.is_active and user.is_admin:
                        return {"app": True, "can_bypass": True}
            except (ValueError, KeyError):
                pass

    return {"app": True, "can_bypass": False}


@router.get("/config")
async def get_config(lang: str = Query("ru", description="Language code")):
    return load_config(lang)


@router.get("/plans")
async def get_plans(lang: str = Query("ru", description="Language code")):
    return load_plans(lang)


@router.get("/langs")
async def get_languages():
    return get_available_langs()
