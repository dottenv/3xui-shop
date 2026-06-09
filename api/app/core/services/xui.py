import uuid as uuid_lib
import base64
import os
import time
import logging
from typing import Optional
import httpx

logger = logging.getLogger("xui")


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
        headers = {"Accept": "application/json"}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        self._client = httpx.AsyncClient(
            base_url=self.base_url, headers=headers,
            verify=self.verify_ssl, timeout=self._timeout,
        )
        if not self.api_token and self.username and self.password:
            resp = await self._client.post("/login", json={
                "username": self.username, "password": self.password,
            })
            resp.raise_for_status()
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _api_get(self, path: str):
        c = await self._get_client()
        r = await c.get(path)
        r.raise_for_status()
        return r.json()

    async def _api_post(self, path: str, json_data: dict = None):
        c = await self._get_client()
        r = await c.post(path, json=json_data or {})
        r.raise_for_status()
        return r.json()

    # ─── Inbounds ───────────────────────────────────────────

    async def get_inbounds(self) -> list:
        data = await self._api_get("/panel/api/inbounds/list")
        obj = data.get("obj", [])
        return obj if isinstance(obj, list) else []

    async def add_inbound(self, data: dict) -> dict:
        return await self._api_post("/panel/api/inbounds/add", data)

    # ─── Clients ────────────────────────────────────────────

    async def add_client(self, inbound_id: int, email: str,
                         client_id: str = "",
                         total_gb: int = 0,
                         expiry_time: int = 0,
                         flow: str = "",
                         sub_id: str = "",
                         limit_ip: int = 0,
                         tg_id: int = 0) -> dict:
        payload = {
            "client": {
                "email": email,
                "totalGB": total_gb,
                "expiryTime": expiry_time,
                "tgId": tg_id,
                "limitIp": limit_ip,
                "enable": True,
            },
            "inboundIds": [inbound_id],
        }
        if client_id:
            payload["client"]["id"] = client_id
        if flow:
            payload["client"]["flow"] = flow
        if sub_id:
            payload["client"]["subId"] = sub_id
        return await self._api_post("/panel/api/clients/add", payload)

    async def delete_client(self, email: str) -> dict:
        return await self._api_post(f"/panel/api/clients/del/{email}")

    async def get_client_links(self, email: str) -> list:
        data = await self._api_get(f"/panel/api/clients/links/{email}")
        obj = data.get("obj", [])
        if isinstance(obj, list):
            return obj
        if isinstance(obj, dict):
            link = obj.get("link", "")
            return [link] if link else []
        if isinstance(obj, str):
            return self._decode_b64_links(obj)
        return []

    async def get_client_by_email(self, email: str) -> Optional[dict]:
        clients = await self.get_clients()
        for c in clients:
            if c.get("email") == email:
                return c
        return None

    async def get_clients(self) -> list:
        data = await self._api_get("/panel/api/clients/list")
        obj = data.get("obj", [])
        return obj if isinstance(obj, list) else []

    async def clean_depleted(self) -> dict:
        return await self._api_post("/panel/api/clients/delDepleted")

    async def restart_xray(self) -> dict:
        return await self._api_post("/panel/api/server/restartXrayService")

    async def test_connection(self) -> bool:
        try:
            await self.get_inbounds()
            return True
        except Exception as e:
            logger.warning("Connection test failed: %s", e)
            return False

    def _decode_b64_links(self, raw: str) -> list:
        try:
            decoded = base64.b64decode(raw).decode()
            return [line.strip() for line in decoded.split("\n") if line.strip()]
        except Exception:
            return [raw.strip()] if raw.strip() else []


# ─── Helpers ────────────────────────────────────────────────

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


def build_panel_url(host: str, port: int = 443, xui_url: str = "") -> str:
    if xui_url:
        url = xui_url.strip()
        if not url.startswith("http"):
            url = f"https://{url}"
        return url.rstrip("/")
    if not host.startswith("http"):
        return f"https://{host}:{port}"
    return host.rstrip("/")


def make_inbound_payload(name: str, port: int,
                         protocol: str = "vless",
                         sni: str = "www.microsoft.com",
                         private_key: str = "",
                         short_ids: list[str] | None = None) -> dict:
    ids = short_ids or ["6ba85179e30d4fc2"]
    return {
        "enable": True,
        "remark": f"{name}-{port}",
        "listen": "",
        "port": port,
        "protocol": protocol,
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
                "dest": f"{sni}:443",
                "serverNames": [sni],
                "privateKey": private_key,
                "shortIds": ids,
                "spiderX": "/",
            },
        },
        "sniffing": {
            "enabled": True,
            "destOverride": ["http", "tls", "quic"],
        },
    }
