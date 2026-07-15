# backend/Dockerfile
FROM python:3.10-slim

# ضبط مسار العمل الأساسي داخل الحاوية
WORKDIR /app

# نسخ ملف المتطلبات (بما أننا داخل مجلد backend، سنجد الملف هنا مباشرة)
COPY requirements.txt ./

# تثبيت المكتبات
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نسخ كل محتويات مجلد backend إلى /app داخل الحاوية
COPY . .

# ضبط المتغيرات البيئية
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# تشغيل التطبيق (بما أن ملفاتك في app/main.py)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
