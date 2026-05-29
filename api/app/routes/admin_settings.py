from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Dict
from app.core.models import Setting
from app.routes.admin import get_current_admin

router = APIRouter()


class SettingUpdate(BaseModel):
    values: Dict[str, str]

    @field_validator("values")
    @classmethod
    def validate_values(cls, v):
        for key, value in v.items():
            allowed = {"maintenance_site", "maintenance_app", "lang"}
            if key in {"maintenance_site", "maintenance_app"} and value not in ("0", "1"):
                raise ValueError(f"Invalid value for {key}: must be '0' or '1'")
            if key not in allowed:
                raise ValueError(f"Unknown setting: {key}")
        return v


@router.get("/settings")
async def get_settings(admin=Depends(get_current_admin)):
    rows = await Setting.all().order_by("key")
    return [{key: row.key, value: row.value} for row in rows]


@router.put("/settings")
async def update_settings(body: SettingUpdate, admin=Depends(get_current_admin)):
    for key, value in body.values.items():
        setting = await Setting.get_or_none(key=key)
        if setting:
            setting.value = value
            await setting.save()
        else:
            await Setting.create(key=key, value=value)
    rows = await Setting.all().order_by("key")
    return [{key: row.key, value: row.value} for row in rows]
