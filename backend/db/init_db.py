from sqlalchemy import inspect

from db.base import Base
from db.session import engine
from models.email_code import EmailCode  # noqa: F401
from models.progress import UserProgress  # noqa: F401
from models.srs_card import SRSCard  # noqa: F401
from models.user import User  # noqa: F401

REQUIRED_USER_COLUMNS = {"email", "last_active_at", "study_time_seconds", "streak_days", "last_streak_date"}


def _needs_reset() -> bool:
    insp = inspect(engine)
    if not insp.has_table("users"):
        return False
    cols = {c["name"] for c in insp.get_columns("users")}
    return not REQUIRED_USER_COLUMNS.issubset(cols)


def init_database() -> None:
    if _needs_reset():
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
