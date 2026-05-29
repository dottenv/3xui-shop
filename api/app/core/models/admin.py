from tortoise import fields
from tortoise.models import Model
from datetime import datetime


class Admin(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    password_hash = fields.CharField(max_length=255)
    role = fields.CharField(max_length=20, default="admin")  # root | admin
    is_active = fields.BooleanField(default=True)
    created_by = fields.IntField(null=True)
    created_at = fields.DatetimeField(default=datetime.utcnow)

    class Meta:
        table = "admins"

    def __str__(self):
        return f"Admin {self.id}: {self.email} ({self.role})"
