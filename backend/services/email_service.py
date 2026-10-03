import logging
import smtplib
from email.mime.text import MIMEText

from core.config import get_settings

logger = logging.getLogger(__name__)


class EmailSendError(Exception):
    """Raised when an email cannot be sent via SMTP."""


def send_verification_email(to_email: str, code: str, purpose: str) -> None:
    """Send a verification code to the user's email via Gmail SMTP.

    Raises EmailSendError if the email cannot be sent (SMTP unavailable,
    invalid credentials, etc.) so the caller can notify the user.
    """
    settings = get_settings()

    if purpose == "login":
        subject = "Код для входа — English App"
    elif purpose == "reset":
        subject = "Код для сброса пароля — English App"
    else:
        subject = "Код регистрации — English App"

    body = (
        f"Ваш код подтверждения: {code}\n\n"
        f"Код действует {settings.code_expire_minutes} минут.\n"
        "Если вы не запрашивали этот код — просто проигнорируйте письмо."
    )

    if not settings.smtp_email or not settings.smtp_app_password:
        if settings.app_env != "production":
            logger.warning(
                "SMTP не настроен; код %s для %s (%s) выведен только для разработки",
                code,
                to_email,
                purpose,
            )
            return
        logger.error("SMTP не настроен в production")
        raise EmailSendError("SMTP не настроен")

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_email, settings.smtp_app_password)
            server.sendmail(settings.smtp_email, [to_email], msg.as_string())
    except Exception as exc:
        logger.error("SMTP error while sending to %s: %s", to_email, exc)
        raise EmailSendError("Не удалось отправить письмо") from exc