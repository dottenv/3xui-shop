import asyncio
import logging
from app.core.models import Server
from app.core.services.xui import XuiService, build_base_url

logger = logging.getLogger("server_health")

POLL_INTERVAL = 60  # seconds


async def check_server(server: Server):
    try:
        xui = XuiService(
            base_url=build_base_url(server.host, server.port, server.xui_url),
            username=server.xui_username,
            password=server.xui_password,
            api_token=server.xui_api_token,
        )
        online = await xui.test_connection()
        clients_count = 0
        if online:
            try:
                all_clients = await xui.get_clients()
                clients_count = len(all_clients)
            except Exception:
                pass
        await xui.close()

        await Server.filter(id=server.id).update(
            is_online=online,
            current_clients=clients_count,
        )
        return online
    except Exception as e:
        logger.warning("Health check failed for server %d: %s", server.id, e)
        await Server.filter(id=server.id).update(is_online=False)
        return False


async def health_loop():
    while True:
        try:
            servers = await Server.all()
            for srv in servers:
                await check_server(srv)
            logger.info("Health check: %d servers checked", len(servers))
        except Exception as e:
            logger.error("Health check cycle error: %s", e)
        await asyncio.sleep(POLL_INTERVAL)


def start_health_checker():
    asyncio.create_task(health_loop())
