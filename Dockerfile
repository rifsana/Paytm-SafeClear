# Multi-stage build for unified Paytm ClearMoment deployment
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Static Server
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
