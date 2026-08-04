from sqlalchemy import func
from sqlalchemy.orm import Session

from models.progress import UserProgress
from models.user import User
from schemas.leaderboard import LeaderboardEntry, LeaderboardResponse

LEADERBOARD_LIMIT = 100


def get_words_leaderboard(db: Session, user_id: int | None = None) -> LeaderboardResponse:
    learned_sq = func.count(UserProgress.id).filter(UserProgress.learned.is_(True)).label(
        "learned_count"
    )
    rows = (
        db.query(User.id, User.username, learned_sq)
        .outerjoin(UserProgress, User.id == UserProgress.user_id)
        .group_by(User.id, User.username)
        .having(learned_sq > 0)
        .order_by(learned_sq.desc(), User.username.asc())
        .limit(LEADERBOARD_LIMIT)
        .all()
    )

    entries = [
        LeaderboardEntry(rank=i + 1, user_id=r.id, username=r.username, value=int(r.learned_count))
        for i, r in enumerate(rows)
    ]

    my_rank, my_value = _my_words_rank(db, user_id) if user_id else (None, None)
    return LeaderboardResponse(
        category="words",
        total=len(entries),
        entries=entries,
        my_rank=my_rank,
        my_value=my_value,
    )


def _my_words_rank(db: Session, user_id: int) -> tuple[int | None, int | None]:
    my_count = (
        db.query(func.count(UserProgress.id))
        .filter(UserProgress.user_id == user_id, UserProgress.learned.is_(True))
        .scalar()
        or 0
    )
    if my_count == 0:
        return None, 0

    subq = (
        db.query(UserProgress.user_id, func.count(UserProgress.id).label("cnt"))
        .filter(UserProgress.learned.is_(True))
        .group_by(UserProgress.user_id)
        .subquery()
    )
    ahead = (
        db.query(func.count())
        .select_from(subq)
        .filter(subq.c.cnt > my_count)
        .scalar()
        or 0
    )
    return int(ahead) + 1, int(my_count)


def get_time_leaderboard(db: Session, user_id: int | None = None) -> LeaderboardResponse:
    rows = (
        db.query(User.id, User.username, User.study_time_seconds)
        .filter(User.study_time_seconds > 0)
        .order_by(User.study_time_seconds.desc(), User.username.asc())
        .limit(LEADERBOARD_LIMIT)
        .all()
    )

    entries = [
        LeaderboardEntry(
            rank=i + 1, user_id=r.id, username=r.username, value=int(r.study_time_seconds)
        )
        for i, r in enumerate(rows)
    ]

    my_rank, my_value = _my_time_rank(db, user_id) if user_id else (None, None)
    return LeaderboardResponse(
        category="time",
        total=len(entries),
        entries=entries,
        my_rank=my_rank,
        my_value=my_value,
    )


def _my_time_rank(db: Session, user_id: int) -> tuple[int | None, int | None]:
    user = db.get(User, user_id)
    if not user:
        return None, 0
    my_time = user.study_time_seconds
    if my_time == 0:
        return None, 0
    ahead = (
        db.query(func.count(User.id))
        .filter(User.study_time_seconds > my_time)
        .scalar()
        or 0
    )
    return int(ahead) + 1, int(my_time)


def add_study_time(db: Session, user: User, seconds: int) -> int:
    user.study_time_seconds += seconds
    db.commit()
    db.refresh(user)
    return user.study_time_seconds
