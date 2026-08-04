import random

from data.phrases.catalog import PHRASE_BY_ID, PHRASES, TOTAL_PHRASES
from schemas.phrase import PhraseResponse


def _filter_pool(level: str | None = None, topic: str | None = None) -> list[dict]:
    pool = PHRASES
    if level:
        pool = [p for p in pool if p["level"] == level.upper()]
    if topic:
        pool = [p for p in pool if p["topic"] == topic.lower()]
    return pool


def get_random_phrase(
    level: str | None = None, topic: str | None = None
) -> PhraseResponse:
    pool = _filter_pool(level, topic)
    if not pool:
        pool = PHRASES
    return PhraseResponse(**random.choice(pool))


def get_phrases_page(
    skip: int = 0,
    limit: int = 20,
    level: str | None = None,
    topic: str | None = None,
) -> tuple[list[PhraseResponse], int]:
    pool = _filter_pool(level, topic)
    total = len(pool)
    page = pool[skip : skip + limit]
    return [PhraseResponse(**p) for p in page], total


def get_phrase_by_id(phrase_id: int) -> PhraseResponse | None:
    item = PHRASE_BY_ID.get(phrase_id)
    return PhraseResponse(**item) if item else None


def get_total_count() -> int:
    return TOTAL_PHRASES
