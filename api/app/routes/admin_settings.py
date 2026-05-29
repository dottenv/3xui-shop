from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.models import Setting
from app.routes.admin import get_current_admin

router = APIRouter()


class SettingUpdate(BaseModel):
    maintenance_site: Optional[str] = None
    maintenance_app: Optional[str] = None


@router.get("/settings")
async def get_settings(admin=Depends(get_current_admin)):
    rows = await Setting.all().order_by("key")
    return {row.key: row.value for row in rows}


@router.put("/settings")
async def update_settings(body: SettingUpdate, admin=Depends(get_current_admin)):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        if value not in ("0", "1"):
            raise HTTPException(status_code=400, detail=f"Invalid value for {key}: must be '0' or '1'")
        setting = await Setting.get_or_none(key=key)
        if setting:
            setting.value = value
            await setting.save()
        else:
            await Setting.create(key=key, value=value)
    return await Setting.all().order_by("key")
