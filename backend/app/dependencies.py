from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _fetch_jwks() -> list[dict]:
    """Fetch Supabase public JWKS (cached for process lifetime)."""
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    r = httpx.get(url, timeout=10)
    r.raise_for_status()
    return r.json()["keys"]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> dict:
    """Validate Supabase JWT (ES256) and return decoded payload (sub = user_id)."""
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        keys = _fetch_jwks()
        # Match by kid, fall back to first key
        key = next((k for k in keys if k.get("kid") == kid), keys[0])
        payload = jwt.decode(
            token,
            key,
            algorithms=["ES256", "HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return payload


CurrentUser = Annotated[dict, Depends(get_current_user)]
