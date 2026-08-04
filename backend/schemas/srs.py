from pydantic import BaseModel


class SRSCardItem(BaseModel):
    card_id: int
    phrase_id: int
    en: str
    ru: str
    topic: str
    level: str
    is_new: bool
    box: int


class SRSReviewResponse(BaseModel):
    items: list[SRSCardItem]
    total: int


class SRSReviewRequest(BaseModel):
    card_id: int
    quality: int  # 0 = не знаю, 1 = знаю


class SRSReviewResult(BaseModel):
    card_id: int
    phrase_id: int
    box: int
    interval_days: int
    next_review_at: str | None = None


class SRSStatsResponse(BaseModel):
    total_cards: int
    due_cards: int
    new_cards: int
    learned_cards: int