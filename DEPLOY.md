# 🚀 Деплой инструкция

## Быстрый деплой (Railway + Vercel)

### 1. Backend на Railway

```bash
# 1. Зарегистрируйся на railway.app
# 2. Создай новый проект → PostgreSQL database
# 3. Добавь Python service из GitHub
# 4. Environment variables:
DATABASE_URL=<из PostgreSQL service>
SECRET_KEY=<генерируй: openssl rand -hex 32>
FRONTEND_URL=https://your-app.vercel.app
```

**Railway Dockerfile** (уже есть в `/backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend на Vercel

```bash
# 1. Зарегистрируйся на vercel.com
# 2. Import репозиторий
# 3. Root directory: frontend
# 4. Environment variable:
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Build settings** (автоопределяются):
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### 3. Проверка

```bash
# Backend health:
curl https://your-backend.railway.app/health
# → {"status":"healthy"}

# Frontend:
open https://your-app.vercel.app
```

---

## Альтернатива: Docker Compose (VPS)

Если есть свой сервер:

```bash
# 1. Скопируй на сервер
scp -r project1/ user@server:/app/

# 2. На сервере
cd /app
docker compose up -d

# 3. Nginx reverse proxy:
server {
    listen 80;
    server_name wishlist.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
    
    location /api/items/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Готово! 🎉

Ссылки для сдачи:
- **Приложение**: https://your-app.vercel.app
- **GitHub**: https://github.com/your-username/wishlist-app
- **Backend API**: https://your-backend.railway.app/docs
