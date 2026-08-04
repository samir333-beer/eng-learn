import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

DEFAULT_SECRET = "change-me-in-production-use-long-random-string"


@lru_cache
def get_settings():
    return Settings()


class Settings:
    def __init__(self) -> None:
        self.database_url: str = os.getenv(
            "DATABASE_URL", "sqlite:///./english_app.db"
        )
        self.secret_key: str = os.getenv("SECRET_KEY", DEFAULT_SECRET)
        self.access_token_expire_minutes: int = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")
        )
        self.algorithm: str = "HS256"
        self.code_expire_minutes: int = int(os.getenv("CODE_EXPIRE_MINUTES", "10"))
        self.smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_email: str = os.getenv("SMTP_EMAIL", "")
        self.smtp_app_password: str = os.getenv("SMTP_APP_PASSWORD", "")
        self.app_env: str = os.getenv("APP_ENV", "development")
        self.cors_origins: list[str] = [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:8081,http://localhost:19006,exp://localhost:8081",
            ).split(",")
            if o.strip()
        ]

        if self.app_env == "production" and self.secret_key == DEFAULT_SECRET:
            raise RuntimeError(
                "SECRET_KEY не задан! Установите надёжный SECRET_KEY в .env для production."
            )