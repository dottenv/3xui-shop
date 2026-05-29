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


@router.get("/balance")
async def get_balance(user: User = Depends(get_current_user)):
    return {"balance": float(user.balance)}


@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    subs = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").all()
    if not subs:
        return {"is_active": False}

    now = datetime.now(timezone.utc)
    latest = subs[0]
    expires = latest.expires_at
    if expires.tzinfo is None:
        from datetime import timezone as tz
        expires = expires.replace(tzinfo=tz.utc)
    days_left = max(0, (expires - now).days)

    if days_left == 0 and expires < now:
        for s in subs:
            s.is_active = False
            await s.save()
        return {"is_active": False}

    total_up = sum(s.traffic_up for s in subs)
    total_down = sum(s.traffic_down for s in subs)
    total_limit = sum(s.traffic_limit for s in subs)
    usage_pct = min(100, round((total_up + total_down) / max(total_limit, 1) * 100)) if total_limit > 0 else 0

    servers_info = []
    for s in subs:
        srv = await Server.get_or_none(id=s.server_id)
        servers_info.append({
            "server_id": s.server_id,
            "server_name": srv.name if srv else f"#{s.server_id}",
            "server_online": srv.is_online if srv else False,
            "server_flag": srv.flag or "" if srv else "",
        })

    return {
        "is_active": True,
        "plan_id": latest.plan_id,
        "devices": latest.devices,
        "duration_days": latest.duration_days,
        "traffic_up": total_up,
        "traffic_down": total_down,
        "traffic_limit": total_limit,
        "usage_pct": usage_pct,
        "starts_at": latest.starts_at.isoformat() if latest.starts_at else None,
        "expires_at": latest.expires_at.isoformat() if latest.expires_at else None,
        "days_left": days_left,
        "servers": servers_info,
        "server_count": len(servers_info),
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
    subs = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").all()
    if not subs:
        raise HTTPException(status_code=404, detail="Нет активной подписки")

    all_servers = []
    for sub in subs:
        server = await Server.get_or_none(id=sub.server_id)
        if not server or not sub.client_uuid:
            continue

        host = server.address or server.host
        port = server.sub_port or server.port or 443
        uuid = sub.client_uuid
        label = f"Cwim VPN — {server.flag or ''} {server.name}".strip()
        name = quote(label)
        base = f"pbk={server.config_public_key}&fp=chrome&sni={server.config_sni}"
        sid = server.config_short_id
        flow = server.config_flow

        links = []
        p1 = f"type=tcp&security=reality&flow={flow}&{base}&sid={sid}"
        links.append({"protocol": "VLESS+Reality TCP", "link": f"vless://{uuid}@{host}:{port}?{p1}#{name}"})
        p2 = f"type=xhttp&security=reality&flow={flow}&{base}&sid={sid}"
        links.append({"protocol": "VLESS+Reality XHTTP", "link": f"vless://{uuid}@{host}:{port}?{p2}#{name}"})

        all_servers.append({
            "server_name": server.name,
            "server_flag": server.flag or "",
            "host": host,
            "port": port,
            "protocol": server.protocol,
            "client_uuid": uuid,
            "is_online": server.is_online,
            "links": links,
        })

    if not all_servers:
        raise HTTPException(status_code=404, detail="Нет доступных конфигураций")

    return {
        "expires_at": subs[0].expires_at.isoformat() if subs[0].expires_at else None,
        "servers": all_servers,
    }


@router.get("/servers")
async def get_servers():
    servers = await Server.filter(is_active=True).order_by("id")
    return [
        {
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
        }
        for s in servers
    ]
