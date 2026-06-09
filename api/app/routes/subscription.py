import base64
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException, Response
from typing import Optional

from app.core.models import User, Subscription, Server
from app.core.services.xui import XuiClient, build_panel_url

logger = logging.getLogger("subs")
router = APIRouter()


async def fetch_server_links(server: Server, email: str) -> list[str]:
    try:
        client = XuiClient(
            base_url=build_panel_url(server.host, server.port, server.xui_url),
            username=server.xui_username,
            password=server.xui_password,
            api_token=server.xui_api_token,
            timeout=10,
        )
        links = await client.get_client_links(email)
        await client.close()
        return links or []
    except Exception as e:
        logger.warning("panel links fail %s/%s: %s", server.name, email, e)

    try:
        host = server.address or server.host
        port = server.sub_port or server.port or 443
        async with httpx.AsyncClient(verify=False, timeout=10) as c:
            resp = await c.get(f"https://{host}:{port}/sub/{email}")
        if resp.status_code == 200:
            decoded = base64.b64decode(resp.text).decode()
            return [line.strip() for line in decoded.split("\n") if line.strip()]
    except Exception as e:
        logger.warning("public sub fail %s/%s: %s", server.name, email, e)

    return []


def tag_link(link: str, server: Server) -> str:
    name = f"{server.flag or ''} {server.name}".strip()
    return link.rsplit("#", 1)[0] + "#" + name if "#" in link else link + "#" + name


@router.get("/{user_uuid}")
async def public_subscription(user_uuid: str, format: Optional[str] = "base64"):
    user = await User.get_or_none(uuid=user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub = await Subscription.filter(user_id=user.id, is_active=True).order_by("-expires_at").first()
    if not sub or not sub.client_uuid:
        raise HTTPException(status_code=404, detail="No active subscription")

    server = await Server.get_or_none(id=sub.server_id)
    if not server or server.is_dedicated:
        raise HTTPException(status_code=404, detail="Server unavailable")

    email = sub.client_email
    if not email:
        safe = server.name.replace(" ", "_").replace("/", "_")[:20]
        email = f"cwim_{safe}_{user.id}"

    links = await fetch_server_links(server, email)
    tagged = [tag_link(lnk, server) for lnk in links]

    if not tagged:
        raise HTTPException(status_code=404, detail="No configs available")

    expire_ts = int(sub.expires_at.timestamp()) if sub.expires_at else 0
    userinfo = (
        f"upload={sub.traffic_up}; download={sub.traffic_down}; "
        f"total={sub.traffic_limit}; expire={expire_ts}"
    )
    headers = {
        "profile-title": user.email or "VPN",
        "subscription-userinfo": userinfo,
        "profile-update-interval": "24",
        "content-encoding": "identity",
    }

    if format == "json":
        headers["content-type"] = "application/json"
        return Response(content=json.dumps({"subscriptions": tagged}), headers=headers)

    headers["content-type"] = "text/plain; charset=utf-8"
    body = base64.b64encode("\n".join(tagged).encode()).decode()
    return Response(content=body, headers=headers)
