import random

from data.phrases.catalog import PHRASES
from schemas.quiz import QuizQuestion, QuizResponse


def _build_question(phrase: dict, pool: list[dict]) -> QuizQuestion:
    """Строит вопрос: перевод фразы + 3 неправильных варианта."""
    correct = phrase["ru"]
    wrong_options = [p["ru"] for p in pool if p["id"] != phrase["id"]]
    random.shuffle(wrong_options)
    options = [correct] + wrong_options[:3]
    random.shuffle(options)
    return QuizQuestion(
        phrase_id=phrase["id"],
        en=phrase["en"],
        level=phrase["level"],
        options=options,
        correct_index=options.index(correct),
    )


def get_quiz(level: str | None = None, count: int = 10) -> QuizResponse:
    """Возвращает набор вопросов для тренировки."""
    pool = PHRASES
    if level:
        pool = [p for p in pool if p["level"] == level.upper()]
    if not pool:
        pool = PHRASES

    count = max(1, min(count, 20))
    selected = random.sample(pool, min(count, len(pool)))
    questions = [_build_question(p, pool) for p in selected]
    return QuizResponse(questions=questions, total=len(questions))