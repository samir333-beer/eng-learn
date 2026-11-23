# Dockerfile для деплоя на хостинг (Amvera).
#
# Отличие от backend/Dockerfile: контекст сборки — корень репозитория,
# поэтому пути начинаются с backend/. Amvera ищет Dockerfile именно в корне,
# а backend/Dockerfile остаётся для локального docker compose (там контекст —
# папка backend).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# /data — точка монтирования постоянного диска Amvera: база SQLite переживает
# пересборку контейнера. Каталог создаём заранее и отдаём пользователю.
RUN useradd --create-home --shell /bin/bash appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /app /data
USER appuser

# Shell-форма, чтобы раскрылась $PORT. По умолчанию 8000 — этот же порт
# указан в amvera.yml (containerPort).
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
