import hashlib
import secrets


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_code(code: str) -> str:
    return hashlib.sha256(code.strip().encode()).hexdigest()


def verify_code(plain: str, hashed: str) -> bool:
    return hash_code(plain) == hashed
