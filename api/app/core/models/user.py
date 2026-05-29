from tortoise import fields
from tortoise.models import Model
import uuid
from datetime import datetime


class User(Model):
    id = fields.IntField(pk=True)
    uuid = fields.UUIDField(default=uuid.uuid4, unique=True)
    email = fields.CharField(max_length=255, unique=True, null=True)
    phone = fields.CharField(max_length=20, unique=True, null=True)
    password_hash = fields.CharField(max_length=255, null=True)

    vpn_id = fields.CharField(max_length=36, null=True)
    server_id = fields.IntField(null=True)

    first_name = fields.CharField(max_length=100, null=True)
    last_name = fields.CharField(max_length=100, null=True)

    is_active = fields.BooleanField(default=True)
    is_admin = fields.BooleanField(default=False)

    referral_code = fields.CharField(max_length=20, unique=True, null=True)
    referred_by = fields.IntField(null=True)

    created_at = fields.DatetimeField(default=datetime.utcnow)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"

    def __str__(self):
        return f"User {self.id}: {self.email or self.phone}"
