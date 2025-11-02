from __future__ import annotations

import hashlib
import secrets
from typing import Final


_SALT_SIZE: Final[int] = 16


def hash_password(password: str) -> str:
    """Create a salted SHA-256 hash stored as `<salt>$<digest>`."""
    salt = secrets.token_hex(_SALT_SIZE)
    digest = hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, digest = hashed.split("$", 1)
    except ValueError:
        return False
    calculated = hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()
    return secrets.compare_digest(calculated, digest)


__all__ = ["hash_password", "verify_password"]
