from tortoise import fields
from tortoise.models import Model
from datetime import datetime


class Server(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    host = fields.CharField(max_length=255)
    port = fields.IntField(default=443)
    sub_port = fields.IntField(default=2096)

    location = fields.CharField(max_length=100, null=True)
    country = fields.CharField(max_length=2, null=True)
    flag = fields.CharField(max_length=10, null=True)

    max_clients = fields.IntField(default=100)
    current_clients = fields.IntField(default=0)

    is_active = fields.BooleanField(default=True)
    is_online = fields.BooleanField(default=False)

    inbound_id = fields.IntField(default=1)
    protocol = fields.CharField(max_length=50, default="vless")

    created_at = fields.DatetimeField(default=datetime.utcnow)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "servers"

    def __str__(self):
        return f"{self.name} ({self.host})"

    @property
    def free_slots(self):
        return self.max_clients - self.current_clients
