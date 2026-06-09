import asyncio
import base64
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException, Response
from typing import Optional

from app.core.models import User, Subscription, Server
from app.core.services.xui import XuiClient, build_base_url

logger = logging.getLogger("subscription")
router = APIRouter()


def tag_link(link: str, server: Server, traffic_limit: int) -> str:
    gb = round(traffic_limit / (1024**3), 1) if traffic_limit else 0
    name = f"{server.flag or ''} {server.name}".strip()
    if "#" in link:
        return link.rsplit("#", 1)[0] + "#" + name
    return link + "#" + name


async def fetch_panel_links_api(server: Server, email: str) -> list[str]:
    try:
        client = XuiClient(
            base_url=build_base_url(server.host, server.port, server.xui_url),
            username=server.xui_username,
            password=server.xui_password,
            api_token=server.xui_api_token,
            timeout=10,
        )
        links = await client.get_client_links(email)
        if not links:
            links = await client.get_sub_links(email)
        await client.close()
        return links
    except Exception as e:
        logger.warning("fetch_panel_links_api(%s, %s) failed: %s", server.name, email, e)
        return []


async def fetch_panel_links_public(server: Server, email: str) -> list[str]:
    connect_host = server.address or server.host
    sub_port = server.sub_port or server.port or 443
    url = f"https://{connect_host}:{sub_port}/sub/{email}"

    try:
        async with httpx.AsyncClient(verify=False, timeout=10) as client:
            resp = await client.get(url)
    except Exception as e:
        logger.warning("fetch_panel_links_public(%s) failed: %s", url, e)
        return []

    if resp.status_code != 200:
        return []

    try:
        decoded = base64.b64decode(resp.text).decode()
    except Exception:
        return []

    return [line.strip() for line in decoded.split("\n") if line.strip()]


async def fetch_panel_links(server: Server, email: str) -> list[str]:
    links = await fetch_panel_links_api(server, email)
    if not links:
        links = await fetch_panel_links_public(server, email)
    return links


async def fetch_all_server_links(user_id: int) -> list[dict]:
    subs = await Subscription.filter(user_id=user_id, is_active=True).all()
    if not subs:
        return []

    async def fetch_one(sub: Subscription) -> Optional[dict]:
        server = await Server.get_or_none(id=sub.server_id)
        if not server or not sub.client_uuid:
            return None

        email = sub.client_email
        if not email:
            safe_name = server.name.replace(" ", "_").replace("/", "_")[:20]
            email = f"cwim_{safe_name}_{user_id}"

        links = await fetch_panel_links(server, email)
        tagged = [tag_link(lnk, server, sub.traffic_limit) for lnk in links]

        return {
            "server_id": server.id,
            "server_name": server.name,
            "server_flag": server.flag or "",
            "host": server.address or server.host,
            "port": server.sub_port or server.port or 443,
            "protocol": server.protocol,
            "client_uuid": sub.client_uuid,
            "is_online": server.is_online,
            "links": tagged,
        }

    results = await asyncio.gather(*[fetch_one(s) for s in subs], return_exceptions=True)

    valid = []
    for r in results:
        if isinstance(r, Exception):
            logger.warning("fetch_one failed: %s", r)
            continue
        if r and r.get("links"):
            valid.append(r)
    return valid


@router.get("/{user_uuid}")
async def public_subscription(user_uuid: str, format: Optional[str] = "base64"):
    user = await User.get_or_none(uuid=user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    servers_data = await fetch_all_server_links(user.id)
    if not servers_data:
        raise HTTPException(status_code=404, detail="No configs available")

    all_links = []
    total_down = 0
    total_up = 0
    total_limit = 0
    max_expire = 0

    for sd in servers_data:
        all_links.extend(sd["links"])

    subs = await Subscription.filter(user_id=user.id, is_active=True).all()
    for s in subs:
        total_down += s.traffic_down or 0
        total_up += s.traffic_up or 0
        total_limit += s.traffic_limit or 0
        if s.expires_at:
            ts = int(s.expires_at.timestamp())
            if ts > max_expire:
                max_expire = ts

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
