FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml .
COPY alembic.ini .

RUN pip install --upgrade pip && pip install -e ".[dev]"

COPY app ./app

RUN mkdir -p /app/storage/uploads

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]