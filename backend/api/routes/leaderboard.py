from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.deps import get_current_user
from db.session import get_db
from models.user import User
from schemas.leaderboard import LeaderboardResponse, StudyTimeRequest
from services.leaderboard_service import (
    add_study_time,
    get_time_leaderboard,
    get_words_leaderboard,
)
from services.stats_service import touch_user_active

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/words", response_model=LeaderboardResponse)
def leaderboard_words(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_words_leaderboard(db, user.id)


@router.get("/time", response_model=LeaderboardResponse)
def leaderboard_time(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_time_leaderboard(db, user.id)


@router.post("/study-time")
def log_study_time(
    data: StudyTimeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = add_study_time(db, user, data.seconds)
    touch_user_active(db, user)
    return {"ok": True, "study_time_seconds": total}
