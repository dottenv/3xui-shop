import uuid as uuid_lib
import base64
import os
import time
import logging
from typing import Optional
import httpx

logger = logging.getLogger("xui")

INBOUND_DEFAULTS = {
    "enable": True,
    "listen": "",
    "expiryTime": 0,
    "total": 0,
    "trafficReset": "never",
    "settings": {
        "clients": [],
        "decryption": "none",
        "fallbacks": [],
    },
    "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
            "show": False,
            "dest": "www.microsoft.com:443",
            "serverNames": ["www.microsoft.com"],
            "privateKey": "",
            "shortIds": ["6ba85179e30d4fc2"],
            "spiderX": "/",
        },
    },
    "sniffing": {
        "enabled": True,
        "destOverride": ["http", "tls", "quic"],
    },
}


class XuiClient:
    def __init__(self, base_url: str,
                 username: str = "", password: str = "",
                 api_token: str = "", verify_ssl: bool = False,
                 timeout: float = 15.0):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.api_token = api_token
        self.verify_ssl = verify_ssl
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is not None:
            return self._client

        headers = {
            "Accept": "application/json",
        }
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            verify=self.verify_ssl,
            timeout=self._timeout,
        )

        if not self.api_token and self.username and self.password:
            resp = await self._client.post("/login", json={
                "username": self.username,
                "password": self.password,
            }, timeout=self._timeout)
            resp.raise_for_status()
            data = resp.json()
            if not data.get("success"):
                logger.warning("3x-ui login returned success=false: %s", data.get("msg"))
            # Cookies are stored automatically by httpx

        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _api_get(self, path: str):
        c = await self._get_client()
        r = await c.get(path, timeout=self._timeout)
        r.raise_for_status()
        return r.json()

    async def _api_post(self, path: str, json_data: dict = None):
        c = await self._get_client()
        r = await c.post(path, json=json_data or {}, timeout=self._timeout)
        r.raise_for_status()
        return r.json()

    async def _api_delete(self, path: str):
        c = await self._get_client()
        r = await c.delete(path, timeout=self._timeout)
        r.raise_for_status()
        return r.json()

    def _check(self, data: dict) -> bool:
        return data.get("success", False)

    # ─── Inbounds ───────────────────────────────────────────

    async def add_inbound(self, inbound_data: dict) -> dict:
        return await self._api_post("/panel/api/inbounds/add", inbound_data)

    async def get_inbounds(self) -> list:
        data = await self._api_get("/panel/api/inbounds/list")
        obj = data.get("obj", [])
        return obj if isinstance(obj, list) else []

    async def get_inbound(self, inbound_id: int) -> Optional[dict]:
        data = await self._api_get(f"/panel/api/inbounds/get/{inbound_id}")
        return data.get("obj")

    async def get_inbounds_options(self) -> list:
        data = await self._api_get("/panel/api/inbounds/options")
        return data.get("obj", [])

    async def get_fallbacks(self, inbound_id: int) -> list:
        data = await self._api_get(f"/panel/api/inbounds/{inbound_id}/fallbacks")
        return data.get("obj", [])

    async def update_fallbacks(self, inbound_id: int, fallbacks: list) -> dict:
        return await self._api_post(
            f"/panel/api/inbounds/{inbound_id}/fallbacks",
            {"fallbacks": fallbacks},
        )

    async def reset_inbound_traffic(self, inbound_id: int) -> dict:
        return await self._api_post(f"/panel/api/inbounds/{inbound_id}/resetTraffic")

    async def delete_inbound_all_clients(self, inbound_id: int) -> dict:
        return await self._api_post(f"/panel/api/inbounds/{inbound_id}/delAllClients")

    async def update_inbound(self, inbound_id: int, inbound_data: dict) -> dict:
        return await self._api_post(f"/panel/api/inbounds/update/{inbound_id}", inbound_data)

    # ─── Clients ────────────────────────────────────────────

    async def add_client(self, inbound_ids: list[int],
                         email: str,
                         client_id: str = "",
                         traffic_limit_bytes: int = 0,
                         expiry_time_ms: int = 0,
                         tg_id: int = 0,
                         limit_ip: int = 0,
                         flow: str = "",
                         sub_id: str = "",
                         enable: bool = True) -> dict:
        now_ts = int(time.time())
        payload = {
            "client": {
                "email": email,
                "totalGB": traffic_limit_bytes,
                "expiryTime": expiry_time_ms,
                "tgId": tg_id,
                "limitIp": limit_ip,
                "enable": enable,
            },
            "inboundIds": inbound_ids,
        }
        if client_id:
            payload["client"]["id"] = client_id
        if flow:
            payload["client"]["flow"] = flow
        if sub_id:
            payload["client"]["subId"] = sub_id
        return await self._api_post("/panel/api/clients/add", payload)

    async def update_client(self, email: str,
                            traffic_limit_bytes: int = 0,
                            expiry_time_ms: int = 0,
                            tg_id: int = 0,
                            limit_ip: int = 0,
                            flow: str = "",
                            enable: bool = True) -> dict:
        payload = {
            "email": email,
            "totalGB": traffic_limit_bytes,
            "expiryTime": expiry_time_ms,
            "tgId": tg_id,
            "limitIp": limit_ip,
            "enable": enable,
        }
        if flow:
            payload["flow"] = flow
        return await self._api_post(f"/panel/api/clients/update/{email}", payload)

    async def delete_client(self, email: str) -> dict:
        return await self._api_post(f"/panel/api/clients/del/{email}")

    async def get_client_traffic(self, email: str) -> Optional[dict]:
        data = await self._api_get(f"/panel/api/clients/traffic/{email}")
        return data.get("obj")

    async def get_client_links(self, email: str) -> list:
        data = await self._api_get(f"/panel/api/clients/links/{email}")
        obj = data.get("obj", [])
        if isinstance(obj, list):
            return obj
        if isinstance(obj, dict):
            link = obj.get("link", "")
            return [link] if link else []
        if isinstance(obj, str):
            return self._decode_links(obj)
        return []

    async def get_sub_links(self, sub_id: str) -> list:
        data = await self._api_get(f"/panel/api/clients/subLinks/{sub_id}")
        obj = data.get("obj", [])
        if isinstance(obj, list):
            return obj
        if isinstance(obj, dict):
            link = obj.get("link", "")
            return [link] if link else []
        if isinstance(obj, str):
            return self._decode_links(obj)
        return []

    async def get_clients(self) -> list:
        data = await self._api_get("/panel/api/clients/list")
        return data.get("obj", [])

    async def get_client_by_email(self, email: str) -> Optional[dict]:
        clients = await self.get_clients()
        for c in clients:
            if c.get("email") == email:
                return c
        return None

    async def get_online_clients(self) -> list:
        data = await self._api_post("/panel/api/clients/onlines")
        return data.get("obj", [])

    async def clean_depleted(self) -> dict:
        return await self._api_post("/panel/api/clients/delDepleted")

    def _decode_links(self, raw: str) -> list:
        try:
            decoded = base64.b64decode(raw).decode()
            return [line.strip() for line in decoded.split("\n") if line.strip()]
        except Exception:
            return [raw.strip()] if raw.strip() else []

    # ─── Server ─────────────────────────────────────────────

    async def get_server_status(self) -> dict:
        data = await self._api_get("/panel/api/server/status")
        return data.get("obj", {})

    async def get_db_backup(self) -> bytes:
        c = await self._get_client()
        r = await c.get("/panel/api/server/getDb", timeout=self._timeout)
        r.raise_for_status()
        return r.content

    async def get_new_uuid(self) -> str:
        data = await self._api_get("/panel/api/server/getNewUUID")
        return data.get("obj", "")

    async def get_xray_version(self) -> list:
        data = await self._api_get("/panel/api/server/getXrayVersion")
        return data.get("obj", [])

    async def restart_xray(self) -> dict:
        return await self._api_post("/panel/api/server/restartXrayService")

    async def stop_xray(self) -> dict:
        return await self._api_post("/panel/api/server/stopXrayService")

    async def test_connection(self) -> bool:
        try:
            await self.get_inbounds()
            return True
        except Exception as e:
            logger.warning("Connection test failed: %s", e)
            return False


class XuiService:
    def __init__(self, base_url: str, username: str = "", password: str = "",
                 api_token: str = ""):
        self._client = XuiClient(
            base_url=base_url,
            username=username, password=password,
            api_token=api_token,
        )

    async def close(self):
        await self._client.close()

    async def add_client(self, inbound_id: int, email: str, client_uuid: str,
                         traffic_limit_gb: int = 0, expire_days: int = 30,
                         flow: str = "xtls-rprx-vision") -> dict:
        now_ts = int(time.time())
        expiry_ms = int((now_ts + expire_days * 86400) * 1000) if expire_days > 0 else 0
        traffic_bytes = traffic_limit_gb * 1024 * 1024 * 1024 if traffic_limit_gb > 0 else 0
        return await self._client.add_client(
            inbound_ids=[inbound_id],
            email=email,
            client_id=client_uuid,
            traffic_limit_bytes=traffic_bytes,
            expiry_time_ms=expiry_ms,
            flow=flow,
            sub_id=email,
            limit_ip=0,
            enable=True,
        )

    async def delete_client(self, inbound_id: int, client_uuid: str) -> bool:
        from app.core.models import Subscription
        sub = await Subscription.filter(client_uuid=client_uuid).first()
        email = f"u{sub.user_id}_{sub.server_id}" if sub else client_uuid
        result = await self._client.delete_client(email=email)
        return result.get("success", False)

    async def get_client_traffic(self, client_uuid: str) -> Optional[dict]:
        from app.core.models import Subscription
        sub = await Subscription.filter(client_uuid=client_uuid).first()
        if not sub:
            return None
        return await self._client.get_client_traffic(email=sub.client_email)

    async def add_inbound(self, inbound_data: dict) -> dict:
        return await self._client.add_inbound(inbound_data)

    async def get_inbounds(self) -> list:
        return await self._client.get_inbounds()

    async def get_inbound(self, inbound_id: int) -> Optional[dict]:
        return await self._client.get_inbound(inbound_id)

    async def get_online_clients(self) -> list:
        return await self._client.get_online_clients()

    async def get_server_status(self) -> dict:
        return await self._client.get_server_status()

    async def clean_depleted(self, inbound_id: int) -> dict:
        return await self._client.clean_depleted()

    async def test_connection(self) -> bool:
        return await self._client.test_connection()

    async def get_inbounds_options(self) -> list:
        return await self._client.get_inbounds_options()

    async def restart_xray(self) -> dict:
        return await self._client.restart_xray()

    async def get_new_uuid(self) -> str:
        return await self._client.get_new_uuid()

    async def get_db_backup(self) -> bytes:
        return await self._client.get_db_backup()

    async def get_clients(self) -> list:
        return await self._client.get_clients()

    async def get_client_by_email(self, email: str) -> Optional[dict]:
        return await self._client.get_client_by_email(email)

    async def get_client_links(self, email: str) -> list:
        return await self._client.get_client_links(email)

    async def get_sub_links(self, sub_id: str) -> list:
        return await self._client.get_sub_links(sub_id)


def get_panel_base_url(server) -> str:
    url = (server.xui_url or f"https://{server.host}:{server.port}").rstrip("/")
    if not url.startswith("http"):
        url = f"https://{url}"
    return url


def generate_uuid() -> str:
    return str(uuid_lib.uuid4())


def generate_reality_keys():
    try:
        from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
        from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption
        key = X25519PrivateKey.generate()
        private_raw = key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        public_raw = key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    except ImportError:
        private_raw = os.urandom(32)
        public_raw = b""
    return base64.b64encode(private_raw).decode(), base64.b64encode(public_raw).decode()


def build_base_url(host: str, port: int = 443, xui_url: str = "") -> str:
    if xui_url:
        url = xui_url.strip()
        if not url.startswith("http"):
            url = f"https://{url}"
        return url.rstrip("/")
    if not host.startswith("http"):
        return f"https://{host}:{port}"
    return host.rstrip("/")


def make_inbound_payload(server_name: str, port: int,
                         protocol: str = "vless",
                         sni: str = "www.microsoft.com",
                         private_key: str = "",
                         short_ids: list[str] | None = None) -> dict:
    ids = short_ids or ["6ba85179e30d4fc2"]
    payload = dict(INBOUND_DEFAULTS)
    payload["remark"] = f"{server_name}-{port}"
    payload["port"] = port
    payload["protocol"] = protocol
    payload["streamSettings"]["realitySettings"]["dest"] = f"{sni}:443"
    payload["streamSettings"]["realitySettings"]["serverNames"] = [sni]
    payload["streamSettings"]["realitySettings"]["privateKey"] = private_key
    payload["streamSettings"]["realitySettings"]["shortIds"] = ids
    return payload
