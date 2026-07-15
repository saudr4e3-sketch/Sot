# backend/Dockerfile
FROM python:3.10-slim

# Set a project working dir
WORKDIR /app

# Copy requirements relative to repo root
COPY backend/requirements.txt ./requirements.txt

# Install dependencies
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend folder
COPY backend/ .

# إنشاء المجلد مع إعطاء صلاحيات كاملة
RUN mkdir -p /app/app/static && chmod -R 777 /app/app/static

# ضبط مسار بايثون ليعرف مكان المجلد app
ENV PYTHONPATH=/app

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
