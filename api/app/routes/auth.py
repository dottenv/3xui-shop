from fastapi import APIRouter, HTTPException, status, Request
from app.core.schemas import (
    RegisterRequest, LoginRequest, RefreshRequest,
    ChangePasswordRequest, TokenResponse, UserResponse,
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.models import User
from app.core.deps import get_current_user
from fastapi import Depends
from datetime import datetime

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    if request.client:
        return request.client.host
    return ""


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, request: Request):
    existing = await User.get_or_none(email=body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    ip = _client_ip(request)
    ua = request.headers.get("user-agent", "")
    user = await User.create(
        email=body.email,
        password_hash=hash_password(body.password),
        registration_ip=ip,
        registration_user_agent=ua,
        last_ip=ip,
        last_login=datetime.utcnow(),
        last_user_agent=ua,
    )
    user = await User.get(email=body.email)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    user = await User.get_or_none(email=body.email)
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is blocked")
    user.last_ip = _client_ip(request)
    user.last_user_agent = request.headers.get("user-agent", "")
    user.last_login = datetime.utcnow()
    await user.save()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = await User.get_or_none(id=int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный текущий пароль")
    if body.new_password == body.current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Новый пароль совпадает с текущим")
    user.password_hash = hash_password(body.new_password)
    await user.save()
    return {"detail": "Пароль изменён"}
