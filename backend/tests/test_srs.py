import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.base import Base
from models.srs_card import SRSCard
from models.user import User
from services.srs_service import (
    get_review_session,
    get_srs_stats,
    review_card,
    get_new_cards,
    get_due_cards,
)

# Используем in-memory SQLite для тестов
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def setup_module():
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)


def _make_user(db, email="test@test.com", username="tester"):
    user = User(email=email, username=username, hashed_password="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_new_cards_created():
    db = TestingSession()
    user = _make_user(db)
    cards = get_new_cards(db, user.id, limit=5)
    assert len(cards) == 5
    assert all(c.user_id == user.id for c in cards)
    db.close()


def test_review_session_returns_new_cards():
    db = TestingSession()
    user = _make_user(db, email="test2@test.com", username="tester2")
    session = get_review_session(db, user.id, limit=10)
    assert session.total > 0
    assert all(item.is_new for item in session.items)
    db.close()


def test_review_known_increases_box():
    db = TestingSession()
    user = _make_user(db, email="test3@test.com", username="tester3")
    cards = get_new_cards(db, user.id, limit=1)
    card = cards[0]
    result = review_card(db, user.id, card.id, 1)
    assert result["box"] == 1
    assert result["interval_days"] == 1
    db.close()


def test_review_unknown_resets_box():
    db = TestingSession()
    user = _make_user(db, email="test4@test.com", username="tester4")
    cards = get_new_cards(db, user.id, limit=1)
    card = cards[0]
    # Сначала "знаю" — бокс 1
    review_card(db, user.id, card.id, 1)
    # Потом "не знаю" — сброс в бокс 0
    result = review_card(db, user.id, card.id, 0)
    assert result["box"] == 0
    assert result["interval_days"] == 1
    db.close()


def test_due_cards_after_review():
    db = TestingSession()
    user = _make_user(db, email="test5@test.com", username="tester5")
    cards = get_new_cards(db, user.id, limit=1)
    card = cards[0]
    # Отвечаем "знаю" — next_review_at = завтра, не due сегодня
    review_card(db, user.id, card.id, 1)
    due = get_due_cards(db, user.id)
    assert card.id not in [c.id for c in due]
    db.close()


def test_srs_stats():
    db = TestingSession()
    user = _make_user(db, email="test6@test.com", username="tester6")
    get_new_cards(db, user.id, limit=3)
    stats = get_srs_stats(db, user.id)
    assert stats.total_cards == 3
    assert stats.new_cards == 3
    assert stats.learned_cards == 0
    db.close()