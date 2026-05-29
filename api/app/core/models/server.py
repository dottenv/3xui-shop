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

    xui_url = fields.CharField(max_length=255, default="")
    xui_username = fields.CharField(max_length=100, default="")
    xui_password = fields.CharField(max_length=255, default="")

    is_dedicated = fields.BooleanField(default=False)

    ssh_host = fields.CharField(max_length=255, default="")
    ssh_port = fields.IntField(default=22)
    ssh_username = fields.CharField(max_length=100, default="")
    ssh_password = fields.CharField(max_length=255, default="")
    ssh_key = fields.TextField(default="")

    config_public_key = fields.CharField(max_length=255, default="")
    config_short_id = fields.CharField(max_length=50, default="")
    config_sni = fields.CharField(max_length=255, default="")
    config_flow = fields.CharField(max_length=50, default="xtls-rprx-vision")

    created_at = fields.DatetimeField(default=datetime.utcnow)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "servers"

    def __str__(self):
        return f"{self.name} ({self.host})"

    @property
    def free_slots(self):
        return self.max_clients - self.current_clients
