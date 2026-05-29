from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.security import (
    hash_password, verify_password,
    create_admin_access_token, create_admin_refresh_token,
    decode_token,
)
from app.core.models import Admin, User, Server, Transaction, Subscription, IpWhitelist
from app.core.services.xui import XuiService

router = APIRouter()
admin_bearer = HTTPBearer(auto_error=False)


# --- Schemas ---

class AdminRegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminRefreshRequest(BaseModel):
    refresh_token: str


class AdminTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AdminCreateRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="admin", pattern="^(admin|root)$")


class AdminResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserRow(BaseModel):
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    last_ip: Optional[str] = None
    last_login: Optional[datetime] = None
    registration_ip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dependencies ---

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(admin_bearer),
) -> Admin:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "admin_access":
        raise HTTPException(status_code=401, detail="Invalid token")
    admin = await Admin.get_or_none(id=int(payload["sub"]))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


async def require_root(admin: Admin = Depends(get_current_admin)) -> Admin:
    if admin.role != "root":
        raise HTTPException(status_code=403, detail="Only root can perform this action")
    return admin


# --- Routes ---

@router.get("/check")
async def check_admins():
    count = await Admin.all().count()
    return {"has_admins": count > 0}


@router.post("/register")
async def register_first_admin(body: AdminRegisterRequest):
    count = await Admin.all().count()
    if count > 0:
        raise HTTPException(status_code=400, detail="Admin already exists. Login instead.")
    existing = await Admin.get_or_none(email=body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already taken")
    admin = await Admin.create(
        email=body.email,
        password_hash=hash_password(body.password),
        role="root",
    )
    admin = await Admin.get(email=body.email)  # re-fetch to get autoincremented id
    return AdminTokenResponse(
        access_token=create_admin_access_token(admin.id),
        refresh_token=create_admin_refresh_token(admin.id),
    )


@router.post("/login")
async def admin_login(body: AdminLoginRequest):
    admin = await Admin.get_or_none(email=body.email)
    if not admin or not admin.is_active or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AdminTokenResponse(
        access_token=create_admin_access_token(admin.id),
        refresh_token=create_admin_refresh_token(admin.id),
    )


@router.post("/refresh")
async def admin_refresh(body: AdminRefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "admin_refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    admin = await Admin.get_or_none(id=int(payload["sub"]))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found")
    return AdminTokenResponse(
        access_token=create_admin_access_token(admin.id),
        refresh_token=create_admin_refresh_token(admin.id),
    )


@router.get("/me", response_model=AdminResponse)
async def get_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.get("/list", response_model=list[AdminResponse])
async def list_admins(admin: Admin = Depends(require_root)):
    return await Admin.all().order_by("id")


@router.post("/create")
async def create_admin(body: AdminCreateRequest, admin: Admin = Depends(require_root)):
    existing = await Admin.get_or_none(email=body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already taken")
    new_admin = await Admin.create(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        created_by=admin.id,
    )
    new_admin = await Admin.get(email=body.email)
    return {"id": new_admin.id, "email": new_admin.email, "role": new_admin.role}


class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


@router.get("/users", response_model=list[UserRow])
async def get_users(admin: Admin = Depends(get_current_admin)):
    return await User.all().order_by("-created_at")


@router.put("/users/{user_id}", response_model=UserRow)
async def update_user(user_id: int, body: UserUpdateRequest, admin: Admin = Depends(get_current_admin)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    await User.filter(id=user_id).update(**updates)
    return await User.get(id=user_id)


@router.post("/users/{user_id}/toggle-block")
async def toggle_user_block(user_id: int, admin: Admin = Depends(get_current_admin)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await user.save()
    return {"id": user.id, "is_active": user.is_active}


@router.post("/users/{user_id}/toggle-admin")
async def toggle_user_admin(user_id: int, admin: Admin = Depends(get_current_admin)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    await user.save()
    return {"id": user.id, "is_admin": user.is_admin}


@router.post("/users/{user_id}/whitelist")
async def add_user_to_whitelist(user_id: int, admin: Admin = Depends(get_current_admin)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ip = user.last_ip or user.registration_ip
    if not ip:
        raise HTTPException(status_code=400, detail="User has no IP address recorded")
    existing = await IpWhitelist.filter(ip_address=ip).first()
    if existing:
        raise HTTPException(status_code=409, detail="IP already in whitelist")
    row = await IpWhitelist.create(
        ip_address=ip,
        comment=f"User: {user.email or f'#{user.id}'}",
        created_by=admin.id,
    )
    return {"id": row.id, "ip_address": row.ip_address, "comment": row.comment, "is_active": row.is_active}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: Admin = Depends(require_root)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
    return {"detail": "User deleted"}


@router.get("/servers")
async def get_servers(admin: Admin = Depends(get_current_admin)):
    servers = await Server.all().order_by("id")
    return [
        {
            "id": s.id,
            "name": s.name,
            "host": s.host,
            "port": s.port,
            "sub_port": s.sub_port,
            "location": s.location,
            "country": s.country,
            "flag": s.flag,
            "max_clients": s.max_clients,
            "current_clients": s.current_clients,
            "is_active": s.is_active,
            "is_online": s.is_online,
            "inbound_id": s.inbound_id,
            "protocol": s.protocol,
            "xui_url": s.xui_url,
            "xui_username": s.xui_username,
            "xui_api_token": bool(s.xui_api_token),
            "is_dedicated": s.is_dedicated,
            "ssh_host": s.ssh_host,
            "ssh_port": s.ssh_port,
            "ssh_username": s.ssh_username,
            "config_public_key": s.config_public_key,
            "config_short_id": s.config_short_id,
            "config_sni": s.config_sni,
            "config_flow": s.config_flow,
        }
        for s in servers
    ]


class ServerCreateRequest(BaseModel):
    name: str = Field(..., max_length=100)
    host: str = Field(..., max_length=255)
    port: int = Field(default=443)
    sub_port: int = Field(default=2096)
    location: Optional[str] = None
    country: Optional[str] = None
    flag: Optional[str] = None
    max_clients: int = Field(default=100)
    inbound_id: int = Field(default=1)
    protocol: str = Field(default="vless")
    xui_url: str = Field(default="")
    xui_username: str = Field(default="")
    xui_password: str = Field(default="")
    xui_api_token: str = Field(default="")
    is_dedicated: bool = Field(default=False)
    ssh_host: str = Field(default="")
    ssh_port: int = Field(default=22)
    ssh_username: str = Field(default="")
    ssh_password: str = Field(default="")
    ssh_key: str = Field(default="")
    config_public_key: str = Field(default="")
    config_short_id: str = Field(default="")
    config_sni: str = Field(default="")
    config_flow: str = Field(default="xtls-rprx-vision")


class ServerUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    host: Optional[str] = Field(None, max_length=255)
    port: Optional[int] = None
    sub_port: Optional[int] = None
    location: Optional[str] = None
    country: Optional[str] = None
    flag: Optional[str] = None
    max_clients: Optional[int] = None
    current_clients: Optional[int] = None
    inbound_id: Optional[int] = None
    protocol: Optional[str] = None
    is_active: Optional[bool] = None
    is_online: Optional[bool] = None
    xui_url: Optional[str] = None
    xui_username: Optional[str] = None
    xui_password: Optional[str] = None
    xui_api_token: Optional[str] = None
    is_dedicated: Optional[bool] = None
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = None
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_key: Optional[str] = None
    config_public_key: Optional[str] = None
    config_short_id: Optional[str] = None
    config_sni: Optional[str] = None
    config_flow: Optional[str] = None


@router.post("/servers")
async def create_server(body: ServerCreateRequest, admin: Admin = Depends(get_current_admin)):
    server = await Server.create(**body.model_dump())
    return {"id": server.id, "name": server.name, "host": server.host}


@router.put("/servers/{server_id}")
async def update_server(server_id: int, body: ServerUpdateRequest,
                        admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    await Server.filter(id=server_id).update(**updates)
    return await Server.get(id=server_id)


@router.delete("/servers/{server_id}")
async def delete_server(server_id: int, admin: Admin = Depends(require_root)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    await server.delete()
    return {"detail": "Server deleted"}


@router.post("/servers/{server_id}/test")
async def test_server_connection(server_id: int, admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    xui = XuiService(
        host=server.xui_url or server.host,
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        ok = await xui.test_connection()
        return {"success": ok, "message": "Connection successful" if ok else "Connection failed"}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        await xui.close()



@router.get("/subscriptions")
async def get_subscriptions(admin: Admin = Depends(get_current_admin)):
    subs = await Subscription.all().order_by("-created_at").limit(100)
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "plan_id": s.plan_id,
            "server_id": s.server_id,
            "client_uuid": s.client_uuid,
            "is_active": s.is_active,
            "expires_at": s.expires_at.isoformat(),
            "created_at": s.created_at.isoformat(),
        }
        for s in subs
    ]


@router.post("/subscriptions/{sub_id}/revoke")
async def revoke_subscription(sub_id: int, admin: Admin = Depends(get_current_admin)):
    sub = await Subscription.get_or_none(id=sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if sub.client_uuid:
        server = await Server.get_or_none(id=sub.server_id)
        if server:
            try:
                xui = XuiService(
                    host=server.xui_url or server.host,
                    username=server.xui_username,
                    password=server.xui_password,
                    api_token=server.xui_api_token,
                )
                await xui.delete_client(server.inbound_id, sub.client_uuid)
                await xui.close()
            except Exception:
                pass
    sub.is_active = False
    await sub.save()
    return {"detail": "Subscription revoked"}


@router.post("/servers/{server_id}/clean-depleted")
async def clean_depleted(server_id: int, admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    xui = XuiService(
        host=server.xui_url or server.host,
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        await xui.clean_depleted(server.inbound_id)
        return {"detail": "Depleted clients cleaned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await xui.close()


@router.post("/servers/{server_id}/install-speedtest")
async def install_speedtest(server_id: int, admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if not server.ssh_host:
        raise HTTPException(status_code=400, detail="SSH not configured for this server")
    try:
        import asyncssh
        async with asyncssh.connect(
            host=server.ssh_host,
            port=server.ssh_port or 22,
            username=server.ssh_username,
            password=server.ssh_password or None,
            client_keys=[server.ssh_key] if server.ssh_key else None,
            known_hosts=None,
        ) as ssh:
            result = await ssh.run("curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -")
            return {"detail": "Speedtest installed", "output": result.stdout}
    except ImportError:
        raise HTTPException(status_code=500, detail="asyncssh not installed. Run: pip install asyncssh")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions")
async def get_transactions(admin: Admin = Depends(get_current_admin)):
    txns = await Transaction.all().order_by("-created_at").limit(100)
    return [
        {
            "id": t.id,
            "uuid": t.uuid,
            "user_id": t.user_id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "paid_at": t.paid_at.isoformat() if t.paid_at else None,
        }
        for t in txns
    ]


@router.post("/servers/{server_id}/fetch-inbounds")
async def fetch_server_inbounds(server_id: int, admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    xui = XuiService(
        host=server.xui_url or server.host,
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        inbounds = await xui.get_inbounds()
        return {"success": True, "inbounds": inbounds}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        await xui.close()


@router.post("/servers/{server_id}/restart-xray")
async def restart_server_xray(server_id: int, admin: Admin = Depends(get_current_admin)):
    server = await Server.get_or_none(id=server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    xui = XuiService(
        host=server.xui_url or server.host,
        username=server.xui_username,
        password=server.xui_password,
        api_token=server.xui_api_token,
    )
    try:
        result = await xui.restart_xray()
        return {"success": True, "message": result.get("msg", "Xray restarted")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await xui.close()


@router.get("/stats")
async def get_stats(admin: Admin = Depends(get_current_admin)):
    users_total = await User.all().count()
    users_active = await User.filter(is_active=True).count()
    servers_total = await Server.all().count()
    servers_online = await Server.filter(is_online=True).count()
    revenue = await Transaction.filter(status="completed").all()
    total_revenue = sum(float(t.amount) for t in revenue if t.amount)
    return {
        "users_total": users_total,
        "users_active": users_active,
        "servers_total": servers_total,
        "servers_online": servers_online,
        "total_revenue": round(total_revenue, 2),
        "transactions_total": len(revenue),
    }
