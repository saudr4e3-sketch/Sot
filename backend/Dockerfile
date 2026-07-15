# backend/Dockerfile
FROM python:3.10-slim

# Set working directory to /app
WORKDIR /app

# Copy requirements (بما أننا داخل مجلد backend، الملف موجود هنا مباشرة)
COPY requirements.txt ./requirements.txt

# Install dependencies
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy everything else from backend to /app
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
