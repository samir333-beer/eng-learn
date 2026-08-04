from pydantic import BaseModel


class PhraseResponse(BaseModel):
    id: int
    en: str
    ru: str
    topic: str
    level: str


class PhraseListResponse(BaseModel):
    items: list[PhraseResponse]
    total: int
    skip: int
    limit: int
