import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api.routes import auth, leaderboard, phrases, progress, quiz, srs
from api.routes.auth import limiter, verify_router
from core.config import get_settings
from db.init_db import init_database

app = FastAPI(title="English Learning API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verify_router)
app.include_router(phrases.router)
app.include_router(progress.router)
app.include_router(leaderboard.router)
app.include_router(quiz.router)
app.include_router(srs.router)


@app.on_event("startup")
def on_startup():
    init_database()


init_database()


@app.get("/health")
async def health():
    return {"status": "ok", "ready": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
