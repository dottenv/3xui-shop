import base64
from fastapi import APIRouter, HTTPException
from urllib.parse import quote
from typing import Optional

from app.core.models import User, Subscription, Server

router = APIRouter()


def build_server_links(server: Server, client_uuid: str, label: str) -> list[dict]:
    host = server.host
    port = server.sub_port or server.port or 443
    name = quote(label)
    base = f"pbk={server.config_public_key}&fp=chrome&sni={server.config_sni}"
    sid = server.config_short_id
    flow = server.config_flow

    links = []
    p1 = f"type=tcp&security=reality&flow={flow}&{base}&sid={sid}"
    links.append({"protocol": "VLESS+Reality TCP", "link": f"vless://{client_uuid}@{host}:{port}?{p1}#{name}"})

    p2 = f"type=xhttp&security=reality&flow={flow}&{base}&sid={sid}"
    links.append({"protocol": "VLESS+Reality XHTTP", "link": f"vless://{client_uuid}@{host}:{port}?{p2}#{name}"})

    return links


@router.get("/{user_uuid}")
async def public_subscription(user_uuid: str, format: Optional[str] = "base64"):
    user = await User.get_or_none(uuid=user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subs = await Subscription.filter(user_id=user.id, is_active=True).all()
    if not subs:
        raise HTTPException(status_code=404, detail="No active subscriptions")

    all_links = []
    for sub in subs:
        if not sub.client_uuid:
            continue
        server = await Server.get_or_none(id=sub.server_id)
        if not server:
            continue
        label = f"Cwim VPN — {server.flag or ''} {server.name}".strip()
        links = build_server_links(server, sub.client_uuid, label)
        all_links.extend(links)

    text = "\n".join(l["link"] for l in all_links)

    if format == "json":
        return {"subscriptions": all_links}

    encoded = base64.b64encode(text.encode()).decode()
    return encoded
