from fastapi import APIRouter

router = APIRouter()


@router.get("/profile")
async def get_profile():
    return {"message": "Get profile endpoint"}


@router.put("/profile")
async def update_profile():
    return {"message": "Update profile endpoint"}


@router.get("/subscription")
async def get_subscription():
    return {"message": "Get subscription endpoint"}
