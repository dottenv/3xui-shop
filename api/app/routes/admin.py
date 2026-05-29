from fastapi import APIRouter

router = APIRouter()


@router.get("/users")
async def get_users():
    return {"message": "Get users endpoint"}


@router.get("/servers")
async def get_servers():
    return {"message": "Get servers endpoint"}


@router.get("/transactions")
async def get_transactions():
    return {"message": "Get transactions endpoint"}
