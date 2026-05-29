from tortoise import fields
from tortoise.models import Model
from datetime import datetime


class Subscription(Model):
    id = fields.IntField(pk=True)
    user_id = fields.IntField(index=True)

    plan_id = fields.CharField(max_length=50)
    server_id = fields.IntField()
    client_uuid = fields.CharField(max_length=36, unique=True)

    devices = fields.IntField(default=1)
    duration_days = fields.IntField(default=30)

    traffic_up = fields.BigIntField(default=0)
    traffic_down = fields.BigIntField(default=0)
    traffic_limit = fields.BigIntField(default=0)

    starts_at = fields.DatetimeField()
    expires_at = fields.DatetimeField()

    is_active = fields.BooleanField(default=True)
    auto_renew = fields.BooleanField(default=False)

    created_at = fields.DatetimeField(default=datetime.utcnow)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "subscriptions"

    def __str__(self):
        return f"Sub {self.user_id} / {self.plan_id} / {self.server_id}"
