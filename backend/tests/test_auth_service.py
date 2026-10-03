from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.base import Base
from models import (  # noqa: F401 — регистрирует все модели в Base.metadata
    EmailCode,
    SRSCard,
    User,
    UserProgress,
)
from services import auth_service
from services.auth_service import (
    MAX_CODE_ATTEMPTS,
    check_code_with_attempts,
    create_user_with_email,
    reset_password,
    send_email_code,
    verify_email_code,
)
from core.security import verify_password


engine = create_engine(
    "sqlite:///:memory:", connect_args={"check_same_thread": False}
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def setup_module():
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)


def test_email_is_normalized_when_user_is_created():
    db = TestingSession()
    user = create_user_with_email(db, " User@Example.COM ", "Tester", "secret")
    assert user.email == "user@example.com"
    assert user.username == "tester"
    db.close()


def test_code_can_be_verified_only_once(monkeypatch):
    db = TestingSession()
    monkeypatch.setattr(auth_service, "generate_code", lambda: "123456")
    monkeypatch.setattr(auth_service, "send_verification_email", lambda *args: None)

    send_email_code(db, "code@example.com", "register")
    assert verify_email_code(db, "CODE@example.com", "123456", "register") is True
    assert verify_email_code(db, "code@example.com", "123456", "register") is False
    db.close()


def test_code_is_locked_after_maximum_failed_attempts(monkeypatch):
    db = TestingSession()
    monkeypatch.setattr(auth_service, "generate_code", lambda: "654321")
    monkeypatch.setattr(auth_service, "send_verification_email", lambda *args: None)
    send_email_code(db, "locked@example.com", "register")

    for _ in range(MAX_CODE_ATTEMPTS):
        result = check_code_with_attempts(
            db, "locked@example.com", "000000", "register"
        )
    assert result.http_status == 429
    assert check_code_with_attempts(
        db, "locked@example.com", "654321", "register"
    ).http_status == 429
    db.close()


def test_reset_password_consumes_reset_code(monkeypatch):
    db = TestingSession()
    user = create_user_with_email(db, "reset@example.com", "reset-user", "old-pass")
    monkeypatch.setattr(auth_service, "generate_code", lambda: "111222")
    monkeypatch.setattr(auth_service, "send_verification_email", lambda *args: None)
    send_email_code(db, user.email, "reset")

    assert reset_password(db, user.email, "111222", "new-pass") is True
    db.refresh(user)
    assert verify_password("new-pass", user.hashed_password)
    assert verify_email_code(db, user.email, "111222", "reset") is False
    db.close()


def test_verify_code_request_defaults_to_register_purpose():
    from schemas.auth import VerifyCodeRequest

    default_request = VerifyCodeRequest(email="purpose@example.com", code="123456")
    assert default_request.purpose == "register"
    assert (
        VerifyCodeRequest(
            email="purpose@example.com", code="123456", purpose="reset"
        ).purpose
        == "reset"
    )


def test_check_code_with_attempts_respects_purpose(monkeypatch):
    db = TestingSession()
    monkeypatch.setattr(auth_service, "generate_code", lambda: "777888")
    monkeypatch.setattr(auth_service, "send_verification_email", lambda *args: None)

    # Код, отправленный для сброса, не проходит проверку как код регистрации...
    send_email_code(db, "reset-purpose@example.com", "reset")
    assert (
        check_code_with_attempts(
            db, "reset-purpose@example.com", "777888", "register"
        ).ok
        is False
    )
    # ...но проходит как код сброса.
    assert (
        check_code_with_attempts(db, "reset-purpose@example.com", "777888", "reset").ok
        is True
    )

    # И наоборот: код регистрации не подходит для сброса.
    send_email_code(db, "register-purpose@example.com", "register")
    assert (
        check_code_with_attempts(
            db, "register-purpose@example.com", "777888", "register"
        ).ok
        is True
    )
    assert (
        check_code_with_attempts(
            db, "register-purpose@example.com", "777888", "reset"
        ).ok
        is False
    )
    db.close()
