from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
async def register():
    return {"message": "Register endpoint"}


@router.post("/login")
async def login():
    return {"message": "Login endpoint"}


@router.post("/verify")
async def verify():
    return {"message": "Verify endpoint"}
