import base64
import json
import httpx
from fastapi import APIRouter, HTTPException, Response
from typing import Optional

from app.core.models import User, Subscription, Server

router = APIRouter()


async def fetch_panel_links(server: Server, email: str) -> list[str]:
    base = (server.xui_url or f"https://{server.host}:{server.port}").rstrip("/")
    if not base.startswith("http"):
        base = f"https://{base}"
    url = f"{base}/sub/{email}"

    async with httpx.AsyncClient(verify=False, timeout=15) as client:
        resp = await client.get(url)

    if resp.status_code != 200:
        return []

    try:
        decoded = base64.b64decode(resp.text).decode()
    except Exception:
        return []

    return [line.strip() for line in decoded.split("\n") if line.strip()]


@router.get("/{user_uuid}")
async def public_subscription(user_uuid: str, format: Optional[str] = "base64"):
    user = await User.get_or_none(uuid=user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subs = await Subscription.filter(user_id=user.id, is_active=True).all()
    if not subs:
        raise HTTPException(status_code=404, detail="No active subscriptions")

    all_links = []
    total_down = 0
    total_up = 0
    total_limit = 0
    max_expire = 0

    for sub in subs:
        if not sub.client_uuid:
            continue

        server = await Server.get_or_none(id=sub.server_id)
        if not server or server.is_dedicated:
            continue

        total_down += sub.traffic_down or 0
        total_up += sub.traffic_up or 0
        total_limit += sub.traffic_limit or 0
        if sub.expires_at:
            ts = int(sub.expires_at.timestamp())
            if ts > max_expire:
                max_expire = ts

        email = sub.client_email
        if not email:
            safe_name = server.name.replace(" ", "_").replace("/", "_")[:20]
            email = f"cwim_{safe_name}_{user.id}"

        try:
            links = await fetch_panel_links(server, email)
            all_links.extend(links)
        except Exception:
            pass

    if not all_links:
        raise HTTPException(status_code=404, detail="No configs available")

    profile_title = user.email or "VPN Subscription"
    userinfo = f"upload={total_up}; download={total_down}; total={total_limit}"
    if max_expire:
        userinfo += f"; expire={max_expire}"

    headers = {
        "profile-title": profile_title,
        "subscription-userinfo": userinfo,
        "profile-update-interval": "24",
        "content-encoding": "identity",
    }

    if format == "json":
        headers["content-type"] = "application/json"
        return Response(content=json.dumps({"subscriptions": all_links}), headers=headers)

    headers["content-type"] = "text/plain; charset=utf-8"
    text = "\n".join(all_links)
    body = base64.b64encode(text.encode()).decode()
    return Response(content=body, headers=headers)
