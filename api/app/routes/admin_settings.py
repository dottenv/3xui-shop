from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.models import Setting, IpWhitelist
from app.routes.admin import get_current_admin, require_root
from datetime import datetime

router = APIRouter()

ALLOWED_KEYS = {"maintenance_app", "lang", "maintenance_site"}


class SettingUpdate(BaseModel):
    model_config = {"extra": "allow"}


class WhitelistCreate(BaseModel):
    ip_address: str
    comment: Optional[str] = None


@router.get("/settings")
async def get_settings(admin=Depends(get_current_admin)):
    rows = await Setting.all().order_by("key")
    return [{"key": row.key, "value": row.value} for row in rows]


@router.put("/settings")
async def update_settings(body: SettingUpdate, admin=Depends(get_current_admin)):
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key not in ALLOWED_KEYS:
            raise HTTPException(status_code=400, detail=f"Unknown setting: {key}")
        if key == "maintenance_app" and value not in ("0", "1"):
            raise HTTPException(status_code=400, detail=f"Invalid value for {key}: must be '0' or '1'")
        if key == "lang" and len(value) != 2:
            raise HTTPException(status_code=400, detail=f"Invalid lang: {value}")
        setting = await Setting.get_or_none(key=key)
        if setting:
            setting.value = value
            await setting.save()
        else:
            await Setting.create(key=key, value=value)
    rows = await Setting.all().order_by("key")
    return [{"key": row.key, "value": row.value} for row in rows]


@router.get("/whitelist")
async def get_whitelist(admin=Depends(get_current_admin)):
    rows = await IpWhitelist.all().order_by("-created_at")
    return [
        {"id": r.id, "ip_address": r.ip_address, "comment": r.comment, "is_active": r.is_active, "created_at": r.created_at.isoformat()}
        for r in rows
    ]


@router.post("/whitelist")
async def add_whitelist(body: WhitelistCreate, admin=Depends(get_current_admin)):
    existing = await IpWhitelist.filter(ip_address=body.ip_address).first()
    if existing:
        raise HTTPException(status_code=409, detail="IP already in whitelist")
    row = await IpWhitelist.create(
        ip_address=body.ip_address,
        comment=body.comment,
        created_by=admin.id,
    )
    return {"id": row.id, "ip_address": row.ip_address, "comment": row.comment, "is_active": row.is_active}


@router.delete("/whitelist/{item_id}")
async def remove_whitelist(item_id: int, admin=Depends(get_current_admin)):
    row = await IpWhitelist.get_or_none(id=item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    await row.delete()
    return {"detail": "Deleted"}
