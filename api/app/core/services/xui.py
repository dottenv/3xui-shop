import uuid as uuid_lib
from typing import Optional
import httpx


class XuiClient:
    """HTTP-клиент для 3X-UI Panel API v3.x.
    Аутентификация:
      - Bearer token (Settings → Security → API Token) — приоритет
      - Login + password (сессионная cookie) — fallback если токен не указан

    base_url = полный URL панели, например:
      https://host:port
      https://host:port/custom-path
    """

    def __init__(self, base_url: str,
                 username: str = "", password: str = "",
                 api_token: str = "", verify_ssl: bool = False):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.api_token = api_token
        self.verify_ssl = verify_ssl
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is not None:
            return self._client

        headers = {}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            verify=self.verify_ssl,
            timeout=30,
        )

        if not self.api_token and self.username and self.password:
            resp = await self._client.post("/login", json={
                "username": self.username,
                "password": self.password,
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
        return data.get("obj", [])

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

    # ─── Clients (first-class, OpenAPI v3.x) ────────────────

    async def add_client(self, inbound_ids: list[int],
                         email: str,
                         traffic_limit_gb: int = 0,
                         expire_days: int = 30,
                         tg_id: int = 0,
                         limit_ip: int = 0) -> bool:
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        payload = {
            "client": {
                "email": email,
                "totalGB": traffic_limit_gb * 1024 * 1024 * 1024,
                "expiryTime": expiry * 1000,
                "tgId": tg_id,
                "limitIp": limit_ip,
                "enable": True,
            },
            "inboundIds": inbound_ids,
        }
        await self._api_post("/panel/api/clients/add", payload)
        return True

    async def update_client(self, email: str,
                            traffic_limit_gb: int = 0,
                            expire_days: int = 30,
                            tg_id: int = 0,
                            enable: bool = True) -> bool:
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        payload = {
            "email": email,
            "totalGB": traffic_limit_gb * 1024 * 1024 * 1024,
            "expiryTime": expiry * 1000,
            "tgId": tg_id,
            "enable": enable,
        }
        await self._api_post(f"/panel/api/clients/update/{email}", payload)
        return True

    async def delete_client(self, email: str, keep_traffic: bool = False) -> bool:
        params = "?keepTraffic=1" if keep_traffic else ""
        await self._api_post(f"/panel/api/clients/del/{email}{params}")
        return True

    async def get_client_traffic(self, email: str) -> Optional[dict]:
        data = await self._api_get(f"/panel/api/clients/traffic/{email}")
        return data.get("obj")

    async def get_client_links(self, email: str) -> list:
        data = await self._api_get(f"/panel/api/clients/links/{email}")
        return data.get("obj", [])

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

    async def clean_depleted(self) -> bool:
        await self._api_post("/panel/api/clients/delDepleted")
        return True

    # ─── Server ─────────────────────────────────────────────

    async def get_server_status(self) -> dict:
        data = await self._api_get("/panel/api/server/status")
        return data.get("obj", {})

    async def get_db_backup(self) -> bytes:
        c = await self._get_client()
        r = await c.get("/panel/api/server/getDb")
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
        except Exception:
            return False


class XuiService:
    """Обёртка для обратной совместимости."""

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
                         traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        return await self._client.add_client(
            inbound_ids=[inbound_id],
            email=email,
            traffic_limit_gb=traffic_limit_gb,
            expire_days=expire_days,
        )

    async def update_client(self, client_uuid: str, email: str, enable: bool = True,
                            traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        return await self._client.update_client(
            email=email,
            traffic_limit_gb=traffic_limit_gb,
            expire_days=expire_days,
            enable=enable,
        )

    async def delete_client(self, inbound_id: int, client_uuid: str) -> bool:
        from app.core.models import Subscription
        sub = await Subscription.filter(client_uuid=client_uuid).first()
        email = f"u{sub.user_id}_{sub.server_id}" if sub else client_uuid
        return await self._client.delete_client(email=email)

    async def get_client_traffic(self, client_uuid: str) -> Optional[dict]:
        from app.core.models import Subscription
        sub = await Subscription.filter(client_uuid=client_uuid).first()
        if not sub:
            return None
        return await self._client.get_client_traffic(email=f"u{sub.user_id}_{sub.server_id}")

    async def get_inbounds(self) -> list:
        return await self._client.get_inbounds()

    async def get_inbound(self, inbound_id: int) -> Optional[dict]:
        return await self._client.get_inbound(inbound_id)

    async def get_online_clients(self) -> list:
        return await self._client.get_online_clients()

    async def get_server_status(self) -> dict:
        return await self._client.get_server_status()

    async def clean_depleted(self, inbound_id: int) -> bool:
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


def generate_uuid() -> str:
    return str(uuid_lib.uuid4())


def build_base_url(host: str, port: int = 443, xui_url: str = "") -> str:
    """Собирает base_url для XuiClient из полей сервера.
    Приоритет: xui_url > host:port
    """
    if xui_url:
        url = xui_url.strip()
        if not url.startswith("http"):
            url = f"https://{url}"
        return url.rstrip("/")
    if not host.startswith("http"):
        return f"https://{host}:{port}"
    return host.rstrip("/")
