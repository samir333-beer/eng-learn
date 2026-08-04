from fastapi import APIRouter, Depends, Query

from api.deps import get_current_user
from models.user import User
from schemas.quiz import QuizResponse
from services.quiz_service import get_quiz

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/", response_model=QuizResponse)
def quiz(
    level: str | None = Query(default=None),
    count: int = Query(default=10, ge=1, le=20),
    _: User = Depends(get_current_user),
):
    return get_quiz(level=level, count=count)