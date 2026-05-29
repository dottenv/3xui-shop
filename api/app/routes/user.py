from fastapi import APIRouter, Depends
from app.core.schemas import UserResponse, ProfileUpdate
from app.core.models import User
from app.core.deps import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: ProfileUpdate, user: User = Depends(get_current_user)):
    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name
    await user.save()
    return user


@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    return {
        "is_active": bool(user.vpn_id and user.server_id),
        "server_id": user.server_id,
        "vpn_id": user.vpn_id,
    }
