from datetime import datetime, timedelta, timezone
from jose import jwt
from jose.exceptions import JWTError
import bcrypt

from app.core.config import settings

ACCESS_TOKEN_EXPIRE = timedelta(minutes=15)
REFRESH_TOKEN_EXPIRE = timedelta(days=30)
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user_id), "type": "access", "iat": now, "exp": now + ACCESS_TOKEN_EXPIRE},
        settings.API_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user_id), "type": "refresh", "iat": now, "exp": now + REFRESH_TOKEN_EXPIRE},
        settings.API_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.API_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
