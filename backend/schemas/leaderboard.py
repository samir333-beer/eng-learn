from pydantic import BaseModel, Field


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    value: int


class LeaderboardResponse(BaseModel):
    category: str
    total: int
    entries: list[LeaderboardEntry]
    my_rank: int | None = None
    my_value: int | None = None


class StudyTimeRequest(BaseModel):
    seconds: int = Field(ge=1, le=300)
