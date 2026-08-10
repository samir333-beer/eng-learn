from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from core.codes import generate_code, hash_code, verify_code
from core.config import get_settings
from core.security import hash_password, verify_password
from models.email_code import EmailCode
from models.user import User
from services.email_service import send_verification_email

MAX_CODE_ATTEMPTS = 5


def _to_aware_utc(dt: datetime) -> datetime:
    """Приводит дату к offset-aware UTC, если она naive.

    SQLite не хранит таймзону: даже при DateTime(timezone=True) значения,
    прочитанные из БД, возвращаются как naive. Поэтому перед сравнением с
    datetime.now(timezone.utc) (aware) такие даты из БД нужно приводить к
    aware — иначе Python выбросит TypeError:
    "can't compare offset-naive and offset-aware datetimes".
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@dataclass
class VerifyResult:
    """Result of an instant code validation (brute-force protected)."""

    ok: bool
    http_status: int = 400
    message: str = ""


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == normalize_email(email)).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username.strip().lower()).first()


def create_user_with_email(
    db: Session, email: str, username: str, password: str
) -> User:
    email_norm = normalize_email(email)
    user = User(
        email=email_norm,
        username=username.strip().lower(),
        hashed_password=hash_password(password),
        last_active_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_email_password(
    db: Session, email: str, password: str
) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def _invalidate_old_codes(db: Session, email: str, purpose: str) -> None:
    db.query(EmailCode).filter(
        EmailCode.email == email,
        EmailCode.purpose == purpose,
        EmailCode.used.is_(False),
    ).update({"used": True})
    db.commit()


def send_email_code(db: Session, email: str, purpose: str) -> None:
    settings = get_settings()
    email_norm = normalize_email(email)
    code = generate_code()
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.code_expire_minutes
    )
    _invalidate_old_codes(db, email_norm, purpose)
    record = EmailCode(
        email=email_norm,
        code_hash=hash_code(code),
        purpose=purpose,
        expires_at=expires,
    )
    db.add(record)
    db.commit()
    send_verification_email(email_norm, code, purpose)


def verify_email_code(db: Session, email: str, code: str, purpose: str) -> bool:
    email_norm = normalize_email(email)
    now = datetime.now(timezone.utc)
    record = (
        db.query(EmailCode)
        .filter(
            EmailCode.email == email_norm,
            EmailCode.purpose == purpose,
            EmailCode.used.is_(False),
        )
        .order_by(EmailCode.created_at.desc())
        .first()
    )
    if not record:
        return False
    if _to_aware_utc(record.expires_at) <= now:
        return False
    if not verify_code(code, record.code_hash):
        return False
    record.used = True
    db.commit()
    return True


def check_code_with_attempts(
    db: Session, email: str, code: str, purpose: str
) -> VerifyResult:
    """Instant code validation with brute-force protection and TTL.

    Unlike :func:`verify_email_code`, a successful check does NOT mark the
    code as used, so the final register/login step can still consume it.
    Failed attempts are counted per code record; after MAX_CODE_ATTEMPTS
    failures the code is locked until a new code is requested.
    """
    email_norm = normalize_email(email)
    now = datetime.now(timezone.utc)
    record = (
        db.query(EmailCode)
        .filter(
            EmailCode.email == email_norm,
            EmailCode.purpose == purpose,
            EmailCode.used.is_(False),
        )
        .order_by(EmailCode.created_at.desc())
        .first()
    )
    if not record:
        return VerifyResult(False, 400, "Код не найден. Запросите новый код.")

    if record.failed_attempts >= MAX_CODE_ATTEMPTS:
        return VerifyResult(
            False, 429, "Слишком много неверных попыток. Запросите новый код."
        )

    if _to_aware_utc(record.expires_at) <= now:
        return VerifyResult(
            False, 400, "Код истёк (действует 5 минут). Запросите новый код."
        )

    if not verify_code(code, record.code_hash):
        record.failed_attempts += 1
        db.commit()
        attempts_left = MAX_CODE_ATTEMPTS - record.failed_attempts
        if attempts_left <= 0:
            return VerifyResult(
                False, 429, "Слишком много неверных попыток. Запросите новый код."
            )
        return VerifyResult(
            False, 400, f"Неверный код. Осталось попыток: {attempts_left}"
        )

    return VerifyResult(ok=True)


def reset_password(db: Session, email: str, code: str, new_password: str) -> bool:
    """Validate the reset code and update the user's password.

    Returns True on success. Raises ValueError with a user-facing message
    when the code is invalid/expired or the user does not exist.
    """
    email_norm = normalize_email(email)
    user = get_user_by_email(db, email_norm)
    if not user:
        raise ValueError("Пользователь с такой почтой не найден")

    if not verify_email_code(db, email_norm, code, "reset"):
        raise ValueError("Неверный или просроченный код")

    user.hashed_password = hash_password(new_password)
    db.commit()
    return True
