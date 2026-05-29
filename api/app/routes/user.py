from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime, timezone
from urllib.parse import quote

from app.core.schemas import UserResponse, ProfileUpdate
from app.core.models import User, Subscription, Server
from app.core.deps import get_current_user

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


@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub:
        return {"is_active": False}

    server = await Server.get_or_none(id=sub.server_id)
    now = datetime.now(timezone.utc)
    expires = sub.expires_at
    if expires.tzinfo is None:
        from datetime import timezone as tz
        expires = expires.replace(tzinfo=tz.utc)
    days_left = max(0, (expires - now).days)

    # Auto-expire if past due
    if days_left == 0 and expires < now:
        sub.is_active = False
        await sub.save()
        return {"is_active": False}

    if sub.traffic_limit > 0:
        used = sub.traffic_up + sub.traffic_down
        usage_pct = min(100, round(used / sub.traffic_limit * 100))
    else:
        usage_pct = 0

    return {
        "is_active": True,
        "plan_id": sub.plan_id,
        "server_id": sub.server_id,
        "server_name": server.name if server else f"#{sub.server_id}",
        "server_online": server.is_online if server else False,
        "client_uuid": sub.client_uuid,
        "devices": sub.devices,
        "duration_days": sub.duration_days,
        "traffic_up": sub.traffic_up,
        "traffic_down": sub.traffic_down,
        "traffic_limit": sub.traffic_limit,
        "usage_pct": usage_pct,
        "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "days_left": days_left,
        "auto_renew": sub.auto_renew,
    }


@router.get("/subscriptions")
async def get_subscriptions(user: User = Depends(get_current_user)):
    subs = await Subscription.filter(user_id=user.id).order_by("-created_at")
    return [
        {
            "id": s.id,
            "plan_id": s.plan_id,
            "server_id": s.server_id,
            "is_active": s.is_active,
            "expires_at": s.expires_at.isoformat(),
            "created_at": s.created_at.isoformat(),
        }
        for s in subs
    ]


@router.get("/subscription/config")
async def get_subscription_config(user: User = Depends(get_current_user)):
    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub:
        return {"detail": "No active subscription"}

    server = await Server.get_or_none(id=sub.server_id)
    if not server:
        return {"detail": "Server not found"}

    host = server.host
    port = server.sub_port or server.port or 443
    uuid = sub.client_uuid
    name = quote(f"{server.name} — CWIM")

    links = []
    base_params = f"pbk={server.config_public_key}&fp=chrome&sni={server.config_sni}"

    # VLESS + Reality (TCP)
    params1 = f"type=tcp&security=reality&flow={server.config_flow}&{base_params}&sid={server.config_short_id}"
    links.append({"protocol": "vless-reality-tcp", "link": f"vless://{uuid}@{host}:{port}?{params1}#{name}"})

    # VLESS + Reality (XHTTP)
    params2 = f"type=xhttp&security=reality&flow={server.config_flow}&{base_params}&sid={server.config_short_id}"
    links.append({"protocol": "vless-reality-xhttp", "link": f"vless://{uuid}@{host}:{port}?{params2}#{name}"})

    # Direct subscription link (Sing-box / Outline)
    sub_link = f"vless://{uuid}@{host}:{port}?{params1}&sub=true#{name}"
    links.append({"protocol": "subscription", "link": sub_link})

    return {
        "server_name": server.name,
        "host": host,
        "port": port,
        "protocol": server.protocol,
        "client_uuid": uuid,
        "links": links,
    }


@router.get("/servers")
async def get_servers():
    servers = await Server.filter(is_active=True).order_by("id")
    return [
        {
            "id": s.id,
            "name": s.name,
            "host": s.host,
            "port": s.port,
            "location": s.location,
            "country": s.country,
            "flag": s.flag,
            "is_online": s.is_online,
            "load": min(100, int(s.current_clients / max(s.max_clients, 1) * 100)),
            "clients": s.current_clients,
            "max_clients": s.max_clients,
        }
        for s in servers
    ]
