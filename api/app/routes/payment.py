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


class PaymentResponse(BaseModel):
    payment_id: str
    amount: float
    currency: str
    status: str
    redirect_url: Optional[str] = None


PLANS = {
    "start": {"price": 250, "devices": 1, "duration_days": 30},
    "optimal": {"price": 500, "devices": 3, "duration_days": 30},
    "maximum": {"price": 750, "devices": 5, "duration_days": 30},
}


async def issue_subscription(txn: Transaction, user: User, plan_id: str) -> Optional[Subscription]:
    plan = PLANS.get(plan_id)
    if not plan:
        plan = {"devices": 1, "duration_days": 30}

    active = await Server.filter(is_active=True).all()
    if not active:
        return None
    server = random.choice(active)
    if not server:
        return None

    now = datetime.now(timezone.utc)
    duration = plan["duration_days"]
    expires_at = now + timedelta(days=duration)
    email_tag = f"u{user.id}_{server.id}"
    traffic_limit_gb = 50

    xui = XuiService(
        base_url=build_base_url(server.host, server.port, server.xui_url),
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        await xui.add_client(
            inbound_id=server.inbound_id,
            email=email_tag,
            client_uuid="",
            traffic_limit_gb=traffic_limit_gb,
            expire_days=duration,
        )
        real_client = await xui.get_client_by_email(email_tag)
        xui_uuid = (real_client or {}).get("uuid", "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XUI error: {str(e)}")
    finally:
        await xui.close()

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
    return sub


@router.get("/plans")
async def get_plans():
    return PLANS


@router.post("/create", response_model=PaymentResponse)
async def create_payment(body: CreatePaymentRequest,
                         background_tasks: BackgroundTasks,
                         user: User = Depends(get_current_user)):
    plan = PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    payment_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    status = "completed" if body.payment_gateway == "mock" else "pending"
    txn = await Transaction.create(
        uuid=payment_id,
        user_id=user.id,
        payment_gateway=body.payment_gateway,
        amount=plan["price"],
        currency="RUB",
        devices=plan["devices"],
        duration_days=plan["duration_days"],
        status=status,
        paid_at=now if status == "completed" else None,
    )

    if body.payment_gateway == "mock":
        try:
            await issue_subscription(txn, user, body.plan_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to issue subscription: {str(e)}")

    return PaymentResponse(
        payment_id=str(payment_id),
        amount=float(plan["price"]),
        currency="RUB",
        status=txn.status,
        redirect_url=None,
    )


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
