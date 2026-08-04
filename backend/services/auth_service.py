from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from core.codes import generate_code, hash_code, verify_code
from core.config import get_settings
from core.security import hash_password, verify_password
from models.email_code import EmailCode
from models.user import User
from services.email_service import send_verification_email


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
            EmailCode.expires_at > now,
        )
        .order_by(EmailCode.created_at.desc())
        .first()
    )
    if not record or not verify_code(code, record.code_hash):
        return False
    record.used = True
    db.commit()
    return True


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
