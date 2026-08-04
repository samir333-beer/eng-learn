from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.deps import get_current_user
from data.phrases.catalog import PHRASE_BY_ID
from db.session import get_db
from models.user import User
from schemas.stats import ProgressRequest, StatsResponse
from services.stats_service import get_user_stats, mark_learned, record_view

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/stats", response_model=StatsResponse)
def my_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_stats(db, user.id)


@router.post("/view")
def log_view(
    data: ProgressRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.phrase_id not in PHRASE_BY_ID:
        raise HTTPException(status_code=404, detail="Фраза не найдена")
    record_view(db, user.id, data.phrase_id)
    return {"ok": True}


@router.post("/learned")
def log_learned(
    data: ProgressRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.phrase_id not in PHRASE_BY_ID:
        raise HTTPException(status_code=404, detail="Фраза не найдена")
    mark_learned(db, user.id, data.phrase_id)
    return {"ok": True}
