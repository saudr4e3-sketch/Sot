# backend/Dockerfile
FROM python:3.10-slim

# Set a project working dir
WORKDIR /app

# Copy requirements relative to repo root (assumes docker build from repo root)
COPY backend/requirements.txt ./requirements.txt

# Install dependencies
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend folder (includes app/ and static assets under backend/app/static/)
COPY backend/ .

# إنشاء المجلد يدوياً لضمان عدم حدوث خطأ Runtime عند التشغيل
RUN mkdir -p /app/app/static

# إضافة هذا السطر لإصلاح خطأ ModuleNotFoundError
ENV PYTHONPATH=/app

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Start the app using uvicorn (same entrypoint as Render guide)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
