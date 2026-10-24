FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 appuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY compressor.py main.py ./
RUN mkdir -p /tmp/videopress_jobs && chown appuser /tmp/videopress_jobs

USER appuser
ENV PORT=8000
EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
