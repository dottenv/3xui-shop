from fastapi import APIRouter

router = APIRouter()


@router.post("/cryptomus")
async def cryptomus_webhook():
    return {"message": "Cryptomus webhook"}


@router.post("/heleket")
async def heleket_webhook():
    return {"message": "Heleket webhook"}


@router.post("/yookassa")
async def yookassa_webhook():
    return {"message": "YooKassa webhook"}


@router.post("/yoomoney")
async def yoomoney_webhook():
    return {"message": "YooMoney webhook"}
