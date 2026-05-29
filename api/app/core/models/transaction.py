from tortoise import fields
from tortoise.models import Model
import uuid
from datetime import datetime


class Transaction(Model):
    id = fields.IntField(pk=True)
    uuid = fields.UUIDField(default=uuid.uuid4, unique=True)

    user_id = fields.IntField(index=True)
    payment_gateway = fields.CharField(max_length=50)
    external_id = fields.CharField(max_length=255, null=True)

    amount = fields.DecimalField(max_digits=10, decimal_places=2)
    currency = fields.CharField(max_length=3, default="RUB")

    devices = fields.IntField(default=1)
    duration_days = fields.IntField(default=30)

    status = fields.CharField(
        max_length=20,
        default="pending",
        choices=[
            "pending",
            "processing",
            "completed",
            "failed",
            "refunded",
        ],
    )

    promo_code = fields.CharField(max_length=50, null=True)
    referral_bonus = fields.BooleanField(default=False)

    created_at = fields.DatetimeField(default=datetime.utcnow)
    updated_at = fields.DatetimeField(auto_now=True)
    paid_at = fields.DatetimeField(null=True)

    class Meta:
        table = "transactions"

    def __str__(self):
        return f"Transaction {self.uuid}: {self.amount} {self.currency}"
