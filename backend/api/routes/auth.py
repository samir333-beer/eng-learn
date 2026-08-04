from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from api.deps import get_current_user
from core.security import create_access_token
from db.session import get_db
from models.user import User
from schemas.auth import (
    EmailLoginCodeRequest,
    EmailPasswordLogin,
    EmailRegisterRequest,
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SendCodeRequest,
    TokenResponse,
    UserResponse,
)
from services.auth_service import (
    authenticate_email_password,
    create_user_with_email,
    get_user_by_email,
    get_user_by_username,
    reset_password,
    send_email_code,
    verify_email_code,
)
from services.email_service import EmailSendError
from services.stats_service import touch_user_active

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/email/send-code", response_model=MessageResponse)
@limiter.limit("5/minute")
def send_code(request: Request, data: SendCodeRequest, db: Session = Depends(get_db)):
    email = data.email
    if data.purpose == "register":
        if get_user_by_email(db, email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Эта почта уже используется",
            )
    elif data.purpose in ("login", "reset"):
        if not get_user_by_email(db, email):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь с такой почтой не найден",
            )
    try:
        send_email_code(db, email, data.purpose)
    except EmailSendError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить письмо, попробуйте позже",
        ) from exc
    return MessageResponse(message="Код отправлен на почту")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """Send a password-reset code to the user's email."""
    if not get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь с такой почтой не найден",
        )
    try:
        send_email_code(db, data.email, "reset")
    except EmailSendError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить письмо, попробуйте позже",
        ) from exc
    return MessageResponse(message="Код отправлен на почту")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def reset_password_endpoint(
    request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    """Validate the reset code and set a new password."""
    try:
        reset_password(db, data.email, data.code, data.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return MessageResponse(message="Пароль изменён")


@router.post("/email/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register_email(
    request: Request, data: EmailRegisterRequest, db: Session = Depends(get_db)
):
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Эта почта уже используется",
        )
    if get_user_by_username(db, data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя пользователя уже занято",
        )
    if not verify_email_code(db, data.email, data.code, "register"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный или просроченный код",
        )
    user = create_user_with_email(
        db, data.email, data.username, data.password
    )
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/email/login-code", response_model=TokenResponse)
@limiter.limit("15/minute")
def login_with_code(
    request: Request, data: EmailLoginCodeRequest, db: Session = Depends(get_db)
):
    user = get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if not verify_email_code(db, data.email, data.code, "login"):
        raise HTTPException(
            status_code=400, detail="Неверный или просроченный код"
        )
    touch_user_active(db, user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login_password(
    request: Request, data: EmailPasswordLogin, db: Session = Depends(get_db)
):
    user = authenticate_email_password(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная почта или пароль",
        )
    touch_user_active(db, user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
