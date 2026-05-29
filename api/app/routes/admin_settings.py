from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from app.core.models import Setting
from app.routes.admin import get_current_admin

router = APIRouter()

ALLOWED_KEYS = {"maintenance_site", "maintenance_app", "lang"}


class SettingUpdate(BaseModel):
    model_config = {"extra": "allow"}

    @field_validator("maintenance_site", "maintenance_app")
    @classmethod
    def validate_maintenance(cls, v):
        if v not in ("0", "1"):
            raise ValueError("Must be '0' or '1'")
        return v


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
        setting = await Setting.get_or_none(key=key)
        if setting:
            setting.value = value
            await setting.save()
        else:
            await Setting.create(key=key, value=value)
    rows = await Setting.all().order_by("key")
    return [{"key": row.key, "value": row.value} for row in rows]
