FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .

RUN pip install --upgrade pip && pip install -e ".[dev]"

COPY app ./app

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]