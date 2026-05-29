from tortoise import fields
from tortoise.models import Model
from datetime import datetime


class IpWhitelist(Model):
    id = fields.IntField(pk=True)
    ip_address = fields.CharField(max_length=45)
    comment = fields.CharField(max_length=255, null=True)
    is_active = fields.BooleanField(default=True)
    created_by = fields.IntField(null=True)
    created_at = fields.DatetimeField(default=datetime.utcnow)

    class Meta:
        table = "ip_whitelist"

    def __str__(self):
        return f"{self.ip_address} ({self.comment or '—'})"
