# backend/Dockerfile
FROM python:3.10-slim

# ضبط مسار العمل الأساسي
WORKDIR /app

# نسخ ملف المتطلبات من المسار النسبي الصحيح
# إذا كان Render يبدأ من مجلد backend، فهذا السطر سيعمل
# إذا كان يبدأ من الجذر، فهذا السطر سيعمل أيضاً
COPY requirements.txt ./requirements.txt

# تثبيت المكتبات
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نسخ كل شيء من المجلد الحالي إلى /app
COPY . .

# إنشاء المجلد مع إعطاء صلاحيات كاملة
RUN mkdir -p /app/app/static && chmod -R 777 /app/app/static

# ضبط مسار بايثون ليعرف مكان المجلد app
ENV PYTHONPATH=/app

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
