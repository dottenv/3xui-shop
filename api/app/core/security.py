from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_EXPIRE = timedelta(minutes=15)
REFRESH_EXPIRE = timedelta(days=30)


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    return jwt.encode(
        {"sub": str(user_id), "type": "access", "exp": datetime.now(timezone.utc) + ACCESS_EXPIRE},
        settings.API_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: int) -> str:
    return jwt.encode(
        {"sub": str(user_id), "type": "refresh", "exp": datetime.now(timezone.utc) + REFRESH_EXPIRE},
        settings.API_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.API_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
