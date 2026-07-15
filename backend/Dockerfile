# backend/Dockerfile
FROM python:3.10-slim

# ضبط مسار العمل الأساسي
WORKDIR /app

# نسخ ملف المتطلبات من مجلد backend
COPY backend/requirements.txt ./requirements.txt

# تثبيت المكتبات
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نسخ كامل محتويات مجلد backend إلى /app داخل الحاوية
COPY backend/ .

# ضبط المتغيرات البيئية
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# تشغيل التطبيق (بما أن ملفاتك في backend/app/main.py)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
