# backend/Dockerfile
FROM python:3.10-slim

# ضبط مسار العمل الأساسي
WORKDIR /app

# نسخ ملف المتطلبات
COPY requirements.txt ./requirements.txt

# تثبيت المكتبات
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نسخ كل شيء من المجلد الحالي إلى /app
COPY . .

# إنشاء المجلد لضمان عدم حدوث خطأ المسار
RUN mkdir -p /app/app/static

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
