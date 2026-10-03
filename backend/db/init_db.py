from sqlalchemy import inspect, text

from db.base import Base
from db.session import engine
from models.email_code import EmailCode  # noqa: F401
from models.progress import UserProgress  # noqa: F401
from models.srs_card import SRSCard  # noqa: F401
from models.user import User  # noqa: F401

def _migrate_users_nullable_password() -> None:
    """Делает колонку hashed_password nullable (для Google-пользователей без пароля).

    SQLite не поддерживает ALTER COLUMN, поэтому таблица пересоздаётся
    с сохранением всех данных. Внешние ключи временно отключаются.
    """
    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    pw_col = next(
        (c for c in insp.get_columns("users") if c["name"] == "hashed_password"),
        None,
    )
    if not pw_col or pw_col["nullable"]:
        return

    if engine.dialect.name != "sqlite":
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL")
            )
        return

    raw = engine.raw_connection()
    try:
        raw.execute("PRAGMA foreign_keys=OFF")
        raw.execute(
            """
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255),
                username VARCHAR(64),
                hashed_password VARCHAR(255),
                google_id VARCHAR(255),
                created_at DATETIME,
                last_active_at DATETIME,
                study_time_seconds INTEGER DEFAULT 0,
                streak_days INTEGER DEFAULT 0,
                last_streak_date DATETIME
            )
            """
        )
        raw.execute(
            """
            INSERT INTO users_new (
                id, email, username, hashed_password, google_id,
                created_at, last_active_at, study_time_seconds,
                streak_days, last_streak_date
            )
            SELECT
                id, email, username, hashed_password, google_id,
                created_at, last_active_at, study_time_seconds,
                streak_days, last_streak_date
            FROM users
            """
        )
        raw.execute("DROP TABLE users")
        raw.execute("ALTER TABLE users_new RENAME TO users")
        raw.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)")
        raw.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)")
        raw.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)")
        raw.commit()
        raw.execute("PRAGMA foreign_keys=ON")
    finally:
        raw.close()


def _add_missing_columns() -> None:
    """Add columns from newer models without deleting existing user data."""
    datetime_type = "TIMESTAMP"
    migrations = {
        "users": {
            "email": "VARCHAR(255)",
            "last_active_at": datetime_type,
            "study_time_seconds": "INTEGER DEFAULT 0",
            "streak_days": "INTEGER DEFAULT 0",
            "last_streak_date": datetime_type,
        },
        "email_codes": {
            "failed_attempts": "INTEGER DEFAULT 0",
        },
    }
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, columns in migrations.items():
            if not inspector.has_table(table):
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    connection.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
                    )


def init_database() -> None:
    _migrate_users_nullable_password()
    _add_missing_columns()
    Base.metadata.create_all(bind=engine)
