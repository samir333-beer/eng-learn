from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from data.phrases.catalog import LEVELS, TOTAL_PHRASES
from models.progress import UserProgress
from models.user import User
from schemas.stats import StatsResponse


def touch_user_active(db: Session, user: User) -> None:
    now = datetime.now(timezone.utc)
    user.last_active_at = now

    # Обновляем серию дней (streak)
    today = now.date()
    if user.last_streak_date is None:
        user.streak_days = 1
        user.last_streak_date = now
    else:
        last = user.last_streak_date.date()
        if last == today:
            pass  # уже сегодня
        elif (today - last).days == 1:
            user.streak_days += 1
            user.last_streak_date = now
        else:
            user.streak_days = 1
            user.last_streak_date = now

    db.commit()


def record_view(db: Session, user_id: int, phrase_id: int) -> None:
    row = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == user_id,
            UserProgress.phrase_id == phrase_id,
        )
        .first()
    )
    now = datetime.now(timezone.utc)
    if row:
        row.view_count += 1
        row.last_seen_at = now
    else:
        row = UserProgress(user_id=user_id, phrase_id=phrase_id, view_count=1)
        db.add(row)
    db.commit()


def mark_learned(db: Session, user_id: int, phrase_id: int) -> None:
    row = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == user_id,
            UserProgress.phrase_id == phrase_id,
        )
        .first()
    )
    now = datetime.now(timezone.utc)
    if row:
        row.learned = True
        row.learned_at = now
        row.last_seen_at = now
    else:
        db.add(
            UserProgress(
                user_id=user_id,
                phrase_id=phrase_id,
                learned=True,
                learned_at=now,
                view_count=1,
            )
        )
    db.commit()


def get_user_stats(db: Session, user_id: int) -> StatsResponse:
    learned = (
        db.query(func.count(UserProgress.id))
        .filter(UserProgress.user_id == user_id, UserProgress.learned.is_(True))
        .scalar()
        or 0
    )
    views = (
        db.query(func.coalesce(func.sum(UserProgress.view_count), 0))
        .filter(UserProgress.user_id == user_id)
        .scalar()
        or 0
    )
    seen = (
        db.query(func.count(UserProgress.id))
        .filter(UserProgress.user_id == user_id)
        .scalar()
        or 0
    )
    by_level: dict[str, int] = {lvl: 0 for lvl in LEVELS}
    rows = (
        db.query(UserProgress.phrase_id)
        .filter(UserProgress.user_id == user_id, UserProgress.learned.is_(True))
        .all()
    )
    from data.phrases.catalog import PHRASE_BY_ID

    for (pid,) in rows:
        p = PHRASE_BY_ID.get(pid)
        if p:
            lvl = p["level"]
            by_level[lvl] = by_level.get(lvl, 0) + 1

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_days = (
        db.query(func.count(func.distinct(func.date(UserProgress.last_seen_at))))
        .filter(
            UserProgress.user_id == user_id,
            UserProgress.last_seen_at >= week_ago,
        )
        .scalar()
        or 0
    )

    progress_pct = round((learned / TOTAL_PHRASES) * 100, 1) if TOTAL_PHRASES else 0

    user = db.get(User, user_id)
    study_time = user.study_time_seconds if user else 0
    streak_days = user.streak_days if user else 0

    return StatsResponse(
        phrases_learned=learned,
        phrases_seen=seen,
        total_views=int(views),
        total_phrases=TOTAL_PHRASES,
        progress_percent=progress_pct,
        active_days_week=int(active_days),
        study_time_seconds=int(study_time),
        streak_days=int(streak_days),
        by_level=by_level,
    )
