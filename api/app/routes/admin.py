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
from app.core.models import Admin, User, Server, Transaction

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
            "location": s.location,
            "country": s.country,
            "flag": s.flag,
            "max_clients": s.max_clients,
            "current_clients": s.current_clients,
            "is_active": s.is_active,
            "is_online": s.is_online,
        }
        for s in servers
    ]


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
