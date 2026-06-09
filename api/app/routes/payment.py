import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from app.core.models import User, Transaction, Subscription, Server
from app.core.deps import get_current_user
from app.core.services.xui import XuiClient, build_base_url, generate_uuid

logger = logging.getLogger("payment")
router = APIRouter()


class CreatePaymentRequest(BaseModel):
    plan_id: str = Field(..., max_length=50)
    payment_gateway: str = Field(default="mock")
    promo_code: Optional[str] = None


class TopUpRequest(BaseModel):
    amount: float = Field(..., gt=0)
    payment_gateway: str = Field(default="mock")


class PaymentResponse(BaseModel):
    payment_id: str
    amount: float
    currency: str
    status: str
    redirect_url: Optional[str] = None
    sub_id: Optional[int] = None
    sub_uuid: Optional[str] = None
    server_name: Optional[str] = None
    config_link: Optional[str] = None


PLANS = {
    "start": {"price": 250, "devices": 1, "duration_days": 30},
    "optimal": {"price": 500, "devices": 3, "duration_days": 30},
    "maximum": {"price": 750, "devices": 5, "duration_days": 30},
}


async def create_xui_client_on_server(server: Server, email: str, client_uuid: str,
                                      traffic_limit_gb: int, duration_days: int,
                                      flow: str = "xtls-rprx-vision") -> None:
    client = XuiClient(
        base_url=build_base_url(server.host, server.port, server.xui_url),
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
        timeout=15,
    )
    try:
        existing = await client.get_client_by_email(email)
        if existing:
            await client.delete_client(email)
        await client.add_client(
            inbound_ids=[server.inbound_id],
            email=email,
            client_id=client_uuid,
            traffic_limit_bytes=0,
            expiry_time_ms=int((datetime.now(timezone.utc).timestamp() + duration_days * 86400) * 1000),
            flow=flow,
            sub_id=email,
            limit_ip=0,
            enable=True,
        )
    finally:
        await client.close()


async def delete_remote_client(server: Server, email: str) -> None:
    client = XuiClient(
        base_url=build_base_url(server.host, server.port, server.xui_url),
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
        timeout=10,
    )
    try:
        await client.delete_client(email)
    except Exception:
        pass
    finally:
        await client.close()


async def issue_subscription(user: User, plan_id: str) -> list[Subscription]:
    plan = PLANS.get(plan_id)
    if not plan:
        plan = {"devices": 1, "duration_days": 30}

    servers = await Server.filter(is_active=True).all()
    if not servers:
        raise HTTPException(status_code=503, detail="Нет доступных серверов")

    existing_shared = await Subscription.filter(
        user_id=user.id, is_active=True
    ).all()
    for ex in existing_shared:
        srv = await Server.get_or_none(id=ex.server_id)
        if srv and not srv.is_dedicated:
            raise HTTPException(
                status_code=400,
                detail="У вас уже есть активная подписка на общий сервер. Отзовите её в поддержке.",
            )

    now = datetime.now(timezone.utc)
    duration = plan["duration_days"]
    expires_at = now + timedelta(days=duration)

    created_subs = []
    created_clients = []

    for server in servers:
        safe_name = server.name.replace(" ", "_").replace("/", "_")[:20]
        email_tag = f"cwim_{safe_name}_{user.id}"
        client_uuid = generate_uuid()
        flow = server.config_flow or "xtls-rprx-vision"

        try:
            await create_xui_client_on_server(
                server, email_tag, client_uuid,
                traffic_limit_gb=0, duration_days=duration, flow=flow,
            )

            sub = await Subscription.create(
                user_id=user.id,
                plan_id=plan_id,
                server_id=server.id,
                client_uuid=client_uuid,
                client_email=email_tag,
                devices=plan["devices"],
                duration_days=duration,
                traffic_limit=0,
                starts_at=now,
                expires_at=expires_at,
            )
            server.current_clients += 1
            await server.save()

            created_subs.append(sub)
            created_clients.append((server, email_tag))
        except Exception as e:
            logger.error("Failed to create client on server %s: %s", server.name, e)
            for srv, eml in created_clients:
                await delete_remote_client(srv, eml)
            for s in created_subs:
                await s.delete()
            raise HTTPException(
                status_code=502,
                detail=f"Ошибка создания на сервере {server.name}: {str(e)}"
            )

    if not created_subs:
        raise HTTPException(status_code=500, detail="Не удалось создать подписку ни на одном сервере")

    return created_subs


@router.get("/plans")
async def get_plans():
    return PLANS


@router.post("/top-up")
async def top_up_balance(body: TopUpRequest, user: User = Depends(get_current_user)):
    txn = await Transaction.create(
        uuid=uuid.uuid4(),
        user_id=user.id,
        payment_gateway=body.payment_gateway,
        amount=body.amount,
        currency="RUB",
        status="completed",
        paid_at=datetime.now(timezone.utc),
    )
    user.balance = float(user.balance) + body.amount
    await user.save()
    return {"success": True, "balance": float(user.balance), "transaction_id": txn.id}


@router.post("/create")
async def create_payment(body: CreatePaymentRequest,
                         user: User = Depends(get_current_user)):
    plan = PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Неверный тариф")

    price = plan["price"]
    balance = float(user.balance)
    if balance < price:
        raise HTTPException(status_code=402, detail=f"Недостаточно средств. Нужно: {price} ₽, баланс: {balance} ₽")

    payment_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    user.balance = round(balance - price, 2)
    await user.save()

    txn = await Transaction.create(
        uuid=payment_id,
        user_id=user.id,
        payment_gateway=body.payment_gateway,
        amount=price,
        currency="RUB",
        devices=plan["devices"],
        duration_days=plan["duration_days"],
        status="processing",
    )

    try:
        subs = await issue_subscription(user, body.plan_id)
        await Transaction.filter(id=txn.id).update(
            status="completed",
            paid_at=datetime.now(timezone.utc),
        )
        first = subs[0] if subs else None
        server = await Server.get_or_none(id=first.server_id) if first else None

        return PaymentResponse(
            payment_id=str(payment_id),
            amount=price,
            currency="RUB",
            status="completed",
            sub_id=first.id if first else None,
            sub_uuid=first.client_uuid if first else None,
            server_name=server.name if server else None,
            config_link=f"/config",
        )
    except HTTPException:
        user.balance = float(user.balance) + price
        await user.save()
        await Transaction.filter(id=txn.id).update(status="failed")
        raise
    except Exception as e:
        user.balance = float(user.balance) + price
        await user.save()
        await Transaction.filter(id=txn.id).update(status="failed")
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")


@router.get("/status/{payment_id}")
async def check_payment_status(payment_id: str, user: User = Depends(get_current_user)):
    txn = await Transaction.get_or_none(uuid=payment_id, user_id=user.id)
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "payment_id": payment_id,
        "status": txn.status,
        "amount": float(txn.amount),
        "currency": txn.currency,
        "paid_at": txn.paid_at.isoformat() if txn.paid_at else None,
    }


@router.get("/history")
async def payment_history(user: User = Depends(get_current_user)):
    txns = await Transaction.filter(user_id=user.id).order_by("-created_at").limit(50)
    return [
        {
            "id": t.id,
            "uuid": t.uuid,
            "amount": float(t.amount),
            "currency": t.currency,
            "status": t.status,
            "payment_gateway": t.payment_gateway,
            "created_at": t.created_at.isoformat(),
            "paid_at": t.paid_at.isoformat() if t.paid_at else None,
        }
        for t in txns
    ]
