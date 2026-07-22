import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from db import db_cursor

SECRET_KEY = os.environ.get("STUDIO_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-only-secret-change-me"))
TOKEN_TTL_SECONDS = 60 * 60 * 12  # 12h

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(username: str) -> str:
    payload = {"sub": username, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    payload_b64 = _b64url(json.dumps(payload).encode())
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64url(sig)}"


def verify_token(token: str) -> str:
    try:
        payload_b64, sig_b64 = token.split(".")
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(sig_b64), expected_sig):
            raise ValueError("bad signature")
        payload = json.loads(_b64url_decode(payload_b64))
        if payload["exp"] < time.time():
            raise ValueError("expired")
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def require_admin(creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")
    return verify_token(creds.credentials)


def ensure_default_admin():
    try:
        print("ADMIN START")

        default_user = os.environ.get("STUDIO_ADMIN_USER", "admin")
        default_hash = os.environ.get("ADMIN_PASSWORD_HASH")

        if not default_hash:
            print("Generating bcrypt hash...")
            default_hash = pwd_context.hash("admin")

        with db_cursor() as cur:
            print("Checking admin user...")
            cur.execute(
                "SELECT id FROM admin_users WHERE username = %s",
                (default_user,)
            )

            existing = cur.fetchone()
            print("Existing:", existing)

            if existing is None:
                print("Creating admin...")
                cur.execute(
                    """
                    INSERT INTO admin_users 
                    (username, password_hash, salt) 
                    VALUES (%s, %s, %s)
                    """,
                    (default_user, default_hash, ""),
                )
            else:
                print("Updating admin...")
                cur.execute(
                    """
                    UPDATE admin_users 
                    SET password_hash = %s, salt = ''
                    WHERE username = %s
                    """,
                    (default_hash, default_user),
                )

        print("ADMIN DONE")

    except Exception as e:
        print("ADMIN ERROR:", repr(e))
        raise
