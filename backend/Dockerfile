FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create entrypoint script (outside /app so bind-mounts won't overwrite it)
RUN echo '#!/bin/sh\n\
set -e\n\
mkdir -p /app/cache\n\
python manage.py migrate --noinput\n\
python manage.py collectstatic --noinput\n\
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080 --workers 3 --timeout 120' > /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
