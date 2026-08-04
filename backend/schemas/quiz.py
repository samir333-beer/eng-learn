from pydantic import BaseModel


class QuizQuestion(BaseModel):
    phrase_id: int
    en: str
    level: str
    options: list[str]
    correct_index: int


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
    total: int