from data.phrases.level_a1 import PHRASES_A1
from data.phrases.level_a2 import PHRASES_A2
from data.phrases.level_b1 import PHRASES_B1
from data.phrases.level_b2 import PHRASES_B2

PHRASES: list[dict] = PHRASES_A1 + PHRASES_A2 + PHRASES_B1 + PHRASES_B2
PHRASE_BY_ID: dict[int, dict] = {p["id"]: p for p in PHRASES}
LEVELS = ("A1", "A2", "B1", "B2")
TOTAL_PHRASES = len(PHRASES)
