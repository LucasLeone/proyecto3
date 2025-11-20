from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Tuple

import jwt
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication

from .repositories import get_user_by_id


def _now_utc():
    return datetime.now(tz=timezone.utc)


def generate_token(user: dict) -> str:
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "email": user["email"],
        "exp": _now_utc() + timedelta(minutes=settings.JWT_ACCESS_TTL_MINUTES),
        "iat": _now_utc(),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])


class AuthenticatedUser(SimpleNamespace):
    @property
    def is_authenticated(self):
        return True


class JWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request) -> Tuple[AuthenticatedUser, str]:
        header = request.headers.get("Authorization")
        if not header:
            return None

        if " " not in header:
            raise exceptions.AuthenticationFailed("Authorization header is invalid")

        scheme, token = header.split(" ", 1)
        if scheme.lower() != self.keyword.lower():
            return None

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expirado")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Token inválido")

        user = get_user_by_id(payload.get("sub"))
        if not user or not user.get("is_active", True):
            raise exceptions.AuthenticationFailed("Usuario no encontrado o inactivo")

        auth_user = AuthenticatedUser(
            id=user["id"],
            role=user["role"],
            email=user["email"],
            name=user.get("full_name"),
            raw=user,
        )
        return auth_user, token
