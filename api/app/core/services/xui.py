import uuid as uuid_lib
from typing import Optional

from py3xui import AsyncApi, Client, Inbound


class XuiService:
    def __init__(self, host: str, username: str, password: str, port: int = 443):
        self.host = host.rstrip("/")
        self.port = port
        self.username = username
        self.password = password
        self._api: Optional[AsyncApi] = None

    async def _ensure_api(self) -> AsyncApi:
        if self._api is None:
            url = f"https://{self.host}:{self.port}"
            self._api = AsyncApi(url, self.username, self.password)
            await self._api.login()
        return self._api

    async def close(self):
        self._api = None

    async def add_client(self, inbound_id: int, email: str, client_uuid: str,
                         traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        api = await self._ensure_api()
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        client = Client(
            id=client_uuid,
            email=email,
            enable=True,
            total_gb=traffic_limit_gb,
            expiry_time=expiry * 1000,
            limit_ip=0,
        )
        await api.client.add(inbound_id, [client])
        return True

    async def update_client(self, client_uuid: str, email: str, enable: bool = True,
                            traffic_limit_gb: int = 0, expire_days: int = 30) -> bool:
        api = await self._ensure_api()
        now = int(uuid_lib.uuid4().time)
        expiry = now + expire_days * 86400 if expire_days > 0 else 0
        client = Client(
            id=client_uuid,
            email=email,
            enable=enable,
            total_gb=traffic_limit_gb,
            expiry_time=expiry * 1000,
            limit_ip=0,
        )
        await api.client.update(client_uuid, client)
        return True

    async def delete_client(self, inbound_id: int, client_uuid: str) -> bool:
        api = await self._ensure_api()
        await api.client.delete(inbound_id, client_uuid)
        return True

    async def get_client_traffic(self, client_uuid: str) -> Optional[Client]:
        api = await self._ensure_api()
        results = await api.client.get_traffic_by_id(client_uuid)
        return results[0] if results else None

    async def get_inbounds(self) -> list[Inbound]:
        api = await self._ensure_api()
        return await api.inbound.get_list()

    async def get_inbound(self, inbound_id: int) -> Optional[Inbound]:
        api = await self._ensure_api()
        return await api.inbound.get_by_id(inbound_id)

    async def get_online_clients(self) -> list[str]:
        api = await self._ensure_api()
        return await api.client.online()

    async def get_server_status(self) -> dict:
        api = await self._ensure_api()
        return await api.server.get_status()

    async def test_connection(self) -> bool:
        try:
            await self._ensure_api()
            return True
        except Exception:
            return False


def generate_uuid() -> str:
    return str(uuid_lib.uuid4())
