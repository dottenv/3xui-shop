from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import random

from app.core.models import User, Transaction, Subscription, Server
from app.core.deps import get_current_user
from app.core.services.xui import XuiService, build_base_url

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


async def issue_subscription(user: User, plan_id: str) -> Subscription:
    plan = PLANS.get(plan_id)
    if not plan:
        plan = {"devices": 1, "duration_days": 30}

    active = await Server.filter(is_active=True).all()
    if not active:
        raise HTTPException(status_code=503, detail="Нет доступных серверов")
    server = random.choice(active)

    # Check multiple subs rule: only dedicated servers allow multiple subscriptions
    if not server.is_dedicated:
        existing_active = await Subscription.filter(user_id=user.id, is_active=True).first()
        if existing_active:
            raise HTTPException(
                status_code=400,
                detail="У вас уже есть активная подписка. Отзовите её в поддержке перед покупкой новой, или выберите выделенный сервер.",
            )

    now = datetime.now(timezone.utc)
    duration = plan["duration_days"]
    expires_at = now + timedelta(days=duration)
    safe_name = server.name.replace(" ", "_").replace("/", "_")[:20]
    email_tag = f"cwim_{safe_name}_{user.id}"
    traffic_limit_gb = 50

    # Create XUI client (delete existing client with same email first if any)
    xui = XuiService(
        base_url=build_base_url(server.host, server.port, server.xui_url),
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        existing = await xui.get_client_by_email(email_tag)
        if existing:
            await xui._client.delete_client(email=email_tag)
        resp = await xui.add_client(
            inbound_id=server.inbound_id,
            email=email_tag,
            client_uuid="",
            traffic_limit_gb=traffic_limit_gb,
            expire_days=duration,
        )
        real_client = await xui.get_client_by_email(email_tag)
        xui_uuid = (real_client or {}).get("uuid", "")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка 3X-UI: {str(e)}")
    finally:
        await xui.close()

    if not xui_uuid:
        raise HTTPException(status_code=500, detail="3X-UI не вернул UUID клиента")

    sub = await Subscription.create(
        user_id=user.id,
        plan_id=plan_id,
        server_id=server.id,
        client_uuid=xui_uuid,
        devices=plan["devices"],
        duration_days=duration,
        traffic_limit=traffic_limit_gb * 1024 * 1024 * 1024,
        starts_at=now,
        expires_at=expires_at,
    )

    # Update server client count
    server.current_clients += 1
    await server.save()

    return sub


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

    # Reserve funds
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
        sub = await issue_subscription(user, body.plan_id)
        await Transaction.filter(id=txn.id).update(
            status="completed",
            paid_at=datetime.now(timezone.utc),
        )
        server = await Server.get_or_none(id=sub.server_id)

        return PaymentResponse(
            payment_id=str(payment_id),
            amount=price,
            currency="RUB",
            status="completed",
            sub_id=sub.id,
            sub_uuid=sub.client_uuid,
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
