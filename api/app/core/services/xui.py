import uuid as uuid_lib
from typing import Optional
import httpx


class XuiClient:
    """HTTP-клиент для 3X-UI Panel API v3.x.
    Поддерживает два режима аутентификации:
    - Bearer token (новый, из Settings → Security → API Token)
    - Login + password (сессионная cookie, старый)
    """

    def __init__(self, host: str, port: int = 443,
                 username: str = "", password: str = "",
                 api_token: str = "", verify_ssl: bool = False):
        self.base_url = f"https://{host}:{port}"
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
            return self._client

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            verify=self.verify_ssl,
            timeout=30,
        )
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

    async def add_inbound(self, payload: dict) -> dict:
        return await self._api_post("/panel/api/inbounds/add", payload)

    async def update_inbound(self, inbound_id: int, payload: dict) -> dict:
        return await self._api_post(f"/panel/api/inbounds/update/{inbound_id}", payload)

    async def delete_inbound(self, inbound_id: int) -> dict:
        return await self._api_post(f"/panel/api/inbounds/del/{inbound_id}")

    async def set_inbound_enable(self, inbound_id: int, enable: bool) -> dict:
        return await self._api_post(f"/panel/api/inbounds/setEnable/{inbound_id}", {"enable": enable})

    async def reset_inbound_traffic(self, inbound_id: int) -> dict:
        return await self._api_post(f"/panel/api/inbounds/{inbound_id}/resetTraffic")

    async def delete_inbound_all_clients(self, inbound_id: int) -> dict:
        return await self._api_post(f"/panel/api/inbounds/{inbound_id}/delAllClients")

    async def get_fallbacks(self, inbound_id: int) -> list:
        data = await self._api_get(f"/panel/api/inbounds/{inbound_id}/fallbacks")
        return data.get("obj", [])

    async def update_fallbacks(self, inbound_id: int, fallbacks: list) -> dict:
        return await self._api_post(f"/panel/api/inbounds/{inbound_id}/fallbacks", {"fallbacks": fallbacks})

    # ─── Clients (first-class, new OpenAPI) ─────────────────

    async def add_client(self, inbound_id: int, email: str, client_uuid: str,
                         traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        payload = {
            "id": client_uuid,
            "inboundId": inbound_id,
            "email": email,
            "enable": True,
            "expiryTime": expiry * 1000,
            "totalGB": traffic_limit_gb * 1024 * 1024 * 1024,
            "limitIp": 0,
        }
        await self._api_post("/panel/api/clients/add", payload)
        return True

    async def update_client(self, client_uuid: str, email: str, enable: bool = True,
                            traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        payload = {
            "id": client_uuid,
            "email": email,
            "enable": enable,
            "expiryTime": expiry * 1000,
            "totalGB": traffic_limit_gb * 1024 * 1024 * 1024,
            "limitIp": 0,
        }
        await self._api_post("/panel/api/clients/update", payload)
        return True

    async def delete_client(self, inbound_id: int, client_uuid: str) -> bool:
        await self._api_post("/panel/api/clients/del", {
            "inboundId": inbound_id,
            "clientId": client_uuid,
        })
        return True

    async def get_client_traffic(self, client_uuid: str) -> Optional[dict]:
        inbounds = await self.get_inbounds()
        for inbound in inbounds:
            for c in inbound.get("clientStats", []):
                if c.get("id") == client_uuid:
                    return c
        return None

    async def get_online_clients(self) -> list:
        data = await self._api_get("/panel/api/clients/online")
        return data.get("obj", [])

    async def clean_depleted(self, inbound_id: int) -> bool:
        stats = await self.get_inbounds()
        for inbound in stats:
            if inbound.get("id") == inbound_id:
                emails = [c["email"] for c in inbound.get("clientStats", [])
                          if c.get("total", 0) > 0 and c.get("up", 0) + c.get("down", 0) >= c.get("total", 0)]
                if emails:
                    await self._api_post("/panel/api/clients/del", {
                        "inboundId": inbound_id,
                        "emails": emails,
                    })
                return True
        return False

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
    """Обёртка для обратной совместимости.
    Использует XuiClient внутри, принимает те же аргументы что и раньше,
    но дополнительно поддерживает api_token.
    """

    def __init__(self, host: str, username: str = "", password: str = "",
                 port: int = 443, api_token: str = ""):
        self._client = XuiClient(
            host=host, port=port,
            username=username, password=password,
            api_token=api_token,
        )

    async def _ensure_api(self):
        return self._client

    async def close(self):
        await self._client.close()

    async def add_client(self, inbound_id: int, email: str, client_uuid: str,
                         traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        return await self._client.add_client(inbound_id, email, client_uuid,
                                              traffic_limit_gb, expire_days)

    async def update_client(self, client_uuid: str, email: str, enable: bool = True,
                            traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        return await self._client.update_client(client_uuid, email, enable,
                                                 traffic_limit_gb, expire_days)

    async def delete_client(self, inbound_id: int, client_uuid: str) -> bool:
        return await self._client.delete_client(inbound_id, client_uuid)

    async def get_client_traffic(self, client_uuid: str) -> Optional[dict]:
        return await self._client.get_client_traffic(client_uuid)

    async def get_inbounds(self) -> list:
        return await self._client.get_inbounds()

    async def get_inbound(self, inbound_id: int) -> Optional[dict]:
        return await self._client.get_inbound(inbound_id)

    async def get_online_clients(self) -> list:
        return await self._client.get_online_clients()

    async def clean_depleted(self, inbound_id: int) -> bool:
        return await self._client.clean_depleted(inbound_id)

    async def test_connection(self) -> bool:
        return await self._client.test_connection()

    # ─── Новые методы из OpenAPI v3.x ─────────────────────

    async def get_inbounds_options(self) -> list:
        return await self._client.get_inbounds_options()

    async def restart_xray(self) -> dict:
        return await self._client.restart_xray()

    async def get_new_uuid(self) -> str:
        return await self._client.get_new_uuid()

    async def get_db_backup(self) -> bytes:
        return await self._client.get_db_backup()


def generate_uuid() -> str:
    return str(uuid_lib.uuid4())
