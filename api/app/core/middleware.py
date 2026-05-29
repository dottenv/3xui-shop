from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp
from app.core.security import decode_token
from app.core.models import User, Admin

SKIP_PATHS = {
    "/health",
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/public/maintenance",
    "/public/config",
    "/public/plans",
    "/public/langs",
    "/payment/plans",
    "/user/servers",
}


class ActiveUserMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        path = request.url.path

        if path in SKIP_PATHS or path.startswith(("/docs", "/openapi.json", "/webhooks")):
            await self.app(scope, receive, send)
            return

        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth[7:]
            payload = decode_token(token)
            if payload:
                token_type = payload.get("type")
                user_id = int(payload["sub"])
                try:
                    if token_type == "access":
                        user = await User.get_or_none(id=user_id)
                        if not user or not user.is_active:
                            response = JSONResponse(
                                status_code=401,
                                content={"detail": "Account is blocked"},
                            )
                            await response(scope, receive, send)
                            return
                    elif token_type == "admin_access":
                        admin = await Admin.get_or_none(id=user_id)
                        if not admin or not admin.is_active:
                            response = JSONResponse(
                                status_code=401,
                                content={"detail": "Admin account is blocked"},
                            )
                            await response(scope, receive, send)
                            return
                except Exception:
                    pass

        await self.app(scope, receive, send)
