# Smoke-тест API: полный пользовательский сценарий через HTTP
import json
import sqlite3
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = "http://127.0.0.1:8000"
DB = "english_app.db"

sys.path.insert(0, ".")
from core.codes import hash_code  # noqa: E402

RUN = str(int(time.time()))
EMAIL = f"smoke-{RUN}@example.com"
USERNAME = f"smoke-{RUN}"
PASSWORD = "SuperSecret123"
CODE = "123456"

results = []


def check(name, ok, extra=""):
    results.append((name, ok, extra))
    print(("PASS" if ok else "FAIL"), "-", name, extra)


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}


# 1. Health
s, b = req("GET", "/health")
check("GET /health", s == 200 and b.get("status") == "ok")

# 2. Отправка кода регистрации
s, b = req("POST", "/auth/email/send-code", {"email": EMAIL, "purpose": "register"})
check("POST /auth/email/send-code", s == 200 and "message" in b, str(b))

# 3. Подменяем код в БД на известный (SMTP не настроен, код уходит в консоль)
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute(
    "UPDATE email_codes SET code_hash = ?, expires_at = ?, used = 0 WHERE email = ? AND purpose = 'register'",
    (
        hash_code(CODE),
        (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        EMAIL,
    ),
)
assert cur.rowcount >= 1, "код не найден в БД"
conn.commit()
conn.close()

# 4. Регистрация
s, b = req("POST", "/auth/email/register", {"email": EMAIL, "username": USERNAME, "password": PASSWORD, "code": CODE})
check("POST /auth/email/register", s == 200 and "access_token" in b, str(b)[:120])
TOKEN = b.get("access_token", "")

# 5. Повторная регистрация с тем же email — должна быть ошибка
s, b = req("POST", "/auth/email/register", {"email": EMAIL, "username": USERNAME, "password": PASSWORD, "code": CODE})
check("register duplicate email -> 400", s == 400, str(b))

# 6. Логин по паролю
s, b = req("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
check("POST /auth/login", s == 200 and "access_token" in b, str(b)[:120])
TOKEN = b.get("access_token", TOKEN)

# 7. Логин с неверным паролем
s, b = req("POST", "/auth/login", {"email": EMAIL, "password": "wrong"})
check("login wrong password -> 401", s == 401, str(b))

# 8. /auth/me
s, b = req("GET", "/auth/me", token=TOKEN)
check("GET /auth/me", s == 200 and b.get("email") == EMAIL, str(b)[:120])

# 9. Без токена — 401/403
s, b = req("GET", "/auth/me")
check("GET /auth/me без токена -> 401/403", s in (401, 403), f"status={s}")

# 10. Фразы
s, b = req("GET", "/phrases/?limit=5", token=TOKEN)
check("GET /phrases/", s == 200 and len(b.get("items", [])) == 5 and b.get("total") > 0, f"total={b.get('total')}")

s, b = req("GET", "/phrases/levels", token=TOKEN)
check("GET /phrases/levels", s == 200 and b.get("levels") == ["A1", "A2", "B1", "B2"], str(b))

s, b = req("GET", "/phrases/random?level=B2", token=TOKEN)
check("GET /phrases/random?level=B2", s == 200 and b.get("level") == "B2", str(b)[:120])

s, b = req("GET", "/phrases/1", token=TOKEN)
check("GET /phrases/1", s == 200 and b.get("en") == "Hello", str(b)[:120])

# 11. Квиз
s, b = req("GET", "/quiz/?level=A1&count=5", token=TOKEN)
ok = s == 200 and len(b.get("questions", [])) == 5 and all(len(q.get("options", [])) == 4 for q in b.get("questions", []))
check("GET /quiz/?level=A1&count=5", ok, str(b)[:120])

# 12. Прогресс
s, b = req("POST", "/progress/view", {"phrase_id": 1}, token=TOKEN)
check("POST /progress/view", s == 200 and b.get("ok") is True, str(b))
s, b = req("POST", "/progress/learned", {"phrase_id": 1}, token=TOKEN)
check("POST /progress/learned", s == 200 and b.get("ok") is True, str(b))
s, b = req("GET", "/progress/stats", token=TOKEN)
check("GET /progress/stats", s == 200 and b.get("phrases_learned", 0) >= 1, str(b)[:160])

# 13. SRS
s, b = req("GET", "/srs/review?limit=3", token=TOKEN)
check("GET /srs/review", s == 200 and b.get("total", 0) > 0, str(b)[:160])
items = b.get("items", [])
if items:
    card_id = items[0]["card_id"]
    s, b = req("POST", "/srs/review", {"card_id": card_id, "quality": 1}, token=TOKEN)
    check("POST /srs/review (знаю)", s == 200 and b.get("box") == 1, str(b)[:120])
    s, b = req("POST", "/srs/review", {"card_id": card_id, "quality": 0}, token=TOKEN)
    check("POST /srs/review (не знаю)", s == 200 and b.get("box") == 0, str(b)[:120])
s, b = req("GET", "/srs/stats", token=TOKEN)
check("GET /srs/stats", s == 200 and b.get("total_cards", 0) >= 1, str(b)[:160])

# 14. Лидерборд
s, b = req("POST", "/leaderboard/study-time", {"seconds": 120}, token=TOKEN)
check("POST /leaderboard/study-time", s == 200 and b.get("study_time_seconds", 0) >= 120, str(b))
s, b = req("GET", "/leaderboard/words", token=TOKEN)
check("GET /leaderboard/words", s == 200 and len(b.get("entries", [])) > 0, str(b)[:160])
s, b = req("GET", "/leaderboard/time", token=TOKEN)
check("GET /leaderboard/time", s == 200 and len(b.get("entries", [])) > 0, str(b)[:160])

# 15. Несуществующая фраза
s, b = req("GET", "/phrases/99999", token=TOKEN)
check("GET /phrases/99999 -> 404", s == 404, f"status={s}")

# Итог
passed = sum(1 for _, ok, _ in results if ok)
print(f"\n=== {passed}/{len(results)} passed ===")
sys.exit(0 if passed == len(results) else 1)
