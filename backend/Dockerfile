# backend/Dockerfile
FROM python:3.10-slim

# ضبط مسار العمل الأساسي
WORKDIR /app

# نسخ ملف المتطلبات
COPY requirements.txt ./

# تثبيت المكتبات
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- العلاج هنا ---
# بما أنك غيرت الـ WORKDIR ليكون /app
# فقم بنسخ محتويات المجلد الحالي (بما فيها app/ و static/) إلى /app مباشرة
COPY . .
# ------------------

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# بما أن الملفات أصبحت في /app/app/main.py
# (حيث app الأولى هي المجلد، و app الثانية هي المجلد الفرعي للكود)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
