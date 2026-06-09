import base64
from fastapi import APIRouter, HTTPException
from urllib.parse import quote
from typing import Optional

from app.core.models import User, Subscription, Server

router = APIRouter()


def build_vless_link(host: str, port: int, client_uuid: str, server: Server, label: str) -> str:
    params = []
    params.append(f"type=tcp")
    params.append(f"security=reality")
    if server.config_flow:
        params.append(f"flow={server.config_flow}")
    if server.config_public_key:
        params.append(f"pbk={server.config_public_key}")
    params.append("fp=chrome")
    if server.config_sni:
        params.append(f"sni={server.config_sni}")
    if server.config_short_id:
        params.append(f"sid={server.config_short_id}")
    query = "&".join(params)
    return f"vless://{client_uuid}@{host}:{port}?{query}#{quote(label)}"


def build_trojan_link(host: str, port: int, password: str, server: Server, label: str) -> str:
    params = []
    params.append("security=reality")
    if server.config_public_key:
        params.append(f"pbk={server.config_public_key}")
    params.append("fp=chrome")
    if server.config_sni:
        params.append(f"sni={server.config_sni}")
    if server.config_short_id:
        params.append(f"sid={server.config_short_id}")
    query = "&".join(params)
    return f"trojan://{password}@{host}:{port}?{query}#{quote(label)}"


def build_server_link(server: Server, client_uuid: str, label: str) -> str:
    host = server.address or server.host
    port = server.sub_port or server.port or 443

    proto = (server.protocol or "vless").lower()
    if proto == "trojan":
        return build_trojan_link(host, port, client_uuid, server, label)
    return build_vless_link(host, port, client_uuid, server, label)


@router.get("/{user_uuid}")
async def public_subscription(user_uuid: str, format: Optional[str] = "base64"):
    user = await User.get_or_none(uuid=user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subs = await Subscription.filter(user_id=user.id, is_active=True).all()
    if not subs:
        raise HTTPException(status_code=404, detail="No active subscriptions")

    lines = []
    for sub in subs:
        if not sub.client_uuid:
            continue
        server = await Server.get_or_none(id=sub.server_id)
        if not server or server.is_dedicated:
            continue
        label = f"{server.flag or ''} {server.name}".strip()
        link = build_server_link(server, sub.client_uuid, label)
        lines.append(link)

    if not lines:
        raise HTTPException(status_code=404, detail="No configs available")

    text = "\n".join(lines)

    if format == "json":
        return {"subscriptions": lines}

    return base64.b64encode(text.encode()).decode()
