from pydantic import BaseModel


class StatsResponse(BaseModel):
    phrases_learned: int
    phrases_seen: int
    total_views: int
    total_phrases: int
    progress_percent: float
    active_days_week: int
    study_time_seconds: int
    streak_days: int
    by_level: dict[str, int]


class ProgressRequest(BaseModel):
    phrase_id: int
