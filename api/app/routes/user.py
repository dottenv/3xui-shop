import logging
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.core.schemas import UserResponse, ProfileUpdate
from app.core.models import User, Subscription, Server
from app.core.deps import get_current_user
from app.core.services.xui import XuiClient, build_panel_url, generate_uuid

logger = logging.getLogger("user")
router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: ProfileUpdate, user: User = Depends(get_current_user)):
    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name
    await user.save()
    return user


@router.get("/balance")
async def get_balance(user: User = Depends(get_current_user)):
    return {"balance": float(user.balance)}


@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub:
        return {"is_active": False}

    now = datetime.now(timezone.utc)
    expires = sub.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    days_left = max(0, (expires - now).days)

    if days_left == 0 and expires < now:
        sub.is_active = False
        await sub.save()
        return {"is_active": False}

    usage_pct = 0
    if sub.traffic_limit > 0:
        usage_pct = min(100, round((sub.traffic_up + sub.traffic_down) / sub.traffic_limit * 100))

    server = await Server.get_or_none(id=sub.server_id)

    return {
        "is_active": True,
        "id": sub.id,
        "plan_id": sub.plan_id,
        "devices": sub.devices,
        "duration_days": sub.duration_days,
        "traffic_up": sub.traffic_up,
        "traffic_down": sub.traffic_down,
        "traffic_limit": sub.traffic_limit,
        "usage_pct": usage_pct,
        "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "days_left": days_left,
        "server_id": sub.server_id,
        "server_name": server.name if server else None,
        "server_flag": server.flag or "" if server else "",
        "server_online": server.is_online if server else False,
        "sub_url": f"https://{settings.APP_DOMAIN}/api/sub/{user.uuid}",
    }


@router.get("/subscription/config")
async def get_subscription_config(user: User = Depends(get_current_user)):
    from app.routes.subscription import fetch_server_links

    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub or not sub.client_uuid:
        raise HTTPException(status_code=404, detail="Нет активной подписки")

    server = await Server.get_or_none(id=sub.server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Сервер не найден")

    email = sub.client_email
    if not email:
        safe = server.name.replace(" ", "_").replace("/", "_")[:20]
        email = f"cwim_{safe}_{user.id}"

    links = await fetch_server_links(server, email)
    link = links[0] if links else ""

    return {
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "servers": [{
            "server_id": server.id,
            "server_name": server.name,
            "server_flag": server.flag or "",
            "host": server.address or server.host,
            "port": server.sub_port or server.port or 443,
            "protocol": server.protocol,
            "client_uuid": sub.client_uuid,
            "is_online": server.is_online,
            "link": link,
        }],
    }


@router.get("/subscriptions")
async def get_subscriptions(user: User = Depends(get_current_user)):
    subs = await Subscription.filter(user_id=user.id).order_by("-created_at")
    return [{
        "id": s.id,
        "plan_id": s.plan_id,
        "server_id": s.server_id,
        "is_active": s.is_active,
        "expires_at": s.expires_at.isoformat(),
        "created_at": s.created_at.isoformat(),
    } for s in subs]


@router.get("/servers")
async def get_servers():
    servers = await Server.filter(is_active=True).order_by("id")
    return [{
        "id": s.id,
        "name": s.name,
        "host": s.host,
        "address": s.address or s.host,
        "port": s.port,
        "location": s.location,
        "country": s.country,
        "flag": s.flag,
        "is_online": s.is_online,
        "load": min(100, int(s.current_clients / max(s.max_clients, 1) * 100)),
        "clients": s.current_clients,
        "max_clients": s.max_clients,
    } for s in servers]


@router.post("/switch-server/{server_id}")
async def switch_server(server_id: int, user: User = Depends(get_current_user)):
    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub:
        raise HTTPException(status_code=404, detail="Нет активной подписки")

    new_server = await Server.get_or_none(id=server_id, is_active=True)
    if not new_server:
        raise HTTPException(status_code=404, detail="Сервер не найден")

    if sub.server_id == server_id:
        raise HTTPException(status_code=400, detail="Вы уже используете этот сервер")

    old_server = await Server.get_or_none(id=sub.server_id)
    old_email = sub.client_email
    old_uuid = sub.client_uuid

    safe = new_server.name.replace(" ", "_").replace("/", "_")[:20]
    new_email = f"cwim_{safe}_{user.id}"
    new_uuid = generate_uuid()
    flow = new_server.config_flow or "xtls-rprx-vision"

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if sub.expires_at:
        remaining = int(sub.expires_at.timestamp()) - now_ts
    else:
        remaining = 0
    expiry_ms = int((now_ts + max(remaining, 0)) * 1000) if remaining > 0 else 0

    # Create client on new server
    client = XuiClient(
        base_url=build_panel_url(new_server.host, new_server.port, new_server.xui_url),
        username=new_server.xui_username,
        password=new_server.xui_password,
        api_token=new_server.xui_api_token,
        timeout=15,
    )
    try:
        existing = await client.get_client_by_email(new_email)
        if existing:
            await client.delete_client(new_email)

        await client.add_client(
            inbound_id=new_server.inbound_id,
            email=new_email,
            client_id=new_uuid,
            expiry_time=expiry_ms if remaining > 0 else 0,
            flow=flow,
            sub_id=new_email,
            limit_ip=0,
        )
    except Exception as e:
        await client.close()
        raise HTTPException(status_code=502, detail=f"Ошибка создания ключа на {new_server.name}: {str(e)}")
    await client.close()

    # Delete from old server
    if old_server and old_email:
        old_client = XuiClient(
            base_url=build_panel_url(old_server.host, old_server.port, old_server.xui_url),
            username=old_server.xui_username,
            password=old_server.xui_password,
            api_token=old_server.xui_api_token,
            timeout=10,
        )
        try:
            await old_client.delete_client(old_email)
        except Exception:
            logger.warning("Failed to delete old client %s on server %s", old_email, old_server.name)
        await old_client.close()

    # Update subscription record
    sub.server_id = server_id
    sub.client_uuid = new_uuid
    sub.client_email = new_email
    await sub.save()

    return {
        "success": True,
        "server_id": server_id,
        "server_name": new_server.name,
        "client_uuid": new_uuid,
    }
