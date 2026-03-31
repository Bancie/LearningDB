FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY learningdb ./learningdb

WORKDIR /app/learningdb

EXPOSE 8100

CMD ["uvicorn", "orchestrator.app:app", "--host", "0.0.0.0", "--port", "8100"]
