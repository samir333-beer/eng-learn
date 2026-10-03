# Импорт всех моделей, чтобы они регистрировались в Base.metadata
from models.email_code import EmailCode  # noqa: F401
from models.progress import UserProgress  # noqa: F401
from models.srs_card import SRSCard  # noqa: F401
from models.user import User  # noqa: F401
