FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Непривилегированный пользователь: если процесс скомпрометируют,
# он не получит root внутри контейнера.
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

# Shell-форма нужна, чтобы раскрылась переменная $PORT: хостинги (Render,
# Railway) передают порт через окружение, а не фиксируют 8000.
# --reload здесь не нужен: это режим разработки, он следит за файлами
# и перезапускает процесс.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
