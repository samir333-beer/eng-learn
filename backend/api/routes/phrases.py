from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_user
from data.phrases.catalog import LEVELS
from db.session import get_db
from models.user import User
from schemas.phrase import PhraseListResponse, PhraseResponse
from services.phrase_service import get_phrase_by_id, get_phrases_page, get_random_phrase
from services.stats_service import record_view

router = APIRouter(prefix="/phrases", tags=["phrases"])


@router.get("/levels")
def list_levels(_: User = Depends(get_current_user)):
    return {"levels": list(LEVELS)}


@router.get("/random", response_model=PhraseResponse)
def random_phrase(
    level: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    phrase = get_random_phrase(level, topic)
    record_view(db, user.id, phrase.id)
    return phrase


@router.get("/", response_model=PhraseListResponse)
def list_phrases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    level: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    _: User = Depends(get_current_user),
):
    items, total = get_phrases_page(skip, limit, level, topic)
    return PhraseListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{phrase_id}", response_model=PhraseResponse)
def get_phrase(phrase_id: int, _: User = Depends(get_current_user)):
    phrase = get_phrase_by_id(phrase_id)
    if not phrase:
        raise HTTPException(status_code=404, detail="Фраза не найдена")
    return phrase
