from tortoise import fields
from tortoise.models import Model
import uuid
from datetime import datetime


class Promocode(Model):
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=50, unique=True)

    duration_days = fields.IntField(default=30)
    max_uses = fields.IntField(default=1)
    current_uses = fields.IntField(default=0)

    is_active = fields.BooleanField(default=True)
    expires_at = fields.DatetimeField(null=True)

    created_at = fields.DatetimeField(default=datetime.utcnow)

    class Meta:
        table = "promocodes"

    def __str__(self):
        return f"Promo {self.code}: {self.duration_days} days"

    @property
    def is_valid(self):
        if not self.is_active:
            return False
        if self.current_uses >= self.max_uses:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
