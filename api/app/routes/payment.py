from fastapi import APIRouter

router = APIRouter()


@router.get("/plans")
async def get_plans():
    return {"message": "Get plans endpoint"}


@router.post("/create")
async def create_payment():
    return {"message": "Create payment endpoint"}


@router.get("/status/{payment_id}")
async def check_payment_status(payment_id: str):
    return {"message": f"Check payment {payment_id}"}
