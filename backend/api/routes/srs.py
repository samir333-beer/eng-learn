from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_current_user
from db.session import get_db
from models.user import User
from schemas.srs import (
    SRSReviewRequest,
    SRSReviewResponse,
    SRSReviewResult,
    SRSStatsResponse,
)
from services.srs_service import (
    DAILY_NEW_LIMIT,
    DAILY_REVIEW_LIMIT,
    get_review_session,
    get_srs_stats,
    review_card,
)

router = APIRouter(prefix="/srs", tags=["srs"])


@router.get("/review", response_model=SRSReviewResponse)
def review_session(
    limit: int = Query(default=20, ge=1, le=DAILY_REVIEW_LIMIT + DAILY_NEW_LIMIT),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_review_session(db, user.id, limit=limit)


@router.post("/review", response_model=SRSReviewResult)
def submit_review(
    data: SRSReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.quality not in (0, 1):
        raise HTTPException(status_code=400, detail="quality должен быть 0 или 1")
    try:
        return review_card(db, user.id, data.card_id, data.quality)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/stats", response_model=SRSStatsResponse)
def srs_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_srs_stats(db, user.id)