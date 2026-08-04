from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from data.phrases.catalog import PHRASE_BY_ID, PHRASES
from models.srs_card import SRSCard
from schemas.srs import SRSReviewResponse, SRSStatsResponse

# Интервалы Лейтнера (в днях) для каждого бокса
BOX_INTERVALS = [0, 1, 3, 7, 14, 30]
MAX_BOX = 5
DAILY_NEW_LIMIT = 10
DAILY_REVIEW_LIMIT = 20


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _get_or_create_card(db: Session, user_id: int, phrase_id: int) -> SRSCard:
    card = (
        db.query(SRSCard)
        .filter(SRSCard.user_id == user_id, SRSCard.phrase_id == phrase_id)
        .first()
    )
    if not card:
        card = SRSCard(user_id=user_id, phrase_id=phrase_id)
        db.add(card)
        db.flush()
    return card


def get_due_cards(db: Session, user_id: int, limit: int = 20) -> list[SRSCard]:
    """Карточки, которые нужно повторить сегодня (next_review_at <= now)."""
    now = _now()
    return (
        db.query(SRSCard)
        .filter(
            SRSCard.user_id == user_id,
            SRSCard.next_review_at.isnot(None),
            SRSCard.next_review_at <= now,
        )
        .order_by(SRSCard.next_review_at.asc())
        .limit(limit)
        .all()
    )


def get_new_cards(db: Session, user_id: int, limit: int = 10) -> list[SRSCard]:
    """Новые карточки, которые ещё не добавлены в SRS."""
    existing_ids = {
        row[0]
        for row in db.query(SRSCard.phrase_id).filter(SRSCard.user_id == user_id).all()
    }
    new_phrases = [p for p in PHRASES if p["id"] not in existing_ids]
    # Сначала новые фразы из нижних уровней (A1 -> B2)
    level_order = {"A1": 0, "A2": 1, "B1": 2, "B2": 3}
    new_phrases.sort(key=lambda p: (level_order.get(p["level"], 9), p["id"]))
    selected = new_phrases[:limit]
    return [_get_or_create_card(db, user_id, p["id"]) for p in selected]


def get_review_session(
    db: Session, user_id: int, limit: int = 20
) -> SRSReviewResponse:
    """Собирает сессию повторения: due-карточки + новые."""
    due = get_due_cards(db, user_id, limit=DAILY_REVIEW_LIMIT)
    new_count = max(0, limit - len(due))
    new = get_new_cards(db, user_id, limit=min(new_count, DAILY_NEW_LIMIT))

    cards = due + new
    items = []
    for card in cards:
        phrase = PHRASE_BY_ID.get(card.phrase_id)
        if not phrase:
            continue
        items.append(
            {
                "card_id": card.id,
                "phrase_id": phrase["id"],
                "en": phrase["en"],
                "ru": phrase["ru"],
                "topic": phrase["topic"],
                "level": phrase["level"],
                "is_new": card.repetitions == 0,
                "box": card.box,
            }
        )
    return SRSReviewResponse(items=items, total=len(items))


def review_card(
    db: Session, user_id: int, card_id: int, quality: int
) -> dict:
    """Обрабатывает ответ пользователя по алгоритму Лейтнера.

    quality: 0 = не знаю, 1 = знаю
    """
    card = db.get(SRSCard, card_id)
    if not card or card.user_id != user_id:
        raise ValueError("Карточка не найдена")

    now = _now()
    card.last_reviewed_at = now

    if quality == 0:
        # Не знаю — сбрасываем в бокс 0, повторяем завтра
        card.box = 0
        card.interval_days = 1
        card.repetitions = 0
        card.wrong_count += 1
        card.next_review_at = now + timedelta(days=1)
    else:
        # Знаю — повышаем бокс
        card.correct_count += 1
        card.repetitions += 1
        if card.box < MAX_BOX:
            card.box += 1
        card.interval_days = BOX_INTERVALS[card.box]
        card.next_review_at = now + timedelta(days=card.interval_days)

    db.commit()
    db.refresh(card)

    return {
        "card_id": card.id,
        "phrase_id": card.phrase_id,
        "box": card.box,
        "interval_days": card.interval_days,
        "next_review_at": card.next_review_at.isoformat() if card.next_review_at else None,
    }


def get_srs_stats(db: Session, user_id: int) -> SRSStatsResponse:
    """Статистика SRS для пользователя."""
    total = (
        db.query(func.count(SRSCard.id)).filter(SRSCard.user_id == user_id).scalar() or 0
    )
    due = (
        db.query(func.count(SRSCard.id))
        .filter(
            SRSCard.user_id == user_id,
            SRSCard.next_review_at.isnot(None),
            SRSCard.next_review_at <= _now(),
        )
        .scalar()
        or 0
    )
    new = total - (
        db.query(func.count(SRSCard.id))
        .filter(SRSCard.user_id == user_id, SRSCard.repetitions > 0)
        .scalar()
        or 0
    )
    learned = (
        db.query(func.count(SRSCard.id))
        .filter(SRSCard.user_id == user_id, SRSCard.box >= 3)
        .scalar()
        or 0
    )
    return SRSStatsResponse(
        total_cards=total,
        due_cards=due,
        new_cards=new,
        learned_cards=learned,
    )